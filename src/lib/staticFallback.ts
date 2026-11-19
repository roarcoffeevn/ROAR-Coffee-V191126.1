import type { Product, CmsPageData, CoffeeOrigin, Personality } from '../context/StoreContext';

interface SnapshotFile {
  version: number;
  exportedAt: string;
  tables: {
    products: any[];
    coffee_origins: any[];
    personalities: any[];
    cms_pages: any[];
    journal_articles: any[];
    promotions: any[];
    membership_tiers: any[];
    loyalty_settings: any[];
    site_settings: Array<{ key: string; value: string }>;
    media_assets: any[];
  };
}

let cachedSnapshotPromise: Promise<SnapshotFile | null> | null = null;

async function fetchJsonSafe(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadStaticSnapshot(): Promise<SnapshotFile | null> {
  if (!cachedSnapshotPromise) {
    cachedSnapshotPromise = fetch('/roar-snapshot.json')
      .then((res) => (res.ok ? (res.json() as Promise<SnapshotFile>) : null))
      .catch(() => null);
  }
  return cachedSnapshotPromise;
}

function safeParseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapProductRow(p: any): Product {
  return {
    ...p,
    barcode: p.barcode || '',
    blend_summary_vi: p.blend_public ? p.blend_summary_vi : 'Tỷ lệ phối trộn bảo mật nội bộ',
    blend_summary_en: p.blend_public ? p.blend_summary_en : 'Confidential proprietary blend ratio',
    brewing_methods: Array.isArray(p.brewing_methods) ? p.brewing_methods : safeParseJson(p.brewing_methods_json, []),
    variants: Array.isArray(p.variants) ? p.variants : safeParseJson(p.variants_json, []),
    pricing_tiers: Array.isArray(p.pricing_tiers) ? p.pricing_tiers : safeParseJson(p.pricing_tiers_json, []),
    packaging_options: Array.isArray(p.packaging_options) ? p.packaging_options : safeParseJson(p.packaging_options_json, []),
    gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : safeParseJson(p.gallery_images_json, []),
  };
}

export async function fetchBootstrapWithFallback(): Promise<{
  settings: Record<string, string>;
  personalities: Personality[];
  origins: CoffeeOrigin[];
  tiers: any[];
  loyaltySettings: any;
  cmsPages: Record<string, CmsPageData>;
} | null> {
  const live = await fetchJsonSafe('/api/site-bootstrap');
  if (live && (live.origins?.length || live.personalities?.length || Object.keys(live.cmsPages || {}).length)) {
    return live;
  }

  const snap = await loadStaticSnapshot();
  if (!snap?.tables) return live;

  const settings: Record<string, string> = {};
  for (const row of snap.tables.site_settings || []) {
    settings[row.key] = row.value;
  }

  const origins: CoffeeOrigin[] = (snap.tables.coffee_origins || []).map((o) => ({
    ...o,
    related_skus: safeParseJson(o.related_skus_json, []),
  }));

  const cmsPages: Record<string, CmsPageData> = {};
  for (const p of snap.tables.cms_pages || []) {
    cmsPages[p.slug] = {
      ...p,
      sections: safeParseJson(p.sections_json, []),
    };
  }

  return {
    settings,
    personalities: snap.tables.personalities || [],
    origins,
    tiers: snap.tables.membership_tiers || [],
    loyaltySettings: (snap.tables.loyalty_settings || [])[0] || null,
    cmsPages,
  };
}

export async function fetchProductsWithFallback(queryParams?: URLSearchParams): Promise<Product[]> {
  const qs = queryParams ? queryParams.toString() : '';
  const live = await fetchJsonSafe(`/api/products${qs ? `?${qs}` : ''}`);
  if (live && Array.isArray(live.products)) {
    return live.products;
  }

  const snap = await loadStaticSnapshot();
  if (!snap?.tables?.products) return [];

  const category = queryParams?.get('category');
  const screen = queryParams?.get('screen');
  const processing = queryParams?.get('processing');
  const coffeeType = queryParams?.get('coffee_type');
  const mascot = queryParams?.get('mascot');
  const status = queryParams?.get('status');
  const search = queryParams?.get('search')?.trim().toLowerCase();

  return snap.tables.products
    .filter((p) => p.status !== 'draft')
    .filter((p) => (!category || category === 'all' ? true : p.category === category))
    .filter((p) => (!screen || screen === 'all' ? true : p.screen_size === screen))
    .filter((p) => (!processing || processing === 'all' ? true : p.processing_method === processing))
    .filter((p) => (!coffeeType || coffeeType === 'all' ? true : String(p.coffee_type || '').toLowerCase().includes(coffeeType.toLowerCase())))
    .filter((p) => (!mascot ? true : p.mascot_slug === mascot))
    .filter((p) => (!status || status === 'all' ? true : p.status === status))
    .filter((p) => {
      if (!search) return true;
      return (
        String(p.name_vi || '').toLowerCase().includes(search) ||
        String(p.name_en || '').toLowerCase().includes(search) ||
        String(p.sku || '').toLowerCase().includes(search) ||
        String(p.barcode || '').toLowerCase().includes(search) ||
        String(p.sub_category || '').toLowerCase().includes(search) ||
        String(p.grading_spec || '').toLowerCase().includes(search) ||
        String(p.coffee_type || '').toLowerCase().includes(search) ||
        String(p.origin_region || '').toLowerCase().includes(search)
      );
    })
    .sort((a, b) => (b.featured || 0) - (a.featured || 0) || (a.id || 0) - (b.id || 0))
    .map(mapProductRow);
}

export async function fetchProductBySlugWithFallback(
  slug: string
): Promise<{ product: Product; reviews: any[]; related: Product[] } | null> {
  const live = await fetchJsonSafe(`/api/products/${encodeURIComponent(slug)}`);
  if (live?.product) {
    return live;
  }

  const snap = await loadStaticSnapshot();
  if (!snap?.tables?.products) return null;

  const found = snap.tables.products.find((p) => p.slug === slug && p.status !== 'draft');
  if (!found) return null;

  const related = snap.tables.products
    .filter((p) => p.category === found.category && p.id !== found.id && p.status !== 'draft')
    .slice(0, 4)
    .map(mapProductRow);

  return {
    product: mapProductRow(found),
    reviews: [],
    related,
  };
}

export async function fetchJournalWithFallback(queryParams?: URLSearchParams): Promise<any[]> {
  const qs = queryParams ? queryParams.toString() : '';
  const live = await fetchJsonSafe(`/api/journal${qs ? `?${qs}` : ''}`);
  if (live && Array.isArray(live.articles)) {
    return live.articles;
  }

  const snap = await loadStaticSnapshot();
  if (!snap?.tables?.journal_articles) return [];

  const category = queryParams?.get('category');
  const search = queryParams?.get('search')?.trim().toLowerCase();

  return snap.tables.journal_articles
    .filter((a) => a.published === 1 || a.published === true)
    .filter((a) => (!category || category === 'all' ? true : a.category === category))
    .filter((a) => {
      if (!search) return true;
      return (
        String(a.title_vi || '').toLowerCase().includes(search) ||
        String(a.title_en || '').toLowerCase().includes(search) ||
        String(a.excerpt_vi || '').toLowerCase().includes(search) ||
        String(a.excerpt_en || '').toLowerCase().includes(search)
      );
    })
    .map((a) => ({
      ...a,
      tags: Array.isArray(a.tags) ? a.tags : safeParseJson(a.tags_json, []),
    }));
}

export async function fetchArticleBySlugWithFallback(
  slug: string
): Promise<{ article: any; related: any[] } | null> {
  const live = await fetchJsonSafe(`/api/journal/${encodeURIComponent(slug)}`);
  if (live?.article) {
    return live;
  }

  const snap = await loadStaticSnapshot();
  if (!snap?.tables?.journal_articles) return null;

  const found = snap.tables.journal_articles.find((a) => a.slug === slug && (a.published === 1 || a.published === true));
  if (!found) return null;

  const related = snap.tables.journal_articles
    .filter((a) => a.id !== found.id && (a.published === 1 || a.published === true))
    .slice(0, 3);

  return {
    article: {
      ...found,
      tags: Array.isArray(found.tags) ? found.tags : safeParseJson(found.tags_json, []),
    },
    related,
  };
}

export async function fetchPromotionsWithFallback(): Promise<any[]> {
  const live = await fetchJsonSafe('/api/promotions');
  if (live && Array.isArray(live.promotions)) {
    return live.promotions;
  }

  const snap = await loadStaticSnapshot();
  if (!snap?.tables?.promotions) return [];

  const today = new Date().toISOString().slice(0, 10);
  return snap.tables.promotions.filter(
    (p) => (p.active === 1 || p.active === true) && p.start_date <= today && p.end_date >= today
  );
}
