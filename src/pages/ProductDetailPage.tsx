import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Expand, Heart, ShieldAlert, Star, X } from 'lucide-react';
import { B2BInquiryModal } from '../components/B2BInquiryModal';
import { RecentlyViewedStrip, recordRecentlyViewed } from '../components/RecentlyViewedStrip';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { getProductGallery } from '../lib/media';
import { localizeBrewingMethod, localizeCoffeeType, localizeVariantLabel } from '../lib/i18nHelpers';
import { resolveVolumeTier } from '../lib/pricing';
import { fetchProductBySlugWithFallback } from '../lib/staticFallback';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, t, localePath } = useI18n();
  const {
    formatPrice,
    addToCart,
    wishlist,
    toggleWishlist,
    trackRecentlyViewed,
    user,
    apiFetch,
    showToast,
    setCustomBreadcrumb,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [b2bOpen, setB2bOpen] = useState(false);
  const [b2bType, setB2bType] = useState<'sample_request' | 'green_quotation' | 'wholesale_partner'>('wholesale_partner');

  const fetchProduct = () => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlugWithFallback(slug)
      .then((d) => {
        if (!d) {
          setProduct(null);
          return;
        }
        setProduct(d.product);
        recordRecentlyViewed(d.product);
        setReviews(d.reviews || []);
        setRelated(d.related || []);
        setSelectedVariantIdx(0);
        setActiveImageIdx(0);
        trackRecentlyViewed(d.product.slug);
        document.title = `${lang === 'vi' ? d.product.name_vi : d.product.name_en} | ROAR COFFEE®`;
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    const catNode =
      product.category === 'green_bean'
        ? { labelVi: 'Cà phê Nhân xanh B2B', labelEn: 'Green Coffee Matrix', to: '/coffee/green-beans' }
        : product.category === 'roasted_beans'
          ? { labelVi: 'Cà phê Hạt rang (kg)', labelEn: 'Roasted Coffee Beans', to: '/coffee/roasted-beans' }
          : product.category === 'instant'
            ? { labelVi: 'Cà phê Hòa tan', labelEn: 'Instant Coffee', to: '/coffee/instant' }
            : { labelVi: 'Cà phê Rang xay', labelEn: 'Roasted Coffee', to: '/coffee/roasted' };
    setCustomBreadcrumb([
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      catNode,
      { labelVi: product.name_vi, labelEn: product.name_en },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [product, setCustomBreadcrumb]);

  if (loading) {
    return <div className="max-w-[1280px] mx-auto px-6 py-20 text-center text-sm">{t('Đang tải sản phẩm...', 'Loading product...')}</div>;
  }

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center space-y-4">
        <p className="text-lg font-semibold">{t('Không tìm thấy sản phẩm.', 'Product not found.')}</p>
        <Link to={localePath('/shop')} className="inline-block px-5 py-2.5 bg-[#00552B] text-white text-sm rounded">
          {t('Quay lại cửa hàng', 'Back to Catalog')}
        </Link>
      </div>
    );
  }

  const hasVolumeTiers =
    product.category === 'roasted_beans' ||
    (Array.isArray(product.pricing_tiers) && product.pricing_tiers.length > 0);
  const activeTier = hasVolumeTiers ? resolveVolumeTier(product.pricing_tiers, quantity) : null;

  const activeVariant = product.variants[selectedVariantIdx] || {
    label: 'Standard',
    priceVnd: product.price_vnd,
    priceUsd: product.price_usd,
  };
  const effectiveUnitVnd = activeTier ? activeTier.priceVnd : activeVariant.priceVnd;
  const effectiveUnitUsd = activeTier ? activeTier.priceUsd : activeVariant.priceUsd;
  const wished = wishlist.includes(product.slug);
  const isGreen = product.category === 'green_bean';

  const handleAdd = (goCheckout = false) => {
    addToCart({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      nameVi: product.name_vi,
      nameEn: product.name_en,
      variantLabel: hasVolumeTiers
        ? `${quantity} kg · ${activeTier ? activeTier.labelVi : '1 kg'}`
        : activeVariant.label,
      unitPriceVnd: effectiveUnitVnd,
      unitPriceUsd: effectiveUnitUsd,
      quantity,
      imageKey: product.image_key,
      unit: hasVolumeTiers ? 'kg' : 'unit',
      pricingTiers: hasVolumeTiers ? product.pricing_tiers : undefined,
    });
    showToast(t('Đã thêm sản phẩm vào giỏ hàng', 'Added to shopping bag'));
    if (goCheckout) navigate(localePath('/checkout'));
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch(`/api/products/${product.slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
    });
    if (res.ok) {
      setReviewComment('');
      showToast(t('Cảm ơn đánh giá của bạn!', 'Thank you for your review!'));
      fetchProduct();
    } else {
      const d = await res.json();
      showToast(d.error || t('Vui lòng đăng nhập để gửi đánh giá.', 'Please sign in to submit a review.'));
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-14">
      <Link
        to={localePath(
          isGreen
            ? '/coffee/green-beans'
            : product.category === 'roasted_beans'
              ? '/coffee/roasted-beans'
              : '/shop'
        )}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#00552B] dark:hover:text-[#C6A667]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>
          {isGreen
            ? t('Quay lại Ma trận Nhân xanh', 'Back to Green Coffee Matrix')
            : product.category === 'roasted_beans'
              ? t('Quay lại Cà phê Hạt rang', 'Back to Roasted Coffee Beans')
              : t('Quay lại danh mục', 'Back to Shop')}
        </span>
      </Link>

      {/* Main Contiguous Purchase / Spec Module with Multi-Image Gallery */}
      {(() => {
        const gallery = getProductGallery(product);
        const safeIdx = activeImageIdx < gallery.length ? activeImageIdx : 0;
        const currentSlide = gallery[safeIdx];
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-3 max-w-[520px] w-full mx-auto">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 group">
                <MediaImage
                  imageKey={currentSlide.imageKey}
                  alt={lang === 'vi' ? `${product.name_vi} — ${currentSlide.captionVi}` : `${product.name_en} — ${currentSlide.captionEn}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 py-3 flex items-end justify-between gap-3">
                  <p className="text-xs text-white/95 font-medium">
                    {lang === 'vi' ? currentSlide.captionVi : currentSlide.captionEn}
                  </p>
                  <span className="font-mono text-[11px] text-[#C6A667] shrink-0 tabular-nums">
                    {safeIdx + 1} / {gallery.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                  aria-label="Previous product image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((i) => (i + 1) % gallery.length)}
                  aria-label="Next product image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Expand gallery image"
                  className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Expand className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {gallery.map((slide, idx) => (
                  <button
                    key={`${slide.imageKey}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === safeIdx
                        ? 'border-[#00552B] ring-2 ring-[#00552B]/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <MediaImage
                      imageKey={slide.imageKey}
                      alt={lang === 'vi' ? slide.captionVi : slide.captionEn}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {product.is_demo_data === 1 && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75">
                  <ShieldAlert className="w-4 h-4 text-[#C6A667] shrink-0 mt-0.5" />
                  <span>
                    {t(
                      'Lưu ý minh bạch dữ liệu: Giá bán và tồn kho hiển thị là dữ liệu cấu hình phát triển; thông số kiểm định lô hàng (độ ẩm, tỷ trọng, lỗi, niên vụ) chỉ được công bố chính thức khi có chứng thư COA xác thực.',
                      'Data transparency notice: Pricing and stock reflect configurable development values; technical lot data (moisture, density, defects, harvest year) is published strictly upon verified COA.'
                    )}
                  </span>
                </div>
              )}

              {lightboxOpen && (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
                  onClick={() => setLightboxOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(false)}
                    aria-label="Close lightbox"
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="max-w-lg w-full space-y-3 mx-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="aspect-[4/5] rounded-xl overflow-hidden bg-black">
                      <MediaImage
                        imageKey={currentSlide.imageKey}
                        alt={lang === 'vi' ? currentSlide.captionVi : currentSlide.captionEn}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/85">
                      <span>{lang === 'vi' ? currentSlide.captionVi : currentSlide.captionEn}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                          className="px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 cursor-pointer"
                        >
                          ← {t('Trước', 'Prev')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx((i) => (i + 1) % gallery.length)}
                          className="px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 cursor-pointer"
                        >
                          {t('Tiếp', 'Next')} →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

        <div className="lg:col-span-6 bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#00552B] dark:text-[#C6A667] font-mono">
              <span>
                {t('Mã SP:', 'SKU:')} {product.sku}
                {product.sub_category && hasVolumeTiers ? ` (${product.sub_category})` : ''}
                {product.barcode ? ` · Barcode: ${product.barcode}` : ''}
                {' · '}
                {localizeCoffeeType(product.coffee_type, lang)}
              </span>
              <button
                type="button"
                onClick={() => toggleWishlist(product.slug)}
                className="inline-flex items-center gap-1 text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#00552B] dark:hover:text-[#C6A667] cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${wished ? 'fill-[#00552B] dark:fill-[#C6A667] text-[#00552B] dark:text-[#C6A667]' : ''}`} />
                <span>{wished ? t('Đã lưu', 'Saved') : t('Lưu lại', 'Wishlist')}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {lang === 'vi' ? product.name_vi : product.name_en}
            </h1>
            <p className="text-sm text-[#00552B] dark:text-[#C6A667] font-medium">
              {lang === 'vi' ? product.subtitle_vi : product.subtitle_en}
            </p>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 border-y border-[#202020]/10 dark:border-white/10 py-4">
            <div>
              <span className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                {formatPrice(effectiveUnitVnd, effectiveUnitUsd)}
                {hasVolumeTiers && <span className="text-sm font-medium opacity-75"> / kg</span>}
              </span>
              {activeTier && (
                <span className="block text-xs font-semibold text-[#00552B] dark:text-[#C6A667] mt-0.5">
                  {t('Mức áp dụng:', 'Active Tier:')} {lang === 'vi' ? activeTier.labelVi : activeTier.labelEn}
                </span>
              )}
            </div>
            <span className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
              {product.inventory > 0
                ? t(`Tồn kho tham chiếu: ${product.inventory}${hasVolumeTiers ? ' kg' : ''}`, `Ref. Stock: ${product.inventory}${hasVolumeTiers ? ' kg' : ''}`)
                : t('Cấu hình theo đơn đặt hàng', 'Configurable on Request')}
            </span>
          </div>

          <p className="text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
            {lang === 'vi' ? product.description_vi : product.description_en}
          </p>

          {/* 5-Tier Kg Volume Pricing Table OR Standard Variants */}
          {hasVolumeTiers && product.pricing_tiers ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#202020]/70 dark:text-[#F1EFEA]/70">
                  {t('Bảng Giá 5 Mức Theo Số Lượng (kg)', '5-Tier Volume Pricing (per kg)')}
                </label>
                <span className="text-[11px] text-[#00552B] dark:text-[#C6A667]">
                  {t('Nhấp để chọn nhanh mức kg', 'Click any tier to apply')}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#202020]/12 dark:border-white/15">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/70 dark:text-[#F1EFEA]/70 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">{t('Mức số lượng', 'Quantity Tier')}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{t('Đơn giá / kg', 'Price / kg')}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{t('Trạng thái', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020]/8 dark:divide-white/10">
                    {product.pricing_tiers.map((tier) => {
                      const isCurrent = activeTier?.minKg === tier.minKg;
                      return (
                        <tr
                          key={tier.minKg}
                          onClick={() => setQuantity(tier.minKg)}
                          className={`cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-[#00552B]/10 dark:bg-[#00552B]/35 text-[#003D25] dark:text-[#C6A667] font-semibold'
                              : 'hover:bg-[#F8F5EF]/70 dark:hover:bg-white/5 text-[#202020]/85 dark:text-[#F1EFEA]/85'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono">{lang === 'vi' ? tier.labelVi : tier.labelEn}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                            {formatPrice(tier.priceVnd, tier.priceUsd)}/kg
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00552B] text-white text-[10px] font-semibold">
                                <Check className="w-3 h-3" /> {t('Đang áp dụng', 'Active')}
                              </span>
                            ) : (
                              <span className="text-[11px] opacity-60">{t('Chọn mức này', 'Select')}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#202020]/70 dark:text-[#F1EFEA]/70 block">
                  {t('Quy cách & Biến thể', 'Select Packaging / Variant')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3.5 py-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        idx === selectedVariantIdx
                          ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/6 dark:bg-[#00552B]/30 text-[#003D25] dark:text-[#C6A667] font-semibold'
                          : 'border-[#202020]/15 dark:border-white/15 text-[#202020]/80 dark:text-[#F1EFEA]/80 hover:border-[#00552B]/40'
                      }`}
                    >
                      <span className="block">{localizeVariantLabel(v.label, lang)}</span>
                      <span className="font-mono text-[11px] opacity-80 tabular-nums">
                        {formatPrice(v.priceVnd, v.priceUsd)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Purchase / B2B Actions */}
          {isGreen ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setB2bType('sample_request');
                    setB2bOpen(true);
                  }}
                  className="py-3 px-4 bg-[#00552B] text-white text-sm font-semibold rounded hover:bg-[#003D25] cursor-pointer"
                >
                  {t('YÊU CẦU MẪU THỬ', 'REQUEST A SAMPLE')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setB2bType('green_quotation');
                    setB2bOpen(true);
                  }}
                  className="py-3 px-4 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-sm font-semibold rounded hover:bg-[#00552B]/5 cursor-pointer"
                >
                  {t('YÊU CẦU BÁO GIÁ', 'REQUEST A QUOTATION')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(false)}
                className="w-full py-2.5 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 text-xs font-medium text-[#202020] dark:text-[#F1EFEA] rounded hover:bg-[#ece7dd] dark:hover:bg-white/10 cursor-pointer"
              >
                {t('Thêm mẫu / quy cách đã chọn vào giỏ B2B', 'Add Selected Variant to Order Cart')}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {hasVolumeTiers && (
                <div className="p-4 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/15 dark:border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">
                      {t('Chọn nhanh số lượng kg:', 'Quick select kg:')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 5, 20, 50, 100].map((presetKg) => (
                        <button
                          key={presetKg}
                          type="button"
                          onClick={() => setQuantity(presetKg)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                            quantity === presetKg
                              ? 'bg-[#00552B] text-white border-[#00552B]'
                              : 'bg-white dark:bg-[#16221C] border-[#202020]/15 dark:border-white/15 hover:border-[#00552B]'
                          }`}
                        >
                          {presetKg} kg
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#202020]/10 dark:border-white/10 text-xs">
                    <div>
                      <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70 block">
                        {t('Đơn giá áp dụng', 'Applied Unit Price')} ({activeTier ? (lang === 'vi' ? activeTier.labelVi : activeTier.labelEn) : '1 kg'})
                      </span>
                      <span className="font-mono font-bold text-sm text-[#00552B] dark:text-[#C6A667] tabular-nums">
                        {formatPrice(effectiveUnitVnd, effectiveUnitUsd)}/kg
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70 block">
                        {t(`Tổng giá trị (${quantity} kg)`, `Order Total (${quantity} kg)`)}
                      </span>
                      <span className="font-mono font-bold text-base text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                        {formatPrice(effectiveUnitVnd * quantity, effectiveUnitUsd * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded bg-white dark:bg-[#0E1512]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 text-sm font-medium cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    aria-label={t('Số lượng', 'Quantity')}
                    className="w-16 h-10 text-center text-sm font-semibold bg-transparent focus:outline-none tabular-nums"
                  />
                  {hasVolumeTiers && <span className="pr-2.5 text-xs font-mono opacity-60">kg</span>}
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 text-sm font-medium cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(false)}
                  className="flex-1 py-3 bg-[#00552B] text-white text-sm font-semibold rounded hover:bg-[#003D25] transition-colors cursor-pointer"
                >
                  {hasVolumeTiers
                    ? t(`Thêm ${quantity} kg vào giỏ`, `Add ${quantity} kg to Cart`)
                    : t('Thêm vào giỏ hàng', 'Add to Cart')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAdd(true)}
                  className="py-2.5 bg-[#202020] dark:bg-[#C6A667] text-white dark:text-[#111111] text-xs font-semibold rounded hover:bg-black dark:hover:bg-[#d4b67a] cursor-pointer"
                >
                  {t('Mua ngay', 'Buy Now')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setB2bType('wholesale_partner');
                    setB2bOpen(true);
                  }}
                  className="py-2.5 border border-[#202020]/20 dark:border-white/20 text-[#202020] dark:text-[#F1EFEA] text-xs font-medium rounded hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                >
                  {t('Yêu cầu giá sỉ / HORECA', 'Wholesale Inquiry')}
                </button>
              </div>
            </div>
          )}

          {/* Technical / Spec Details */}
          <div className="pt-4 border-t border-[#202020]/10 dark:border-white/10 space-y-2.5 text-xs">
            {product.barcode && (
              <div className="flex justify-between gap-4">
                <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Mã vạch (Barcode EAN-13)', 'Barcode (EAN-13)')}</span>
                <span className="font-mono font-semibold text-right text-[#00552B] dark:text-[#C6A667]">{product.barcode}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Thông tin phối trộn', 'Blend Information')}</span>
              <span className="font-medium text-right">{lang === 'vi' ? product.blend_summary_vi : product.blend_summary_en}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Hồ sơ rang / Chế biến', 'Roast / Process')}</span>
              <span className="font-medium text-right">{lang === 'vi' ? product.roast_profile_vi : product.roast_profile_en}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Ghi chú thử nếm', 'Tasting Notes')}</span>
              <span className="font-medium text-right">{lang === 'vi' ? product.tasting_notes_vi : product.tasting_notes_en}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Phương pháp pha gợi ý', 'Recommended Brewing')}</span>
              <span className="font-medium text-right">{product.brewing_methods.map((m) => localizeBrewingMethod(m, lang)).join(' · ')}</span>
            </div>
            {(isGreen || hasVolumeTiers) && (
              <>
                {product.screen_size && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Kích thước sàng / Phẩm cấp', 'Screen Size / Grade')}</span>
                    <span className="font-medium text-right">{product.screen_size}{product.sub_category ? ` · ${product.sub_category}` : ''}</span>
                  </div>
                )}
                {product.origin_region && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Vùng trồng', 'Origin Region')}</span>
                    <span className="font-medium text-right">{product.origin_region}</span>
                  </div>
                )}
                {isGreen && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Niên vụ', 'Harvest Year')}</span>
                      <span className="font-medium text-right">{product.harvest_year}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Độ ẩm / Tỷ trọng / Lỗi', 'Moisture / Density / Defects')}</span>
                      <span className="font-medium text-right">{product.moisture_content} · {product.density}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Số lượng đặt tối thiểu (MOQ)', 'Minimum Order Quantity')}</span>
                  <span className="font-medium text-right">{product.moq}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
        );
      })()}

      {/* Customer Reviews */}
      <section className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">{t('Đánh giá từ Khách hàng', 'Product Reviews')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t(
                  'Chưa có đánh giá nào được gửi cho sản phẩm này. ROAR COFFEE không tự tạo đánh giá giả lập.',
                  'No customer reviews submitted yet for this item. Verified buyer feedback appears here once posted.'
                )}
              </p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="pb-4 border-b border-[#202020]/8 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#202020] dark:text-[#F1EFEA]">{rev.author_name}</span>
                    <span className="text-xs text-[#202020]/50 dark:text-[#F1EFEA]/50">{rev.created_at.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#C6A667]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-[#C6A667]" />
                    ))}
                    {rev.verified_purchase === 1 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#00552B] dark:text-[#C6A667] font-medium">
                        <Check className="w-3 h-3" /> {t('Đã mua hàng', 'Verified Purchase')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={submitReview} className="lg:col-span-5 bg-[#F8F5EF] dark:bg-[#0E1512] p-5 rounded-lg space-y-3 border border-transparent dark:border-white/10">
            <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">{t('Viết đánh giá của bạn', 'Write a Review')}</h3>
            {!user && (
              <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t('Vui lòng ', 'Please ')}
                <Link to={localePath('/account')} className="text-[#00552B] dark:text-[#C6A667] underline font-medium">
                  {t('đăng nhập tài khoản thành viên', 'sign in')}
                </Link>
                {t(' để gửi đánh giá.', ' to submit a review.')}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span>{t('Điểm đánh giá:', 'Rating:')}</span>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded px-2 py-1"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>
            </div>
            <textarea
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t('Chia sẻ cảm nhận hương vị và phương pháp pha chế...', 'Share your brewing experience...')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!user}
              className="px-4 py-2 bg-[#00552B] text-white text-xs font-semibold rounded hover:bg-[#003D25] disabled:opacity-50 cursor-pointer"
            >
              {t('Gửi đánh giá', 'Submit Review')}
            </button>
          </form>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">{t('Sản phẩm liên quan', 'Related Products')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((r) => (
              <Link
                key={r.id}
                to={localePath(`/product/${r.slug}`)}
                className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden hover:-translate-y-0.5 transition-transform"
              >
                <div className="aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage imageKey={r.image_key} alt={lang === 'vi' ? r.name_vi : r.name_en} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667]">{r.sku}</span>
                  <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] line-clamp-1">{lang === 'vi' ? r.name_vi : r.name_en}</h3>
                  <span className="text-xs font-semibold text-[#202020] dark:text-[#F1EFEA] tabular-nums block">
                    {formatPrice(r.price_vnd, r.price_usd)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedStrip excludeSlug={product.slug} />

      <B2BInquiryModal
        open={b2bOpen}
        onClose={() => setB2bOpen(false)}
        defaultType={b2bType}
        productSku={product.sku}
        productTitle={lang === 'vi' ? product.name_vi : product.name_en}
      />
    </div>
  );
};
