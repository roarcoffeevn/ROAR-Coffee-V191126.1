import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShoppingBag, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { resolveMediaUrl } from '../lib/media';
import { getTierPriceRange, type VolumePriceTier } from '../lib/pricing';

const STORAGE_KEY = 'roar_recently_viewed_v1';

export interface RecentlyViewedItem {
  id: number;
  slug: string;
  sku: string;
  category: string;
  sub_category?: string;
  name_vi: string;
  name_en: string;
  price_vnd: number;
  price_usd: number;
  image_key: string;
  pricing_tiers?: VolumePriceTier[];
  variants?: Array<{ label: string; priceVnd: number; priceUsd: number }>;
}

export function recordRecentlyViewed(p: Product | RecentlyViewedItem): void {
  if (typeof window === 'undefined' || !p?.slug) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    const entry: RecentlyViewedItem = {
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      category: p.category,
      sub_category: p.sub_category,
      name_vi: p.name_vi,
      name_en: p.name_en,
      price_vnd: p.price_vnd,
      price_usd: p.price_usd,
      image_key: p.image_key,
      pricing_tiers: p.pricing_tiers,
      variants: p.variants,
    };
    const next = [entry, ...list.filter((item) => item.slug !== p.slug)].slice(0, 8);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

export const RecentlyViewedStrip: React.FC<{ excludeSlug?: string }> = ({ excludeSlug }) => {
  const { lang, t, localePath } = useI18n();
  const { formatPrice, addToCart, showToast } = useStore();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
      setItems(excludeSlug ? list.filter((i) => i.slug !== excludeSlug) : list);
    } catch {
      setItems([]);
    }
  }, [excludeSlug]);

  if (items.length === 0) return null;

  const clearHistory = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setItems([]);
  };

  return (
    <section className="pt-8 mt-8 border-t border-[#202020]/10 dark:border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-[#202020] dark:text-[#F1EFEA] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
          <span>{t('Sản phẩm bạn đã xem gần đây', 'Recently Viewed Products')}</span>
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>{t('Xóa lịch sử', 'Clear')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {items.slice(0, 4).map((p) => {
          const range = getTierPriceRange(p.pricing_tiers);
          const isKg = p.category === 'roasted_beans' || (p.pricing_tiers?.length || 0) > 0;
          const firstVar = p.variants?.[0];
          return (
            <div
              key={p.slug}
              className="rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#00552B]/35 dark:hover:border-[#C6A667]/40 transition-all"
            >
              <div>
                <Link to={localePath(`/product/${p.slug}`)} className="block aspect-[4/3] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden">
                  <img
                    src={resolveMediaUrl(p.image_key)}
                    alt={lang === 'en' ? p.name_en : p.name_vi}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="p-3 space-y-1">
                  <Link
                    to={localePath(`/product/${p.slug}`)}
                    className="block text-xs font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] line-clamp-2"
                  >
                    {lang === 'en' ? p.name_en : p.name_vi}
                  </Link>
                  <p className="text-xs font-mono font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                    {range
                      ? `${t('Từ', 'From')} ${formatPrice(range.minVnd, range.minUsd)}/kg`
                      : formatPrice(p.price_vnd, p.price_usd)}
                  </p>
                </div>
              </div>
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      productId: p.id,
                      slug: p.slug,
                      sku: p.sku,
                      nameVi: p.name_vi,
                      nameEn: p.name_en,
                      variantLabel: isKg ? '1 kg' : firstVar?.label || 'Standard',
                      unitPriceVnd: isKg ? p.pricing_tiers?.[0]?.priceVnd || p.price_vnd : firstVar?.priceVnd || p.price_vnd,
                      unitPriceUsd: isKg ? p.pricing_tiers?.[0]?.priceUsd || p.price_usd : firstVar?.priceUsd || p.price_usd,
                      quantity: 1,
                      imageKey: p.image_key,
                      unit: isKg ? 'kg' : 'unit',
                      pricingTiers: isKg ? p.pricing_tiers : undefined,
                    });
                    showToast(t(`Đã thêm ${p.name_vi} vào giỏ`, `Added ${p.name_en} to cart`));
                  }}
                  className="w-full py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>{t('Chọn mua', 'Add to Cart')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
