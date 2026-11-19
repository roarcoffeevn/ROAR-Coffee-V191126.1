export interface VolumePriceTier {
  minKg: number;
  maxKg: number | null;
  labelVi: string;
  labelEn: string;
  priceVnd: number;
  priceUsd: number;
}

export const ROASTED_BEAN_TIER_DEFINITIONS: Array<{
  minKg: number;
  maxKg: number | null;
  labelVi: string;
  labelEn: string;
}> = [
  { minKg: 1, maxKg: 4, labelVi: '1 kg', labelEn: '1 kg' },
  { minKg: 5, maxKg: 19, labelVi: '5–19 kg', labelEn: '5–19 kg' },
  { minKg: 20, maxKg: 49, labelVi: '20–49 kg', labelEn: '20–49 kg' },
  { minKg: 50, maxKg: 99, labelVi: '50–99 kg', labelEn: '50–99 kg' },
  { minKg: 100, maxKg: null, labelVi: 'Sỉ: ≥100 kg', labelEn: 'Wholesale: ≥100 kg' },
];

export function convertVndToUsdRounded(vnd: number, exchangeRate = 25930): number {
  const safeRate = exchangeRate > 0 ? exchangeRate : 25930;
  return Number((Math.max(0, Number(vnd || 0)) / safeRate).toFixed(2));
}

export function buildFiveTierPrices(
  pricesVnd: [number, number, number, number, number],
  exchangeRate = 25930
): VolumePriceTier[] {
  return ROASTED_BEAN_TIER_DEFINITIONS.map((def, idx) => {
    const vnd = Math.max(0, Math.round(Number(pricesVnd[idx] || 0)));
    return {
      minKg: def.minKg,
      maxKg: def.maxKg,
      labelVi: def.labelVi,
      labelEn: def.labelEn,
      priceVnd: vnd,
      priceUsd: convertVndToUsdRounded(vnd, exchangeRate),
    };
  });
}

export function normalizeVolumeTiers(raw: unknown, exchangeRate = 25930): VolumePriceTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any, idx) => {
      const def = ROASTED_BEAN_TIER_DEFINITIONS[idx];
      const minKg = Math.max(1, Number(item?.minKg ?? def?.minKg ?? 1));
      const maxKgRaw = item?.maxKg === null || item?.maxKg === '' || item?.maxKg === undefined ? null : Number(item.maxKg);
      const maxKg = maxKgRaw !== null && Number.isFinite(maxKgRaw) && maxKgRaw >= minKg ? maxKgRaw : null;
      const priceVnd = Math.max(0, Math.round(Number(item?.priceVnd || 0)));
      const priceUsd =
        Number(item?.priceUsd) > 0
          ? Number(Number(item.priceUsd).toFixed(2))
          : convertVndToUsdRounded(priceVnd, exchangeRate);
      return {
        minKg,
        maxKg,
        labelVi: String(item?.labelVi || def?.labelVi || (maxKg ? `${minKg}–${maxKg} kg` : `Sỉ: ≥${minKg} kg`)),
        labelEn: String(item?.labelEn || def?.labelEn || (maxKg ? `${minKg}–${maxKg} kg` : `Wholesale: ≥${minKg} kg`)),
        priceVnd,
        priceUsd,
      };
    })
    .filter((t) => t.priceVnd > 0)
    .sort((a, b) => a.minKg - b.minKg);
}

export function resolveVolumeTier(tiers: VolumePriceTier[] | undefined | null, kgQty: number): VolumePriceTier | null {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const qty = Math.max(1, Number(kgQty || 1));
  const sorted = [...tiers].sort((a, b) => a.minKg - b.minKg);

  // Exact range match
  const exact = sorted.find((t) => qty >= t.minKg && (t.maxKg === null || qty <= t.maxKg));
  if (exact) return exact;

  // Fallback: highest tier whose minKg <= qty (prevents gap between customized boundaries like maxKg=1 and next minKg=5)
  let best = sorted[0];
  for (const tier of sorted) {
    if (qty >= tier.minKg) {
      best = tier;
    }
  }
  return best;
}

export function getTierPriceRange(tiers: VolumePriceTier[] | undefined | null): {
  minVnd: number;
  maxVnd: number;
  minUsd: number;
  maxUsd: number;
} | null {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const vnds = tiers.map((t) => Number(t.priceVnd || 0)).filter((v) => v > 0);
  const usds = tiers.map((t) => Number(t.priceUsd || 0)).filter((u) => u > 0);
  if (vnds.length === 0) return null;
  return {
    minVnd: Math.min(...vnds),
    maxVnd: Math.max(...vnds),
    minUsd: usds.length ? Math.min(...usds) : 0,
    maxUsd: usds.length ? Math.max(...usds) : 0,
  };
}

export function computeEan13CheckDigit(twelveDigits: string): string {
  const digits = twelveDigits.replace(/\D/g, '').padStart(12, '0').slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(digits[i]);
    sum += i % 2 === 0 ? n : n * 3;
  }
  const mod = sum % 10;
  return String(mod === 0 ? 0 : 10 - mod);
}

/**
 * Generates a valid GS1 Vietnam (893 prefix) 13-digit EAN-13 barcode deterministically from a numeric seed or product key.
 */
export function generateEan13Barcode(seed: string | number): string {
  let numHash = 0;
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    numHash = Math.abs(Math.floor(seed));
  } else {
    const str = String(seed || '1');
    for (let i = 0; i < str.length; i++) {
      numHash = (numHash * 31 + str.charCodeAt(i)) % 1000000;
    }
  }
  const itemPart = String(100000 + (numHash % 899999)).padStart(6, '0');
  const twelve = `893855${itemPart}`;
  return `${twelve}${computeEan13CheckDigit(twelve)}`;
}

export function isValidEan13(code: string): boolean {
  const clean = String(code || '').trim();
  if (!/^\d{13}$/.test(clean)) return false;
  return computeEan13CheckDigit(clean.slice(0, 12)) === clean[12];
}

export interface ShippingRuleTier {
  minSubtotal: number;
  maxSubtotal: number | null;
  feeVnd: number;
  labelVi: string;
  labelEn: string;
}

export const DEFAULT_SHIPPING_RULES: ShippingRuleTier[] = [
  {
    minSubtotal: 0,
    maxSubtotal: 299999,
    feeVnd: 35000,
    labelVi: 'Đơn dưới 300.000 ₫',
    labelEn: 'Orders under 300,000 VND',
  },
  {
    minSubtotal: 300000,
    maxSubtotal: 499999,
    feeVnd: 20000,
    labelVi: 'Đơn từ 300.000 ₫ – dưới 500.000 ₫',
    labelEn: 'Orders 300,000 – 499,999 VND',
  },
  {
    minSubtotal: 500000,
    maxSubtotal: null,
    feeVnd: 0,
    labelVi: 'Đơn từ 500.000 ₫ (Miễn phí vận chuyển)',
    labelEn: 'Orders ≥ 500,000 VND (Free Shipping)',
  },
];

export function parseShippingRules(raw: unknown): ShippingRuleTier[] {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      return DEFAULT_SHIPPING_RULES;
    }
  } else {
    return DEFAULT_SHIPPING_RULES;
  }

  const normalized = list
    .map((item) => {
      const minSubtotal = Math.max(0, Math.round(Number(item?.minSubtotal ?? 0)));
      const maxRaw =
        item?.maxSubtotal === null || item?.maxSubtotal === '' || item?.maxSubtotal === undefined
          ? null
          : Math.round(Number(item.maxSubtotal));
      const maxSubtotal = maxRaw !== null && Number.isFinite(maxRaw) && maxRaw >= minSubtotal ? maxRaw : null;
      const feeVnd = Math.max(0, Math.round(Number(item?.feeVnd ?? 0)));
      return {
        minSubtotal,
        maxSubtotal,
        feeVnd,
        labelVi: String(item?.labelVi || (feeVnd === 0 ? `Miễn phí từ ${minSubtotal.toLocaleString('vi-VN')} ₫` : `Từ ${minSubtotal.toLocaleString('vi-VN')} ₫`)),
        labelEn: String(item?.labelEn || (feeVnd === 0 ? `Free from ${minSubtotal.toLocaleString('en-US')} VND` : `From ${minSubtotal.toLocaleString('en-US')} VND`)),
      };
    })
    .sort((a, b) => a.minSubtotal - b.minSubtotal);

  return normalized.length > 0 ? normalized : DEFAULT_SHIPPING_RULES;
}

export function calculateShippingFee(
  subtotalVnd: number,
  settingsOrRules?: Record<string, string> | ShippingRuleTier[] | null
): { feeVnd: number; matchedRule: ShippingRuleTier; freeThresholdVnd: number | null } {
  const rules = Array.isArray(settingsOrRules)
    ? parseShippingRules(settingsOrRules)
    : parseShippingRules(settingsOrRules?.shipping_rules_json);

  const sub = Math.max(0, Number(subtotalVnd || 0));
  const exact = rules.find((r) => sub >= r.minSubtotal && (r.maxSubtotal === null || sub <= r.maxSubtotal));
  let matched = exact || rules[0];
  if (!exact) {
    for (const r of rules) {
      if (sub >= r.minSubtotal) matched = r;
    }
  }
  const freeTier = rules.find((r) => r.feeVnd === 0 && r.minSubtotal > 0);
  return {
    feeVnd: matched.feeVnd,
    matchedRule: matched,
    freeThresholdVnd: freeTier ? freeTier.minSubtotal : null,
  };
}

