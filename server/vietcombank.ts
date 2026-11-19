import type Database from 'better-sqlite3';

export type VcbRateMode = 'sell' | 'transfer' | 'buy';

export interface VietcombankUsdRate {
  buy: number;
  transfer: number;
  sell: number;
  rateMode: VcbRateMode;
  activeRate: number;
  bankDateTime: string;
  fetchedAt: string;
  source: string;
  isLive: boolean;
}

const VCB_XML_URL = 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10';
const CACHE_TTL_MS = 5 * 60 * 1000; // Respect Vietcombank 5-minute XML guideline
const MIN_MANUAL_COOLDOWN_MS = 15 * 1000;

const DEFAULT_FALLBACK: Omit<VietcombankUsdRate, 'rateMode' | 'activeRate'> = {
  buy: 25520,
  transfer: 25550,
  sell: 25930,
  bankDateTime: '',
  fetchedAt: '',
  source: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
  isLive: false,
};

let memoryCache: { data: Omit<VietcombankUsdRate, 'rateMode' | 'activeRate'>; fetchedMs: number } | null = null;

function parseVcbNumber(raw: string | undefined): number {
  if (!raw || raw.trim() === '-') return 0;
  const cleaned = raw.replace(/,/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function readPersistedRate(db: Database.Database): VietcombankUsdRate {
  const rows = db
    .prepare(
      "SELECT key, value FROM site_settings WHERE key IN ('vcb_usd_buy','vcb_usd_transfer','vcb_usd_sell','vcb_usd_updated_at','vcb_rate_mode')"
    )
    .all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const buy = Number(map.vcb_usd_buy) || DEFAULT_FALLBACK.buy;
  const transfer = Number(map.vcb_usd_transfer) || DEFAULT_FALLBACK.transfer;
  const sell = Number(map.vcb_usd_sell) || DEFAULT_FALLBACK.sell;
  const rateMode: VcbRateMode =
    map.vcb_rate_mode === 'buy' || map.vcb_rate_mode === 'transfer' ? map.vcb_rate_mode : 'sell';
  const activeRate = rateMode === 'buy' ? buy : rateMode === 'transfer' ? transfer : sell;

  return {
    buy,
    transfer,
    sell,
    rateMode,
    activeRate,
    bankDateTime: map.vcb_usd_updated_at || '',
    fetchedAt: map.vcb_usd_updated_at || '',
    source: DEFAULT_FALLBACK.source,
    isLive: false,
  };
}

function persistRateToSettings(
  db: Database.Database,
  rate: Omit<VietcombankUsdRate, 'rateMode' | 'activeRate'>,
  mode?: VcbRateMode
): void {
  const upsert = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  upsert.run('vcb_usd_buy', String(rate.buy));
  upsert.run('vcb_usd_transfer', String(rate.transfer));
  upsert.run('vcb_usd_sell', String(rate.sell));
  if (rate.bankDateTime || rate.fetchedAt) {
    upsert.run('vcb_usd_updated_at', rate.bankDateTime || rate.fetchedAt);
  }
  if (mode) {
    upsert.run('vcb_rate_mode', mode);
  }
}

async function fetchLiveVcbXml(): Promise<Omit<VietcombankUsdRate, 'rateMode' | 'activeRate'>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(VCB_XML_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/xml, text/xml, */*',
        'User-Agent': 'ROAR-COFFEE-Platform/1.0',
      },
    });
    if (!res.ok) {
      throw new Error(`Vietcombank XML HTTP ${res.status}`);
    }
    const xml = await res.text();
    const dtMatch = /<DateTime>([^<]+)<\/DateTime>/i.exec(xml);
    const usdMatch = /<Exrate[^>]*CurrencyCode=["']USD["'][^>]*>/i.exec(xml);
    if (!usdMatch) {
      throw new Error('USD rate node missing in Vietcombank XML');
    }
    const tag = usdMatch[0];
    const buyMatch = /Buy=["']([^"']+)["']/i.exec(tag);
    const transferMatch = /Transfer=["']([^"']+)["']/i.exec(tag);
    const sellMatch = /Sell=["']([^"']+)["']/i.exec(tag);

    const buy = parseVcbNumber(buyMatch?.[1]);
    const transfer = parseVcbNumber(transferMatch?.[1]);
    const sell = parseVcbNumber(sellMatch?.[1]);

    if (!sell && !transfer && !buy) {
      throw new Error('Parsed USD rates from Vietcombank are invalid');
    }

    return {
      buy: buy || transfer || sell,
      transfer: transfer || buy || sell,
      sell: sell || transfer || buy,
      bankDateTime: (dtMatch?.[1] || '').trim(),
      fetchedAt: new Date().toISOString(),
      source: DEFAULT_FALLBACK.source,
      isLive: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function getSavedRateMode(db: Database.Database): VcbRateMode {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = 'vcb_rate_mode'").get() as
    | { value: string }
    | undefined;
  return row?.value === 'buy' || row?.value === 'transfer' ? row.value : 'sell';
}

export async function getVietcombankUsdRate(
  db: Database.Database,
  options?: { force?: boolean; modeOverride?: VcbRateMode }
): Promise<VietcombankUsdRate> {
  const savedMode = options?.modeOverride || getSavedRateMode(db);
  const now = Date.now();
  const ttl = options?.force ? MIN_MANUAL_COOLDOWN_MS : CACHE_TTL_MS;

  if (memoryCache && now - memoryCache.fetchedMs < ttl) {
    const d = memoryCache.data;
    const activeRate = savedMode === 'buy' ? d.buy : savedMode === 'transfer' ? d.transfer : d.sell;
    return {
      ...d,
      rateMode: savedMode,
      activeRate,
    };
  }

  try {
    const live = await fetchLiveVcbXml();
    memoryCache = { data: live, fetchedMs: now };
    persistRateToSettings(db, live, options?.modeOverride);
    const activeRate = savedMode === 'buy' ? live.buy : savedMode === 'transfer' ? live.transfer : live.sell;
    return {
      ...live,
      rateMode: savedMode,
      activeRate,
    };
  } catch {
    if (memoryCache) {
      const d = memoryCache.data;
      const activeRate = savedMode === 'buy' ? d.buy : savedMode === 'transfer' ? d.transfer : d.sell;
      return {
        ...d,
        rateMode: savedMode,
        activeRate,
        isLive: false,
      };
    }
    const persisted = readPersistedRate(db);
    if (options?.modeOverride && options.modeOverride !== persisted.rateMode) {
      const activeRate =
        options.modeOverride === 'buy'
          ? persisted.buy
          : options.modeOverride === 'transfer'
            ? persisted.transfer
            : persisted.sell;
      return {
        ...persisted,
        rateMode: options.modeOverride,
        activeRate,
      };
    }
    return persisted;
  }
}

export function convertVndToUsdByRate(vnd: number, vcbRate: number): number {
  const safeRate = Number.isFinite(vcbRate) && vcbRate > 0 ? vcbRate : DEFAULT_FALLBACK.sell;
  const safeVnd = Number(vnd) || 0;
  if (safeVnd <= 0) return 0;
  return Math.round((safeVnd / safeRate) * 100) / 100;
}
