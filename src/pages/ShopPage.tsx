import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { localizeCoffeeType } from '../lib/i18nHelpers';
import { getTierPriceRange, resolveVolumeTier } from '../lib/pricing';
import { fetchProductsWithFallback } from '../lib/staticFallback';

interface ShopPageProps {
  defaultCategory?: 'all' | 'roasted' | 'roasted_beans' | 'instant' | 'green_bean';
}

export const ShopPage: React.FC<ShopPageProps> = ({ defaultCategory = 'all' }) => {
  const { lang, t, localePath } = useI18n();
  const { formatPrice, currency, setCurrency, addToCart, wishlist, toggleWishlist, showToast } = useStore();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState<string>(defaultCategory);
  const [search, setSearch] = useState<string>(searchParams.get('q') || '');
  const [mascotFilter, setMascotFilter] = useState<string>('');
  const [kgByProduct, setKgByProduct] = useState<Record<number, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    if (mascotFilter) params.set('mascot', mascotFilter);

    fetchProductsWithFallback(params)
      .then((list) => setProducts(list))
      .finally(() => setLoading(false));
  }, [category, search, mascotFilter]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#202020]/10 dark:border-white/10 pb-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
            {t('Danh mục Sản phẩm Chính thức', 'Official ROAR COFFEE Catalog')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {category === 'roasted'
              ? t('Cà Phê Rang Xay', 'Roasted Coffee Collections')
              : category === 'roasted_beans'
              ? t('Cà Phê Hạt Rang (Giá Theo Kg)', 'Roasted Coffee Beans (Volume Tiers)')
              : category === 'instant'
              ? t('Cà Phê Hòa Tan Silver & Gold', 'Instant Coffee — Silver & Gold')
              : t('Tất Cả Sản Phẩm Cà Phê', 'All Coffee Products')}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded-md overflow-hidden text-xs font-mono">
            <button
              type="button"
              onClick={() => setCurrency('VND')}
              className={`px-3 py-1.5 cursor-pointer ${currency === 'VND' ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA]'}`}
            >
              VND (₫)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 cursor-pointer ${currency === 'USD' ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA]'}`}
            >
              USD ($)
            </button>
          </div>

          <Link
            to={localePath('/coffee/green-beans')}
            className="px-4 py-2 bg-[#003D25] text-[#C6A667] text-xs font-semibold rounded hover:bg-[#00552B] transition-colors"
          >
            {t('Cổng B2B Nhân Xanh (27 SKUs) →', 'B2B Green Beans Matrix →')}
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 rounded-lg">
          {[
            { id: 'all', vi: 'Tất cả', en: 'All' },
            { id: 'roasted', vi: 'Cà phê Rang Xay', en: 'Roasted Coffee' },
            { id: 'roasted_beans', vi: 'Cà phê Hạt Rang (kg)', en: 'Roasted Beans (kg)' },
            { id: 'instant', vi: 'Cà phê Hòa Tan', en: 'Instant Coffee' },
            { id: 'green_bean', vi: 'Nhân Xanh (B2B)', en: 'Green Beans (B2B)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                category === tab.id ? 'bg-[#00552B] text-white' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#202020] dark:hover:text-white'
              }`}
            >
              {t(tab.vi, tab.en)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mascotFilter}
            onChange={(e) => setMascotFilter(e.target.value)}
            aria-label={t('Lọc theo cá tính', 'Filter by personality')}
            className="bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs text-[#202020] dark:text-[#F1EFEA]"
          >
            <option value="">{t('Tất cả Cá tính', 'All Personalities')}</option>
            <option value="tiger">{t('Hổ (Vị đậm bản lĩnh)', 'Tiger (Bold)')}</option>
            <option value="lion">{t('Sư tử (Chuẩn Phin)', 'Lion (Phin)')}</option>
            <option value="fox">{t('Cáo (Espresso)', 'Fox (Espresso)')}</option>
            <option value="eagle">{t('Đại bàng (Espresso Gold)', 'Eagle (Espresso Gold)')}</option>
            <option value="black-panther">{t('Báo đen (Signature Reserve)', 'Black Panther (Reserve)')}</option>
          </select>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#202020]/45 dark:text-[#F1EFEA]/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm tên sản phẩm, mã SKU...', 'Search product or SKU...')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg pl-9 pr-3 py-2 text-xs text-[#202020] dark:text-[#F1EFEA] focus:outline-none focus:border-[#00552B] dark:focus:border-[#C6A667]"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-xl bg-white/70 dark:bg-[#16221C]/70 animate-pulse border border-[#202020]/5 dark:border-white/10" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-12 text-center space-y-3">
          <p className="text-base font-medium text-[#202020] dark:text-[#F1EFEA]">
            {t('Không tìm thấy sản phẩm phù hợp với bộ lọc.', 'No products matched your current filter.')}
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setSearch('');
              setMascotFilter('');
            }}
            className="px-4 py-2 bg-[#00552B] text-white text-xs font-medium rounded cursor-pointer"
          >
            {t('Xóa bộ lọc', 'Reset Filters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const wished = wishlist.includes(p.slug);
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/8 dark:border-white/10 overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 transition-transform"
              >
                <div>
                  <div className="relative aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden">
                    <Link to={localePath(`/product/${p.slug}`)} className="block w-full h-full">
                      <MediaImage
                        imageKey={p.image_key}
                        alt={lang === 'vi' ? p.name_vi : p.name_en}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.slug)}
                      aria-label={t('Yêu thích', 'Toggle wishlist')}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-[#16221C]/90 flex items-center justify-center text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] cursor-pointer shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${wished ? 'fill-[#00552B] dark:fill-[#C6A667] text-[#00552B] dark:text-[#C6A667]' : ''}`} />
                    </button>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 font-mono">
                      <span className="text-[#00552B] dark:text-[#C6A667] font-semibold">
                        {p.category === 'roasted_beans' && p.sub_category ? p.sub_category : p.sku}
                      </span>
                      <span>·</span>
                      <span>{localizeCoffeeType(p.coffee_type, lang)}</span>
                      {p.status === 'configurable_on_request' && (
                        <>
                          <span>·</span>
                          <span>{t('Cấu hình theo đơn', 'Configurable')}</span>
                        </>
                      )}
                    </div>
                    <Link
                      to={localePath(`/product/${p.slug}`)}
                      className="block text-base font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667]"
                    >
                      {lang === 'vi' ? p.name_vi : p.name_en}
                    </Link>
                    <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2">
                      {lang === 'vi' ? p.subtitle_vi : p.subtitle_en}
                    </p>
                    {p.barcode && (
                      <p className="text-[10px] font-mono text-[#202020]/45 dark:text-[#F1EFEA]/45">
                        EAN-13: {p.barcode}
                      </p>
                    )}
                  </div>
                </div>

                {p.category === 'roasted_beans' && p.pricing_tiers && p.pricing_tiers.length > 0 ? (
                  (() => {
                    const selectedKg = Math.max(1, kgByProduct[p.id] ?? 1);
                    const activeTier = resolveVolumeTier(p.pricing_tiers, selectedKg);
                    const range = getTierPriceRange(p.pricing_tiers);
                    const unitVnd = activeTier ? activeTier.priceVnd : p.price_vnd;
                    const unitUsd = activeTier ? activeTier.priceUsd : p.price_usd;
                    return (
                      <div className="px-5 pb-5 pt-3 border-t border-[#202020]/8 dark:border-white/10 space-y-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <span className="text-base font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                              {formatPrice(unitVnd, unitUsd)}
                              <span className="text-xs font-normal opacity-75">/kg</span>
                            </span>
                            {range && (
                              <span className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55 block tabular-nums">
                                {t(
                                  `5 mức giá: ${formatPrice(range.minVnd, range.minUsd)} – ${formatPrice(range.maxVnd, range.maxUsd)}/kg`,
                                  `5 tiers: ${formatPrice(range.minVnd, range.minUsd)} – ${formatPrice(range.maxVnd, range.maxUsd)}/kg`
                                )}
                              </span>
                            )}
                          </div>
                          {activeTier && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00552B]/10 dark:bg-[#C6A667]/20 text-[#00552B] dark:text-[#C6A667] font-semibold">
                              {lang === 'vi' ? activeTier.labelVi : activeTier.labelEn}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded bg-[#F8F5EF] dark:bg-[#0E1512]">
                            <input
                              type="number"
                              min={1}
                              max={50000}
                              value={selectedKg}
                              onChange={(e) =>
                                setKgByProduct((prev) => ({
                                  ...prev,
                                  [p.id]: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                                }))
                              }
                              aria-label={t('Số lượng (kg)', 'Quantity (kg)')}
                              className="w-16 px-2 py-1.5 text-xs font-semibold text-center bg-transparent focus:outline-none tabular-nums"
                            />
                            <span className="pr-2 text-[11px] font-mono opacity-60">kg</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              addToCart({
                                productId: p.id,
                                slug: p.slug,
                                sku: p.sku,
                                nameVi: p.name_vi,
                                nameEn: p.name_en,
                                variantLabel: activeTier ? `${selectedKg} kg · ${activeTier.labelVi}` : `${selectedKg} kg`,
                                unitPriceVnd: unitVnd,
                                unitPriceUsd: unitUsd,
                                quantity: selectedKg,
                                imageKey: p.image_key,
                                unit: 'kg',
                                pricingTiers: p.pricing_tiers,
                              });
                              showToast(
                                t(
                                  `Đã thêm ${selectedKg} kg (${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}) vào giỏ`,
                                  `Added ${selectedKg} kg to cart`
                                )
                              );
                            }}
                            className="flex-1 px-3 py-2 bg-[#00552B] text-white text-xs font-semibold rounded hover:bg-[#003D25] cursor-pointer text-center"
                          >
                            {t(
                              `Thêm · ${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}`,
                              `Add · ${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}`
                            )}
                          </button>
                        </div>

                        <Link
                          to={localePath(`/product/${p.slug}`)}
                          className="block text-center text-[11px] font-medium text-[#00552B] dark:text-[#C6A667] hover:underline"
                        >
                          {t('Xem bảng giá 5 mức chi tiết →', 'View full 5-tier price table →')}
                        </Link>
                      </div>
                    );
                  })()
                ) : (
                  <div className="px-5 pb-5 pt-3 border-t border-[#202020]/8 dark:border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums block">
                        {formatPrice(p.price_vnd, p.price_usd)}
                      </span>
                      {p.is_demo_data === 1 && (
                        <span className="text-[10px] text-[#202020]/50 dark:text-[#F1EFEA]/50">
                          {t('Giá tham khảo phát triển', 'Reference Demo Price')}
                        </span>
                      )}
                    </div>

                    {p.category === 'green_bean' ? (
                      <Link
                        to={localePath(`/product/${p.slug}`)}
                        className="px-3.5 py-2 bg-[#003D25] text-[#C6A667] text-xs font-semibold rounded hover:bg-[#00552B]"
                      >
                        {t('Thông số & Báo giá', 'Spec & Quote')}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const firstVar = p.variants[0];
                          addToCart({
                            productId: p.id,
                            slug: p.slug,
                            sku: p.sku,
                            nameVi: p.name_vi,
                            nameEn: p.name_en,
                            variantLabel: firstVar ? firstVar.label : 'Standard',
                            unitPriceVnd: firstVar ? firstVar.priceVnd : p.price_vnd,
                            unitPriceUsd: firstVar ? firstVar.priceUsd : p.price_usd,
                            quantity: 1,
                            imageKey: p.image_key,
                          });
                          showToast(t('Đã thêm vào giỏ hàng', 'Added to cart'));
                        }}
                        className="px-3.5 py-2 bg-[#00552B] text-white text-xs font-medium rounded hover:bg-[#003D25] cursor-pointer"
                      >
                        {t('Thêm vào giỏ', 'Add to Cart')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <RecentlyViewedStrip />
    </div>
  );
};
