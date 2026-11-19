import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, ChevronDown, ChevronLeft, ChevronRight, Compass, Flame, Gift, Globe2, PackageCheck, Pause, Play, ShoppingBag } from 'lucide-react';
import { AdaptiveLogo } from '../components/AdaptiveLogo';
import { MediaImage } from '../components/MediaImage';
import { VietnamOriginMap } from '../components/VietnamOriginMap';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { localizeCoffeeType, localizeJournalCategory } from '../lib/i18nHelpers';
import { fetchJournalWithFallback, fetchProductsWithFallback, fetchPromotionsWithFallback } from '../lib/staticFallback';

interface HeroSlide {
  id: string;
  imageKey: string;
  badgeVi: string;
  badgeEn: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  captionVi: string;
  captionEn: string;
  primaryCtaVi: string;
  primaryCtaEn: string;
  primaryTo: string;
  secondaryCtaVi: string;
  secondaryCtaEn: string;
  secondaryTo: string;
  tabLabelVi: string;
  tabLabelEn: string;
  surfaceClass: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'flagship',
    imageKey: 'hero_roar_coffee',
    badgeVi: 'Thương hiệu Cà phê Việt Nam Cao Cấp',
    badgeEn: 'Distinctive Vietnamese Coffee Brand',
    titleVi: 'KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.',
    titleEn: 'IGNITING COURAGE. DEFINING CHARACTER.',
    descVi:
      'Kết tinh vùng nguyên liệu Việt Nam đích thực, nghệ thuật rang xay tinh tuyển, 7 cá tính thương hiệu riêng biệt và nền tảng thương mại cà phê nhân xanh S14/S16/S18 chuẩn quốc tế.',
    descEn:
      'Uniting authentic Vietnamese coffee origins, disciplined roast craftsmanship, seven distinctive brand personalities, and a commercial S14/S16/S18 green coffee portal.',
    captionVi: 'Hình ảnh minh họa nghệ thuật pha Phin Việt Nam — KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.',
    captionEn: 'Editorial concept of Vietnamese Phin extraction — IGNITING COURAGE. DEFINING CHARACTER.',
    primaryCtaVi: 'Khám phá cà phê',
    primaryCtaEn: 'Explore Coffee',
    primaryTo: '/shop',
    secondaryCtaVi: 'Trở thành đối tác',
    secondaryCtaEn: 'Become a Partner',
    secondaryTo: '/partners',
    tabLabelVi: '01 · Bản sắc ROAR',
    tabLabelEn: '01 · ROAR Identity',
    surfaceClass: 'bg-[#003D25]',
  },
  {
    id: 'signature-reserve',
    imageKey: 'hero_signature_reserve_banner',
    badgeVi: 'Báo Đen · 60% Robusta · 20% Culi · 20% Arabica',
    badgeEn: 'Black Panther · 60% Robusta · 20% Culi · 20% Arabica',
    titleVi: 'ROAR SIGNATURE RESERVE — ĐẲNG CẤP TINH HOA',
    titleEn: 'ROAR SIGNATURE RESERVE — LUXURY EDITION',
    descVi:
      'Tuyệt phẩm phối trộn chỉ định từ nhân xanh chế biến ướt CBU, lớp crema dày mịn hổ phách và hộp quà đen huyền – vàng champagne cho những dấu ấn trang trọng.',
    descEn:
      'Precision-crafted flagship blend with specified Washed CBU green beans, rich tiger-striped crema, and obsidian-gold executive gifting.',
    captionVi: 'Chiết xuất Espresso Signature Reserve với lớp crema vàng hổ phách đặc trưng.',
    captionEn: 'Signature Reserve Espresso extraction with rich amber tiger-striped crema.',
    primaryCtaVi: 'Khám phá Signature Reserve',
    primaryCtaEn: 'Discover Signature Reserve',
    primaryTo: '/signature-reserve',
    secondaryCtaVi: 'Đặt mua phiên bản Reserve',
    secondaryCtaEn: 'Shop Reserve Edition',
    secondaryTo: '/product/signature-reserve',
    tabLabelVi: '02 · Signature Reserve',
    tabLabelEn: '02 · Signature Reserve',
    surfaceClass: 'bg-[#0D1913]',
  },
  {
    id: 'green-matrix',
    imageKey: 'hero_highland_harvest_banner',
    badgeVi: 'Nguồn hạt Cao nguyên · Chuẩn B2B & Xuất khẩu',
    badgeEn: 'Highland Harvest · B2B & Export Matrix',
    titleVi: '27 CẤU HÌNH NHÂN XANH S14 / S16 / S18',
    titleEn: '27 CONFIGURABLE GREEN COFFEE SKUS',
    descVi:
      'Minh bạch từng vùng trồng Tây Nguyên với 3 dòng hạt (Robusta, Arabica, Culi/Peaberry), 3 cỡ sàng và 3 phương pháp Natural, Honey, Washed (CBU) sẵn sàng gửi mẫu thử.',
    descEn:
      'Traceable Central Highlands sourcing across 3 bean types, 3 screen grades (S14, S16, S18), and Natural, Honey & Washed (CBU) processing with sample fulfillment.',
    captionVi: 'Mùa thu hoạch chín mọng trên cao nguyên Tây Nguyên — nền tảng của mọi mẻ rang chuẩn.',
    captionEn: 'Ripe highland coffee harvest across Vietnam Central Highlands — foundation of every roast.',
    primaryCtaVi: 'Mở ma trận nhân xanh 27 mã',
    primaryCtaEn: 'Open 27-SKU Matrix',
    primaryTo: '/coffee/green-beans',
    secondaryCtaVi: 'OEM & Xuất khẩu',
    secondaryCtaEn: 'OEM & Export',
    secondaryTo: '/oem-export',
    tabLabelVi: '03 · Nhân xanh B2B',
    tabLabelEn: '03 · Green Coffee B2B',
    surfaceClass: 'bg-[#003D25]',
  },
  {
    id: 'brewing-craft',
    imageKey: 'product_brewing_ritual',
    badgeVi: 'Từ Nông Trại Đến Tách Cà Phê',
    badgeEn: 'From Farm to Cup Craft',
    titleVi: 'NGHỆ THUẬT PHA PHIN & RANG XAY CHUẨN MỰC',
    titleEn: 'VIETNAMESE PHIN & ROASTERY DISCIPLINE',
    descVi:
      'Khám phá quy trình 8 bước khép kín từ canh tác, chế biến đến công thức pha Phin truyền thống, Espresso, Pour-over và Cold Brew tối ưu cho từng gu thưởng thức.',
    descEn:
      'Explore our 8-stage farm-to-cup workflow alongside calibrated recipes for Vietnamese Phin, Espresso, Pour-over, French Press, and Cold Brew.',
    captionVi: 'Nghi thức pha Phin Việt Nam chậm rãi, tôn vinh hương vị nguyên bản.',
    captionEn: 'Slow Vietnamese Phin ritual celebrating authentic highland terroir.',
    primaryCtaVi: 'Xem hướng dẫn pha chế',
    primaryCtaEn: 'Brewing Guide',
    primaryTo: '/brewing',
    secondaryCtaVi: 'Hành trình 8 bước',
    secondaryCtaEn: '8-Stage Journey',
    secondaryTo: '/farm-to-cup',
    tabLabelVi: '04 · Pha chế & Quy trình',
    tabLabelEn: '04 · Brew & Craft',
    surfaceClass: 'bg-[#062C1B]',
  },
];

export const HomePage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { personalities, formatPrice, addToCart, showToast, theme } = useStore();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [giftVouchers, setGiftVouchers] = useState<Product[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Quick interactive Green Coffee selector
  const [gcType, setGcType] = useState('RO');
  const [gcScreen, setGcScreen] = useState('S18');
  const [gcProc, setGcProc] = useState('HON');

  useEffect(() => {
    fetchProductsWithFallback()
      .then((list) => {
        setFeaturedProducts(list.filter((p: Product) => p.category !== 'green_bean' && p.sub_category !== 'Gift Voucher').slice(0, 4));
        setGiftVouchers(list.filter((p: Product) => p.sub_category === 'Gift Voucher').sort((a: Product, b: Product) => a.price_vnd - b.price_vnd));
      })
      .catch(() => {});
    fetchJournalWithFallback()
      .then((list) => setArticles(list.slice(0, 3)))
      .catch(() => {});
    fetchPromotionsWithFallback()
      .then((list) => setPromotions(list.slice(0, 4)))
      .catch(() => {});
  }, []);

  const isCarouselPaused = heroPaused || userPaused;

  useEffect(() => {
    if (isCarouselPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = window.setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isCarouselPaused]);

  const activeSlide = HERO_SLIDES[heroIdx];
  const selectedGreenSku = `${gcType}-${gcScreen}-${gcProc}`;
  const selectedGreenSlug = `green-${gcType.toLowerCase()}-${gcScreen.toLowerCase()}-${gcProc.toLowerCase()}`;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 45) {
      setHeroIdx((prev) => (delta < 0 ? (prev + 1) % HERO_SLIDES.length : (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length));
    }
    touchStartX.current = null;
  };

  return (
    <div className="bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] transition-colors">
      {/* 1. COMPACT DYNAMIC MULTI-SLIDE HERO BANNER CAROUSEL */}
      <section
        className={`relative ${activeSlide.surfaceClass} text-white overflow-hidden transition-colors duration-700`}
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-6 pb-5 lg:pt-8 lg:pb-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div key={activeSlide.id} className="lg:col-span-6 flex flex-col justify-center space-y-4 transition-all duration-500">
            <div className="flex items-center justify-between gap-3">
              <AdaptiveLogo variant="horizontal" surface="dark" size="sm" />
              <span className="font-mono text-[11px] text-[#C6A667]/90 border border-[#C6A667]/30 px-2 py-0.5 rounded tabular-nums">
                0{heroIdx + 1} / 0{HERO_SLIDES.length}
              </span>
            </div>

            <div className="space-y-2 min-h-[144px] sm:min-h-[162px] flex flex-col justify-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#C6A667]">
                {lang === 'vi' ? activeSlide.badgeVi : activeSlide.badgeEn}
              </p>
              <h1 className="text-[clamp(1.65rem,2.9vw,2.55rem)] leading-[1.14] font-bold tracking-tight text-balance line-clamp-2">
                {lang === 'vi' ? activeSlide.titleVi : activeSlide.titleEn}
              </h1>
              <p className="text-xs sm:text-sm text-[#F8F5EF]/80 leading-relaxed max-w-xl line-clamp-3">
                {lang === 'vi' ? activeSlide.descVi : activeSlide.descEn}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to={localePath(activeSlide.primaryTo)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A667] text-[#111111] font-semibold text-xs sm:text-sm rounded hover:bg-[#d4b67a] transition-colors whitespace-nowrap"
              >
                <span>{lang === 'vi' ? activeSlide.primaryCtaVi : activeSlide.primaryCtaEn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={localePath(activeSlide.secondaryTo)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-medium text-xs sm:text-sm rounded hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <span>{lang === 'vi' ? activeSlide.secondaryCtaVi : activeSlide.secondaryCtaEn}</span>
              </Link>
            </div>

            {/* Dynamic Horizontal Running Carousel of 8 Diverse Metrics */}
            <div className="pt-3 border-t border-white/15">
              <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                <div className="animate-metrics-marquee gap-2.5">
                  {[0, 1].map((dup) => (
                    <div key={dup} className="flex items-stretch gap-2.5 pr-2.5" aria-hidden={dup === 1}>
                      {[
                        {
                          value: '7',
                          dot: 'bg-[#C6A667]',
                          title: t('Cá tính thương hiệu', 'Brand Personalities'),
                          sub: t('Hổ · Sư Tử · Cáo · Báo Đen · Sói', 'Tiger · Lion · Fox · Panther · Wolf'),
                          to: '/personalities',
                        },
                        {
                          value: '27+ SKUs',
                          dot: 'bg-emerald-400',
                          title: t('Ma trận Nhân xanh B2B', 'B2B Green Coffee Matrix'),
                          sub: t('Robusta · Arabica · Culi S14–S18', 'Robusta · Arabica · Culi S14–S18'),
                          to: '/coffee/green-beans',
                        },
                        {
                          value: 'CBU',
                          dot: 'bg-amber-300',
                          title: t('Chuẩn Chế Biến Ướt', 'Washed CBU Standard'),
                          sub: t('Full Washed · Honey · Natural', 'Full Washed · Honey · Natural'),
                          to: '/coffee/roasted-beans',
                        },
                        {
                          value: '6 S18',
                          dot: 'bg-[#C6A667]',
                          title: t('Hạt rang 5 mức giá kg', 'Roasted Beans 5-Tier kg'),
                          sub: t('1kg · 5–19kg · 20–99kg · ≥100kg', '1kg · 5–19kg · 20–99kg · ≥100kg'),
                          to: '/coffee/roasted-beans',
                        },
                        {
                          value: '10 Vùng',
                          dot: 'bg-emerald-300',
                          title: t('Cao nguyên Việt Nam', 'Vietnam Highland Origins'),
                          sub: t('Cầu Đất 1.500m · Buôn Ma Thuột', 'Cau Dat 1,500m · Buon Ma Thuot'),
                          to: '/regions',
                        },
                        {
                          value: '100% Mộc',
                          dot: 'bg-amber-400',
                          title: t('Rang mới chuẩn COA', 'Fresh Roast · COA Verified'),
                          sub: t('Không tẩm ướp · Ẩm ≤12.5%', 'Pure roast · Moisture ≤12.5%'),
                          to: '/quality',
                        },
                        {
                          value: 'OEM / B2B',
                          dot: 'bg-[#C6A667]',
                          title: t('Gia công & Xuất khẩu', 'OEM Roasting & Export'),
                          sub: t('HORECA · Nhãn riêng · Mẫu thử', 'HORECA · Private Label · Samples'),
                          to: '/partners',
                        },
                        {
                          value: '24/7 AI',
                          dot: 'bg-emerald-400',
                          title: t('Barista & Báo giá nhanh', 'AI Barista & Instant Quote'),
                          sub: t('Tư vấn gu uống · Báo giá theo kg', 'Taste match · Live kg quotes'),
                          to: '/brewing',
                        },
                      ].map((item, idx) => (
                        <Link
                          key={`${dup}-${idx}`}
                          to={localePath(item.to)}
                          className="group w-[178px] sm:w-[192px] shrink-0 p-2.5 rounded-lg bg-white/6 hover:bg-white/14 border border-white/12 hover:border-[#C6A667]/60 transition-all"
                        >
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="font-mono text-sm sm:text-base font-bold text-[#C6A667] tabular-nums group-hover:scale-105 transition-transform origin-left">
                              {item.value}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse`} />
                          </div>
                          <span className="block text-[11px] font-semibold text-white leading-tight mt-0.5 truncate">
                            {item.title}
                          </span>
                          <span className="block text-[10px] text-[#F8F5EF]/70 mt-0.5 truncate">
                            {item.sub}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Uniform 4:3 Aspect Ratio Hero Media Frame */}
          <div className="lg:col-span-6 w-full">
            <div className="relative w-full aspect-[4/3] max-h-[370px] rounded-xl overflow-hidden border border-[#C6A667]/25 bg-black/25">
              {HERO_SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  aria-hidden={idx !== heroIdx}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    idx === heroIdx ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.03] z-0 pointer-events-none'
                  }`}
                >
                  <MediaImage
                    imageKey={slide.imageKey}
                    alt={lang === 'vi' ? slide.titleVi : slide.titleEn}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end justify-between gap-3 p-4">
                <p className="text-[11px] sm:text-xs text-[#F8F5EF]/90 max-w-md line-clamp-2">
                  {lang === 'vi' ? activeSlide.captionVi : activeSlide.captionEn}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={userPaused ? t('Tiếp tục chạy banner', 'Resume carousel') : t('Tạm dừng banner', 'Pause carousel')}
                    className="w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center hover:bg-[#C6A667] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    {userPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                    aria-label={t('Banner trước', 'Previous banner')}
                    className="w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center hover:bg-[#C6A667] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
                    aria-label={t('Banner tiếp theo', 'Next banner')}
                    className="w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center hover:bg-[#C6A667] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Hero Banner Selector Tabs with Dynamic Progress Track */}
        <div className="border-t border-white/10 bg-black/15">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-6 py-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {HERO_SLIDES.map((slide, idx) => {
              const active = idx === heroIdx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setHeroIdx(idx)}
                  className={`relative overflow-hidden text-left px-3 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-[#C6A667] text-[#111111] border-[#C6A667] font-semibold'
                      : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="block truncate">{lang === 'vi' ? slide.tabLabelVi : slide.tabLabelEn}</span>
                  {active && !isCarouselPaused && (
                    <span
                      key={`prog-${heroIdx}`}
                      className="absolute inset-x-0 bottom-0 h-[2.5px] bg-[#003D25]/60 animate-hero-progress"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPACT COLLAPSIBLE GIFT VOUCHER BAR (50k - 100k - 500k - 1M) */}
      {giftVouchers.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-5">
          <div className="rounded-xl border border-[#C6A667]/35 bg-white dark:bg-[#16221C] shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setGiftOpen((v) => !v)}
                className="flex-1 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer min-w-[240px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-[#00552B] text-[#C6A667] flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                      {t('Thẻ Quà Tặng ROAR Gift Voucher (50k · 100k · 500k · 1.000.000₫)', 'ROAR Gift Vouchers (50k · 100k · 500k · 1,000,000 VND)')}
                    </p>
                    <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 truncate">
                      {t('Bấm để mở danh sách Gift Voucher như sản phẩm · E-Voucher & Thẻ cứng ép kim', 'Click to expand Gift Voucher products · Digital E-Voucher & Foil Card')}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] shrink-0">
                  <span className="hidden sm:inline">{giftOpen ? t('Thu gọn', 'Collapse') : t('Xem Voucher', 'Expand')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${giftOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              <Link
                to={localePath('/account?tab=rewards')}
                className="px-3.5 py-2 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{t('Điểm danh nhận quà (+100đ)', 'Daily Check-in (+100 pts)')}</span>
              </Link>
            </div>

            {giftOpen && (
              <div className="p-4 sm:p-5 border-t border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/50 dark:bg-[#0E1512]/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {giftVouchers.map((gv) => (
                    <div
                      key={gv.id}
                      className="rounded-xl bg-white dark:bg-[#16221C] border border-[#00552B]/15 dark:border-[#C6A667]/25 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <Link to={localePath(`/product/${gv.slug}`)} className="block relative aspect-[16/10] bg-[#003D25] overflow-hidden">
                          <MediaImage
                            imageKey={gv.image_key}
                            alt={lang === 'en' ? gv.name_en : gv.name_vi}
                            className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#111111]/85 text-[#C6A667] font-mono text-[11px] font-bold">
                            {formatPrice(gv.price_vnd, gv.price_usd)}
                          </span>
                        </Link>
                        <div className="p-3 space-y-1.5">
                          <Link
                            to={localePath(`/product/${gv.slug}`)}
                            className="block text-xs font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] line-clamp-2"
                          >
                            {lang === 'en' ? gv.name_en : gv.name_vi}
                          </Link>
                          <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2 leading-relaxed">
                            {lang === 'en' ? gv.subtitle_en || gv.description_en : gv.subtitle_vi || gv.description_vi}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 pb-3 pt-1 flex items-center gap-2">
                        <Link
                          to={localePath(`/product/${gv.slug}`)}
                          className="flex-1 py-1.5 rounded-lg border border-[#00552B]/25 dark:border-[#C6A667]/30 text-center text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B]/5"
                        >
                          {t('Chi tiết', 'Details')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            const firstVar = gv.variants?.[0];
                            addToCart({
                              productId: gv.id,
                              slug: gv.slug,
                              sku: gv.sku,
                              nameVi: gv.name_vi,
                              nameEn: gv.name_en,
                              variantLabel: firstVar?.label || 'E-Voucher',
                              unitPriceVnd: gv.price_vnd,
                              unitPriceUsd: gv.price_usd,
                              quantity: 1,
                              imageKey: gv.image_key,
                            });
                            showToast(t(`Đã thêm ${gv.name_vi} vào giỏ`, `Added ${gv.name_en} to cart`));
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{t('Chọn mua', 'Add')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. BRAND INTRODUCTION (with Official Vertical Logo) */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-b border-[#202020]/10 dark:border-white/10">
        <div className="lg:col-span-4 flex justify-center lg:justify-start">
          <div className="bg-white dark:bg-[#16221C] p-8 rounded-xl border border-[#202020]/8 dark:border-white/10 inline-flex flex-col items-center text-center">
            <AdaptiveLogo variant="vertical" surface={theme === 'dark' ? 'dark' : 'light'} size="md" />
          </div>
        </div>
        <div className="lg:col-span-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
            {t('Triết lý thương hiệu', 'Brand Positioning')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance">
            {t(
              'Bản sắc cà phê Việt Nam đương đại cho thị trường nội địa và quốc tế',
              'Authentic Vietnamese coffee heritage shaped for contemporary life and global trade'
            )}
          </h2>
          <p className="text-base text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed max-w-3xl">
            {t(
              'ROAR COFFEE kết hợp nguồn gốc cà phê Việt Nam chân thực, tay nghề chế tác chuẩn mực, phong cách sống hiện đại và bảy cá tính độc bản. Từ tách cà phê hằng ngày đến chuỗi cung ứng nhân xanh thương mại S14/S16/S18, mọi điểm chạm đều nhất quán về chất lượng và sự minh bạch.',
              'ROAR COFFEE bridges authentic Vietnamese highland coffee origins, disciplined craft, modern lifestyles, and seven distinct character archetypes — spanning daily roasted rituals, luxury Reserve gifting, and institutional S14/S16/S18 green bean supply.'
            )}
          </p>
          <div className="pt-2">
            <Link to={localePath('/about')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline inline-flex items-center gap-1.5">
              <span>{t('Tìm hiểu câu chuyện ROAR COFFEE', 'Read the ROAR COFFEE Story')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COFFEE COLLECTIONS */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Bộ sưu tập tiêu biểu', 'Featured Collections')}
            </p>
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('Cà Phê Rang Xay & Hòa Tan ROAR', 'Roasted & Instant Collections')}
            </h2>
          </div>
          <Link to={localePath('/shop')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap">
            {t('Xem tất cả sản phẩm →', 'View All Products →')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/8 dark:border-white/10 overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <Link to={localePath(`/product/${p.slug}`)} className="block aspect-[4/5] overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage
                    imageKey={p.image_key}
                    alt={lang === 'vi' ? p.name_vi : p.name_en}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </Link>
                <div className="p-5 space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                    {p.sku} · {localizeCoffeeType(p.coffee_type, lang)}
                  </p>
                  <Link
                    to={localePath(`/product/${p.slug}`)}
                    className="block text-base font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] leading-snug"
                  >
                    {lang === 'vi' ? p.name_vi : p.name_en}
                  </Link>
                  <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2">
                    {lang === 'vi' ? p.subtitle_vi : p.subtitle_en}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-[#202020]/8 dark:border-white/10 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                  {formatPrice(p.price_vnd, p.price_usd)}
                </span>
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
                  className="px-3 py-1.5 bg-[#00552B] text-white text-xs font-medium rounded hover:bg-[#003D25] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t('Thêm vào giỏ', 'Add to Cart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SEVEN BRAND PERSONALITIES */}
      <section className="bg-white dark:bg-[#131D18] border-y border-[#202020]/10 dark:border-white/10 py-16">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
                {t('7 Cá Tính – 7 Dấu Ấn Riêng', 'Seven Personalities. Seven Distinct Characters.')}
              </p>
              <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
                {t('Khám phá Linh Vật Bản Sắc ROAR COFFEE', 'Meet the Seven ROAR Characters')}
              </h2>
            </div>
            <Link to={localePath('/personalities')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap">
              {t('Trải nghiệm đầy đủ →', 'Explore All Seven →')}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {personalities.map((m) => (
              <Link
                key={m.slug}
                to={localePath(`/personalities/${m.slug}`)}
                className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all hover:-translate-y-1 ${
                  m.slug === 'black-panther'
                    ? 'bg-[#111111] text-[#F8F5EF] border-[#C6A667]/40'
                    : 'bg-[#F8F5EF] dark:bg-[#1A2820] text-[#202020] dark:text-[#F1EFEA] border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/50'
                }`}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <MediaImage
                    imageKey={m.custom_image_url || m.image_key}
                    alt={`${m.animal_en} — ${m.animal_vi}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold leading-tight">
                    {lang === 'vi' ? m.animal_vi : `${m.animal_en} · ${m.animal_vi}`}
                  </h3>
                  <p className={`text-[11px] line-clamp-2 ${m.slug === 'black-panther' ? 'text-[#C6A667]' : 'text-[#202020]/65 dark:text-[#F1EFEA]/65'}`}>
                    {lang === 'vi' ? m.traits_vi : m.traits_en}
                  </p>
                  <p className={`text-[10px] pt-1 font-medium ${m.slug === 'black-panther' ? 'text-white/75' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                    {lang === 'vi' ? m.product_association_vi : m.product_association_en}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. GREEN COFFEE BEANS (B2B CONFIGURABLE MATRIX GATEWAY) */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="bg-[#003D25] text-white rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A667]">
              {t('Thương mại B2B & Xuất khẩu', 'B2B Green Coffee Supply')}
            </p>
            <h2 className="text-3xl font-bold text-balance">
              {t('Cà Phê Nhân Xanh Việt Nam — 27 Cấu Hình Chuẩn Hóa', 'Vietnamese Green Coffee Beans — 27 Configurable Specifications')}
            </h2>
            <p className="text-sm text-[#F8F5EF]/80 leading-relaxed">
              {t(
                'Hệ thống cấu hình 3 dòng hạt (Robusta, Arabica, Culi/Peaberry) × 3 cỡ sàng (S14, S16, S18) × 3 phương pháp chế biến (Natural, Honey, Washed CBU). Dễ dàng tra cứu thông số, yêu cầu mẫu thử và nhận báo giá 30kg, 60kg, 69kg hoặc Big Bag 1.000kg.',
                'Configure across 3 classifications (Robusta, Arabica, Culi / Peaberry) × 3 screen sizes (S14, S16, S18) × 3 processing methods (Natural, Honey, Washed CBU). Request verified samples and quotations from 30kg bags to 1,000kg Big Bags.'
              )}
            </p>

            {/* Quick Interactive Matrix Builder */}
            <div className="bg-white/10 rounded-xl p-4 space-y-3 border border-white/15">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#C6A667] block mb-1 font-medium">{t('Dòng hạt', 'Type')}</span>
                  <select
                    value={gcType}
                    onChange={(e) => setGcType(e.target.value)}
                    className="w-full bg-[#002D1B] border border-white/20 rounded px-2 py-2 text-white"
                  >
                    <option value="RO">Robusta (RO)</option>
                    <option value="AR">Arabica (AR)</option>
                    <option value="CU">{t('Culi / Hạt tròn (CU)', 'Culi / Peaberry (CU)')}</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#C6A667] block mb-1 font-medium">{t('Cỡ sàng', 'Screen')}</span>
                  <select
                    value={gcScreen}
                    onChange={(e) => setGcScreen(e.target.value)}
                    className="w-full bg-[#002D1B] border border-white/20 rounded px-2 py-2 text-white"
                  >
                    <option value="S14">S14</option>
                    <option value="S16">S16</option>
                    <option value="S18">S18</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#C6A667] block mb-1 font-medium">{t('Chế biến', 'Process')}</span>
                  <select
                    value={gcProc}
                    onChange={(e) => setGcProc(e.target.value)}
                    className="w-full bg-[#002D1B] border border-white/20 rounded px-2 py-2 text-white"
                  >
                    <option value="NAT">{t('Sơ chế Khô (Natural)', 'Natural')}</option>
                    <option value="HON">{t('Sơ chế Mật ong (Honey)', 'Honey')}</option>
                    <option value="CBU">{t('Chế biến ướt (CBU)', 'Washed (CBU)')}</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-mono text-sm text-[#C6A667] font-semibold">SKU: {selectedGreenSku}</span>
                <div className="flex gap-2">
                  <Link
                    to={localePath(`/product/${selectedGreenSlug}`)}
                    className="px-4 py-2 bg-[#C6A667] text-[#111111] text-xs font-semibold rounded hover:bg-[#d4b67a] transition-colors"
                  >
                    {t('Xem thông số & Yêu cầu mẫu', 'Inspect Spec & Sample')}
                  </Link>
                  <Link
                    to={localePath('/coffee/green-beans')}
                    className="px-4 py-2 border border-white/25 text-white text-xs font-medium rounded hover:bg-white/10 transition-colors"
                  >
                    {t('Mở ma trận 27 mã', 'Full 27-SKU Matrix')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] rounded-xl overflow-hidden border border-white/15">
            <MediaImage
              imageKey="product_green_coffee_beans"
              alt="Natural, Honey, and Washed CBU green coffee sorting trays"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 6. VIETNAMESE COFFEE ORIGIN MAP */}
      <section className="max-w-[1280px] mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Khám phá vùng nguyên liệu cà phê Việt Nam', 'Discover the Origins of Vietnamese Coffee')}
            </p>
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('10 Vùng Trồng Cà Phê Việt Nam — Bản Đồ Vệ Tinh & Địa Hình Thật', '10 Vietnamese Coffee Regions — Real Satellite & Terrain Map')}
            </h2>
          </div>
        </div>
        <VietnamOriginMap compact />
      </section>

      {/* 7 & 8. FROM FARM TO CUP + BREWING EXPERIENCE */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <Compass className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Hành trình Từ Nông Trại Đến Tách Cà Phê', 'From Farm to Cup Journey')}
            </h3>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                '8 giai đoạn khép kín: Canh tác · Thu hái chín · Chế biến Natural / Honey / CBU · Tuyển chọn nhân xanh · Rang chuẩn · Xay · Pha chế · Thưởng thức.',
                'Eight disciplined stages: Cultivation · Selective Harvesting · Natural / Honey / CBU Processing · Green Selection · Roasting · Grinding · Brewing · Enjoying.'
              )}
            </p>
          </div>
          <Link
            to={localePath('/farm-to-cup')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
          >
            <span>{t('Khám phá quy trình 8 bước', 'Explore the 8-Stage Process')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <Flame className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Nghệ thuật Pha Chế Chuẩn Mực', 'Coffee Brewing Guide')}
            </h3>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                'Công thức tham chiếu song ngữ cho Phin Việt Nam (20g · ủ 30s · 4–5 phút), Espresso (18g → 36g · 90–94°C), Pour-over, French Press và Cold Brew.',
                'Interactive bilingual recipes for Vietnamese Phin (20g · 30s bloom · 4–5m), Espresso (18g → 36g · 90–94°C), Pour-over, French Press, and Cold Brew.'
              )}
            </p>
          </div>
          <Link
            to={localePath('/brewing')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
          >
            <span>{t('Mở hướng dẫn pha chế', 'Open Brewing Calculator & Guide')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 9. SIGNATURE RESERVE LUXURY SPOTLIGHT */}
      <section className="bg-[#0B0B0B] text-[#F8F5EF] py-16">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A667]">
              {t('Báo Đen · 60% Robusta · 20% Culi · 20% Arabica', 'Black Panther · 60% Robusta · 20% Culi · 20% Arabica')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance">
              ROAR COFFEE SIGNATURE RESERVE
            </h2>
            <p className="text-sm sm:text-base text-[#F8F5EF]/80 leading-relaxed">
              {t(
                'Tuyệt phẩm sang trọng mang dấu ấn Báo Đen — kết hợp 60% Robusta, 20% Culi và 20% Arabica cùng nguồn nhân xanh CBU chỉ định. Thiết kế hộp quà đen huyền và vàng champagne dành cho thưởng thức tinh tế và quà tặng cấp cao.',
                'Our flagship Black Panther edition combining 60% Robusta, 20% Culi, and 20% Arabica with specified CBU green beans. Finished in deep obsidian and champagne gold for refined rituals and executive gifting.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={localePath('/signature-reserve')}
                className="px-6 py-3 bg-[#C6A667] text-[#111111] text-sm font-semibold rounded hover:bg-[#d4b67a] transition-colors"
              >
                {t('Khám phá Signature Reserve', 'Discover Signature Reserve')}
              </Link>
              <Link
                to={localePath('/product/signature-reserve')}
                className="px-6 py-3 border border-[#C6A667]/40 text-[#C6A667] text-sm font-medium rounded hover:bg-[#C6A667]/10 transition-colors"
              >
                {t('Đặt mua ngay', 'Shop Reserve Edition')}
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 grid grid-cols-5 gap-4 items-center">
            <div className="col-span-3 aspect-[4/3] rounded-xl overflow-hidden border border-[#C6A667]/30">
              <MediaImage
                imageKey="product_signature_reserve"
                alt="ROAR COFFEE Signature Reserve Obsidian & Gold Edition"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2 aspect-square rounded-xl overflow-hidden border border-[#C6A667]/30">
              <MediaImage
                imageKey="mascot_panther"
                alt="Black Panther Crest — Signature Reserve"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 10 & 11. WHOLESALE / DISTRIBUTION + OEM & EXPORT */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-8 space-y-4">
          <PackageCheck className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
          <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Phân phối, Bán sỉ & Giải pháp HORECA', 'Wholesale, Distribution & HORECA')}
          </h3>
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {t(
              'Cung ứng ổn định cho chuỗi cà phê, nhà hàng, khách sạn, siêu thị và nhà phân phối với chính sách giá đối tác, mẫu thử và hỗ trợ kỹ thuật pha chế.',
              'Dedicated partner supply for cafes, hotels, restaurants, retailers, and distributors — featuring tiered partner pricing, sample kits, and barista consultation.'
            )}
          </p>
          <Link to={localePath('/partners')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
            <span>{t('Cổng đối tác B2B', 'Enter B2B Partner Portal')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-8 space-y-4">
          <Globe2 className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
          <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Gia công OEM, Nhãn riêng & Xuất khẩu Quốc tế', 'OEM, Private Label & Global Export')}
          </h3>
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {t(
              'Hỗ trợ tìm nguồn nhân xanh, gia công rang xay, đóng gói nhãn hiệu riêng (Private Label) và tư vấn hồ sơ xuất khẩu theo năng lực xác thực từng dự án.',
              'End-to-end green coffee sourcing, contract roasting, private-label packaging, MOQ planning, and verified export documentation support for international buyers.'
            )}
          </p>
          <Link to={localePath('/oem-export')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
            <span>{t('Gửi yêu cầu OEM / Xuất khẩu', 'Submit OEM & Export Inquiry')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 12 & 13. MEMBER BENEFITS & ACTIVE PROMOTIONS */}
      <section className="bg-white dark:bg-[#131D18] border-y border-[#202020]/10 dark:border-white/10 py-16">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <Award className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Thành viên ROAR COFFEE & Điểm Thưởng', 'ROAR COFFEE Members & Rewards')}
            </h2>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                'Tích điểm trên mỗi đơn hàng hợp lệ (cấu hình tham chiếu 1 điểm / 10.000đ · 1 điểm = 100đ) và thăng hạng qua 4 cấp bậc: Thành viên, Bạc, Vàng và Reserve.',
                'Earn points across eligible purchases under configurable rules and unlock four membership tiers: ROAR Member, ROAR Silver, ROAR Gold, and ROAR Reserve.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link to={localePath('/account')} className="px-5 py-2.5 bg-[#00552B] text-white text-sm font-medium rounded hover:bg-[#003D25]">
                {t('Đăng ký / Đăng nhập', 'Join ROAR Members')}
              </Link>
              <Link to={localePath('/promotions')} className="px-5 py-2.5 border border-[#00552B]/30 dark:border-[#C6A667]/40 text-[#00552B] dark:text-[#C6A667] text-sm font-medium rounded hover:bg-[#00552B]/5">
                {t('Xem tất cả ưu đãi', 'All Active Offers')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-[#F8F5EF] dark:bg-[#1A2820] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#00552B] dark:text-[#C6A667] font-mono">
                    <span className="font-bold">{promo.code}</span>
                    <span className="tabular-nums">{t('Hạn:', 'Valid until')} {promo.end_date}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#202020] dark:text-[#F1EFEA]">
                    {lang === 'vi' ? promo.title_vi : promo.title_en}
                  </h3>
                  <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {lang === 'vi' ? promo.description_vi : promo.description_en}
                  </p>
                </div>
                <Link
                  to={localePath('/shop')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
                >
                  <span>{t('Mua sắm ngay', 'Shop Now')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. COFFEE JOURNAL */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Tạp chí & Tri thức Cà phê', 'Coffee Journal')}
            </p>
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('Góc nhìn chuyên sâu từ ROAR COFFEE', 'Editorial & Origin Science')}
            </h2>
          </div>
          <Link to={localePath('/journal')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
            {t('Đọc tất cả bài viết →', 'View Journal →')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link
              key={a.id}
              to={localePath(`/journal/${a.slug}`)}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
            >
              <div className="aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden">
                <MediaImage
                  imageKey={a.image_key}
                  alt={lang === 'vi' ? a.title_vi : a.title_en}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#202020]/55 dark:text-[#F1EFEA]/55">
                    <span>{localizeJournalCategory(a.category, lang)}</span>
                    <span>·</span>
                    <span>{a.read_minutes} {t('phút đọc', 'min read')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA] leading-snug">
                    {lang === 'vi' ? a.title_vi : a.title_en}
                  </h3>
                  <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2">
                    {lang === 'vi' ? a.excerpt_vi : a.excerpt_en}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] pt-2 inline-block">
                  {t('Đọc bài viết →', 'Read Article →')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
