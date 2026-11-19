import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchBootstrapWithFallback } from '../lib/staticFallback';
import { handleStaticApiFallback } from '../lib/staticRuntime';
import type { RawGalleryItem } from '../lib/media';
import { resolveVolumeTier, type VolumePriceTier } from '../lib/pricing';

export type { VolumePriceTier };

export interface ProductVariant {
  label: string;
  priceVnd: number;
  priceUsd: number;
}

export interface Product {
  id: number;
  slug: string;
  sku: string;
  barcode?: string;
  category: 'roasted' | 'roasted_beans' | 'green_bean' | 'instant';
  sub_category: string;
  name_vi: string;
  name_en: string;
  subtitle_vi: string;
  subtitle_en: string;
  description_vi: string;
  description_en: string;
  coffee_type: string;
  blend_summary_vi: string;
  blend_summary_en: string;
  blend_public: number;
  roast_profile_vi: string;
  roast_profile_en: string;
  tasting_notes_vi: string;
  tasting_notes_en: string;
  brewing_methods: string[];
  variants: ProductVariant[];
  pricing_tiers?: VolumePriceTier[];
  packaging_options: string[];
  price_vnd: number;
  price_usd: number;
  inventory: number;
  moq: string;
  status: 'active' | 'configurable_on_request' | 'out_of_stock' | 'draft';
  is_demo_data: number;
  mascot_slug: string;
  screen_size: string;
  processing_method: string;
  origin_region: string;
  harvest_year: string;
  moisture_content: string;
  density: string;
  defect_info: string;
  grading_spec: string;
  image_key: string;
  gallery_images?: RawGalleryItem[];
  featured: number;
}

export interface CartItem {
  productId: number;
  slug: string;
  sku: string;
  nameVi: string;
  nameEn: string;
  variantLabel: string;
  unitPriceVnd: number;
  unitPriceUsd: number;
  quantity: number;
  imageKey: string;
  unit?: 'kg' | 'unit';
  pricingTiers?: VolumePriceTier[];
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'b2b_partner' | 'admin';
  adminRole?: string;
  adminPermissions?: string[];
  memberCode: string;
  tier: string;
  emailVerified: boolean;
  addresses?: any[];
  notificationPrefs?: Record<string, boolean>;
  privacyPrefs?: Record<string, boolean>;
  deletionRequested?: boolean;
  companyName?: string;
  b2bVerified?: boolean;
  points?: {
    available: number;
    pending: number;
    redeemed: number;
    expired: number;
    expiringSoon: number;
  };
  walletBalanceVnd?: number;
  unreadNotifications?: number;
}

export interface CmsPageSectionItem {
  tag_vi?: string;
  tag_en?: string;
  title_vi: string;
  title_en: string;
  body_vi: string;
  body_en: string;
}

export interface CmsPageData {
  slug: string;
  route_path: string;
  group_name: string;
  eyebrow_vi: string;
  eyebrow_en: string;
  title_vi: string;
  title_en: string;
  subtitle_vi: string;
  subtitle_en: string;
  body_vi: string;
  body_en: string;
  hero_image_key: string;
  cta_label_vi: string;
  cta_label_en: string;
  cta_url: string;
  sections: CmsPageSectionItem[];
  updated_at?: string;
}

export interface Personality {
  id: number;
  slug: string;
  animal_en: string;
  animal_vi: string;
  traits_vi: string;
  traits_en: string;
  story_vi: string;
  story_en: string;
  product_association_vi: string;
  product_association_en: string;
  associated_product_slug: string;
  is_future_collection: number;
  image_key: string;
  custom_image_url: string;
}

export interface CoffeeOrigin {
  id: number;
  slug: string;
  region_name_vi: string;
  region_name_en: string;
  localities_vi: string;
  localities_en: string;
  elevation: string;
  varieties: string;
  processing_methods: string;
  sourcing_status: 'confirmed_sourcing' | 'general_geography';
  characteristics_vi: string;
  characteristics_en: string;
  sourcing_note_vi: string;
  sourcing_note_en: string;
  map_x: number;
  map_y: number;
  latitude: number;
  longitude: number;
  image_key: string;
  photo_attribution: string;
  related_skus: string[];
}

export interface BreadcrumbNode {
  labelVi: string;
  labelEn: string;
  to?: string;
}

export interface VietcombankRateInfo {
  buy: number;
  transfer: number;
  sell: number;
  rateMode: 'sell' | 'transfer' | 'buy';
  activeRate: number;
  bankDateTime: string;
  fetchedAt: string;
  source: string;
  isLive: boolean;
}

interface StoreContextValue {
  user: AuthUser | null;
  authToken: string | null;
  setAuthSession: (user: AuthUser | null, token?: string | null) => void;
  clearAuthSession: () => void;
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  refreshUser: () => Promise<void>;
  currency: 'VND' | 'USD';
  setCurrency: (c: 'VND' | 'USD') => void;
  vcbRate: number;
  vcbRateInfo: VietcombankRateInfo | null;
  refreshVcbRate: (force?: boolean) => Promise<VietcombankRateInfo | null>;
  formatPrice: (vnd: number, usd?: number) => string;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  updateCartQty: (productId: number, variantLabel: string, qty: number) => void;
  removeFromCart: (productId: number, variantLabel: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalVnd: number;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  recentlyViewed: string[];
  trackRecentlyViewed: (slug: string) => void;
  personalities: Personality[];
  origins: CoffeeOrigin[];
  tiers: any[];
  loyaltySettings: any;
  settings: Record<string, string>;
  cmsPages: Record<string, CmsPageData>;
  refreshBootstrap: () => Promise<void>;
  toast: string | null;
  showToast: (msg: string) => void;
  theme: 'light' | 'dark';
  setTheme: (next: 'light' | 'dark') => void;
  toggleTheme: () => void;
  customBreadcrumb: BreadcrumbNode[] | null;
  setCustomBreadcrumb: (nodes: BreadcrumbNode[] | null) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function safeGetStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage access errors in restricted third-party iframes
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => safeGetStorage('roar_auth_token'));
  const [currency, setCurrency] = useState<'VND' | 'USD'>(() => {
    const saved = safeGetStorage('roar_currency');
    return saved === 'USD' ? 'USD' : 'VND';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = safeGetStorage('roar_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(safeGetStorage('roar_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      return JSON.parse(safeGetStorage('roar_wishlist') || '[]');
    } catch {
      return [];
    }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      return JSON.parse(safeGetStorage('roar_recent') || '[]');
    } catch {
      return [];
    }
  });

  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [origins, setOrigins] = useState<CoffeeOrigin[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [cmsPages, setCmsPages] = useState<Record<string, CmsPageData>>({});
  const [vcbRateInfo, setVcbRateInfo] = useState<VietcombankRateInfo | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [customBreadcrumb, setCustomBreadcrumb] = useState<BreadcrumbNode[] | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  }, []);

  const apiFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers || {});
      const token = authToken || safeGetStorage('roar_auth_token');
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      try {
        const res = await fetch(input, {
          ...init,
          credentials: 'include',
          headers,
        });
        const ct = res.headers.get('content-type') || '';
        const isJson = ct.includes('application/json');
        // On static deployments (e.g. Vercel/Netlify), /api/* does not return JSON
        if (!isJson) {
          const fallback = await handleStaticApiFallback(input, { ...init, headers });
          if (fallback) return fallback;
        }
        return res;
      } catch (err) {
        const fallback = await handleStaticApiFallback(input, { ...init, headers });
        if (fallback) return fallback;
        throw err;
      }
    },
    [authToken]
  );

  const setAuthSession = useCallback((nextUser: AuthUser | null, token?: string | null) => {
    setUser(nextUser);
    if (token) {
      setAuthToken(token);
      safeSetStorage('roar_auth_token', token);
    }
  }, []);

  const clearAuthSession = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('roar_auth_token');
      }
    } catch {
      // silent
    }
  }, []);

  const refreshUser = useCallback(async (overrideToken?: string | null) => {
    try {
      const headers = new Headers();
      const token = overrideToken ?? authToken ?? safeGetStorage('roar_auth_token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const res = await fetch('/api/auth/me', { credentials: 'include', headers });
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    }
  }, [authToken]);

  const refreshVcbRate = useCallback(async (force = false): Promise<VietcombankRateInfo | null> => {
    try {
      const res = await fetch(`/api/exchange-rate/vietcombank${force ? '?refresh=1' : ''}`);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return null;
      const data = await res.json();
      if (data?.rate) {
        setVcbRateInfo(data.rate);
        return data.rate as VietcombankRateInfo;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      const data = await fetchBootstrapWithFallback();
      if (!data) return;
      setPersonalities(data.personalities || []);
      setOrigins(data.origins || []);
      setTiers(data.tiers || []);
      setLoyaltySettings(data.loyaltySettings || null);
      const nextSettings = data.settings || {};
      setSettings(nextSettings);
      setCmsPages(data.cmsPages || {});
      if (nextSettings.vcb_usd_sell || nextSettings.vcb_usd_transfer) {
        const mode = nextSettings.vcb_rate_mode === 'buy' || nextSettings.vcb_rate_mode === 'transfer'
          ? nextSettings.vcb_rate_mode
          : 'sell';
        const buy = Number(nextSettings.vcb_usd_buy) || 25520;
        const transfer = Number(nextSettings.vcb_usd_transfer) || 25550;
        const sell = Number(nextSettings.vcb_usd_sell) || 25930;
        const activeRate = mode === 'buy' ? buy : mode === 'transfer' ? transfer : sell;
        setVcbRateInfo((prev) =>
          prev || {
            buy,
            transfer,
            sell,
            rateMode: mode,
            activeRate,
            bankDateTime: nextSettings.vcb_usd_updated_at || '',
            fetchedAt: nextSettings.vcb_usd_updated_at || '',
            source: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
            isLive: false,
          }
        );
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshUser();
    refreshBootstrap();
    refreshVcbRate(false);
  }, [refreshUser, refreshBootstrap, refreshVcbRate]);

  useEffect(() => {
    safeSetStorage('roar_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    safeSetStorage('roar_currency', currency);
  }, [currency]);

  useEffect(() => {
    safeSetStorage('roar_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeSetStorage('roar_recent', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    safeSetStorage('roar_theme', theme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const isKg = item.unit === 'kg' || (Array.isArray(item.pricingTiers) && item.pricingTiers.length > 0);
      const idx = isKg
        ? prev.findIndex((i) => i.productId === item.productId && (i.unit === 'kg' || (i.pricingTiers?.length || 0) > 0))
        : prev.findIndex((i) => i.productId === item.productId && i.variantLabel === item.variantLabel);

      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx];
        const nextQty = existing.quantity + item.quantity;
        const tiers = item.pricingTiers?.length ? item.pricingTiers : existing.pricingTiers;
        if (isKg && tiers && tiers.length > 0) {
          const tier = resolveVolumeTier(tiers, nextQty);
          next[idx] = {
            ...existing,
            quantity: nextQty,
            unit: 'kg',
            pricingTiers: tiers,
            unitPriceVnd: tier ? tier.priceVnd : existing.unitPriceVnd,
            unitPriceUsd: tier ? tier.priceUsd : existing.unitPriceUsd,
            variantLabel: tier ? `${nextQty} kg · ${tier.labelVi}` : `${nextQty} kg`,
          };
        } else {
          next[idx] = { ...existing, quantity: nextQty };
        }
        return next;
      }

      if (isKg && item.pricingTiers && item.pricingTiers.length > 0) {
        const tier = resolveVolumeTier(item.pricingTiers, item.quantity);
        return [
          ...prev,
          {
            ...item,
            unit: 'kg',
            unitPriceVnd: tier ? tier.priceVnd : item.unitPriceVnd,
            unitPriceUsd: tier ? tier.priceUsd : item.unitPriceUsd,
            variantLabel: tier ? `${item.quantity} kg · ${tier.labelVi}` : `${item.quantity} kg`,
          },
        ];
      }

      return [...prev, item];
    });
    setCartOpen(true);
  };

  const updateCartQty = (productId: number, variantLabel: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, variantLabel);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId || i.variantLabel !== variantLabel) return i;
        if (i.pricingTiers && i.pricingTiers.length > 0) {
          const tier = resolveVolumeTier(i.pricingTiers, qty);
          return {
            ...i,
            quantity: qty,
            unit: 'kg',
            unitPriceVnd: tier ? tier.priceVnd : i.unitPriceVnd,
            unitPriceUsd: tier ? tier.priceUsd : i.unitPriceUsd,
            variantLabel: tier ? `${qty} kg · ${tier.labelVi}` : `${qty} kg`,
          };
        }
        return { ...i, quantity: qty };
      })
    );
  };

  const removeFromCart = (productId: number, variantLabel: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.variantLabel === variantLabel)));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (slug: string) => {
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const trackRecentlyViewed = useCallback((slug: string) => {
    setRecentlyViewed((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, 6));
  }, []);

  const vcbRate = vcbRateInfo?.activeRate || Number(settings.vcb_usd_sell) || 25930;

  const formatPrice = (vnd: number, usd?: number) => {
    if (currency === 'USD') {
      const val = usd !== undefined && usd > 0 ? usd : vnd / vcbRate;
      return `$${val.toFixed(2)}`;
    }
    return `${vnd.toLocaleString('vi-VN')} ₫`;
  };

  const cartCount = cart.reduce((acc, i) => acc + (i.unit === 'kg' ? 1 : i.quantity), 0);
  const cartSubtotalVnd = cart.reduce((acc, i) => acc + i.unitPriceVnd * i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        user,
        authToken,
        setAuthSession,
        clearAuthSession,
        apiFetch,
        refreshUser,
        currency,
        setCurrency,
        vcbRate,
        vcbRateInfo,
        refreshVcbRate,
        formatPrice,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotalVnd,
        wishlist,
        toggleWishlist,
        recentlyViewed,
        trackRecentlyViewed,
        personalities,
        origins,
        tiers,
        loyaltySettings,
        settings,
        cmsPages,
        refreshBootstrap,
        toast,
        showToast,
        theme,
        setTheme,
        toggleTheme,
        customBreadcrumb,
        setCustomBreadcrumb,
      }}
    >
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 z-50 bg-[#003D25] text-white px-5 py-3 rounded-lg shadow-lg border border-[#C6A667]/40 text-sm font-medium"
        >
          {toast}
        </div>
      )}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
