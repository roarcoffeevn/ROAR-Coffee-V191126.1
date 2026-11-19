import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Compass, Home } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type BreadcrumbNode, useStore } from '../context/StoreContext';

interface QuickLink {
  labelVi: string;
  labelEn: string;
  to: string;
}

function getQuickInterlinks(cleanPath: string): QuickLink[] {
  if (
    cleanPath.startsWith('/shop') ||
    cleanPath.startsWith('/coffee') ||
    cleanPath.startsWith('/product') ||
    cleanPath.startsWith('/cart') ||
    cleanPath.startsWith('/checkout') ||
    cleanPath.startsWith('/promotions')
  ) {
    return [
      { labelVi: 'Rang xay', labelEn: 'Roasted', to: '/coffee/roasted' },
      { labelVi: 'Hạt rang (kg)', labelEn: 'Roasted Beans', to: '/coffee/roasted-beans' },
      { labelVi: 'Hòa tan', labelEn: 'Instant', to: '/coffee/instant' },
      { labelVi: 'Nhân xanh 27 SKU', labelEn: '27-SKU Green', to: '/coffee/green-beans' },
      { labelVi: 'Ưu đãi & Voucher', labelEn: 'Offers', to: '/promotions' },
      { labelVi: 'Pha chế', labelEn: 'Brewing', to: '/brewing' },
    ];
  }

  if (
    cleanPath.startsWith('/partners') ||
    cleanPath.startsWith('/oem-export') ||
    cleanPath.startsWith('/contact')
  ) {
    return [
      { labelVi: 'Hợp tác B2B', labelEn: 'B2B Partners', to: '/partners' },
      { labelVi: 'Ma trận Nhân xanh', labelEn: 'Green Matrix', to: '/coffee/green-beans' },
      { labelVi: 'OEM & Xuất khẩu', labelEn: 'OEM & Export', to: '/oem-export' },
      { labelVi: 'Signature Reserve', labelEn: 'Reserve', to: '/signature-reserve' },
    ];
  }

  if (cleanPath.startsWith('/account') || cleanPath.startsWith('/orders')) {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Ưu đãi Thành viên', labelEn: 'Offers', to: '/promotions' },
      { labelVi: 'Theo dõi đơn', labelEn: 'Track Order', to: '/orders/track' },
      { labelVi: 'Trang trại & Thẻ', labelEn: 'Farm Pass', to: '/farm-membership' },
    ];
  }

  return [
    { labelVi: 'Cửa hàng ROAR', labelEn: 'Shop', to: '/shop' },
    { labelVi: 'Bản đồ vùng trồng', labelEn: 'Origins Map', to: '/origins' },
    { labelVi: '7 Cá tính', labelEn: '7 Characters', to: '/personalities' },
    { labelVi: 'Quy trình 8 bước', labelEn: 'Farm to Cup', to: '/farm-to-cup' },
    { labelVi: 'Tạp chí', labelEn: 'Journal', to: '/journal' },
  ];
}

function getDefaultTrail(cleanPath: string): BreadcrumbNode[] {
  if (cleanPath === '/shop') {
    return [{ labelVi: 'Tất cả sản phẩm', labelEn: 'All Products' }];
  }
  if (cleanPath === '/coffee/roasted') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Cà phê Rang xay', labelEn: 'Roasted Coffee' },
    ];
  }
  if (cleanPath === '/coffee/roasted-beans') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Cà phê Hạt rang', labelEn: 'Roasted Coffee Beans' },
    ];
  }
  if (cleanPath === '/coffee/instant') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Cà phê Hòa tan', labelEn: 'Instant Coffee' },
    ];
  }
  if (cleanPath === '/coffee/green-beans') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Cà phê Nhân xanh B2B (27 SKU)', labelEn: 'Green Coffee Matrix (27 SKUs)' },
    ];
  }
  if (cleanPath.startsWith('/product/')) {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Chi tiết sản phẩm', labelEn: 'Product Detail' },
    ];
  }
  if (cleanPath === '/personalities') {
    return [
      { labelVi: 'Về ROAR COFFEE', labelEn: 'About ROAR', to: '/about' },
      { labelVi: '7 Cá Tính Thương Hiệu', labelEn: 'Seven Personalities' },
    ];
  }
  if (cleanPath.startsWith('/personalities/')) {
    return [
      { labelVi: '7 Cá Tính Thương Hiệu', labelEn: 'Seven Personalities', to: '/personalities' },
      { labelVi: 'Hồ sơ Cá tính', labelEn: 'Character Profile' },
    ];
  }
  if (cleanPath === '/origins') {
    return [
      { labelVi: 'Từ Nông Trại Đến Tách Cà Phê', labelEn: 'Farm to Cup', to: '/farm-to-cup' },
      { labelVi: 'Bản đồ Vùng Nguyên Liệu Việt Nam', labelEn: 'Vietnam Coffee Origins Map' },
    ];
  }
  if (cleanPath === '/farm-to-cup') {
    return [
      { labelVi: 'Vùng Nguyên Liệu', labelEn: 'Coffee Origins', to: '/origins' },
      { labelVi: 'Hành trình 8 Bước Từ Nông Trại Đến Ly', labelEn: 'From Farm to Cup (8 Stages)' },
    ];
  }
  if (cleanPath === '/brewing') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Hướng dẫn Pha chế Chuẩn mực', labelEn: 'Coffee Brewing Guide' },
    ];
  }
  if (cleanPath === '/about') {
    return [{ labelVi: 'Về ROAR COFFEE', labelEn: 'About ROAR COFFEE' }];
  }
  if (cleanPath === '/signature-reserve') {
    return [
      { labelVi: 'Cà phê Rang xay', labelEn: 'Roasted Coffee', to: '/coffee/roasted' },
      { labelVi: 'ROAR Signature Reserve (Báo Đen)', labelEn: 'ROAR Signature Reserve' },
    ];
  }
  if (cleanPath === '/farm-membership') {
    return [
      { labelVi: 'Thành viên ROAR', labelEn: 'ROAR Members', to: '/account' },
      { labelVi: 'Trang trại ROAR & Đặc quyền', labelEn: 'ROAR Farm & Membership' },
    ];
  }
  if (cleanPath === '/promotions') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Khuyến mãi & Mã ưu đãi', labelEn: 'Promotions & Vouchers' },
    ];
  }
  if (cleanPath === '/journal') {
    return [{ labelVi: 'Tạp chí Cà phê ROAR', labelEn: 'ROAR Coffee Journal' }];
  }
  if (cleanPath.startsWith('/journal/')) {
    return [
      { labelVi: 'Tạp chí Cà phê', labelEn: 'Coffee Journal', to: '/journal' },
      { labelVi: 'Bài viết chuyên sâu', labelEn: 'Article' },
    ];
  }
  if (cleanPath === '/partners') {
    return [{ labelVi: 'Cổng Đối tác B2B & Phân phối', labelEn: 'B2B Wholesale & Partners' }];
  }
  if (cleanPath === '/oem-export') {
    return [
      { labelVi: 'Đối tác B2B', labelEn: 'B2B Partners', to: '/partners' },
      { labelVi: 'Gia công OEM, Nhãn riêng & Xuất khẩu', labelEn: 'OEM, Private Label & Export' },
    ];
  }
  if (cleanPath === '/contact') {
    return [
      { labelVi: 'Đối tác B2B', labelEn: 'B2B Partners', to: '/partners' },
      { labelVi: 'Liên hệ & Kết nối', labelEn: 'Contact Us' },
    ];
  }
  if (cleanPath === '/cart') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Giỏ hàng', labelEn: 'Shopping Cart' },
    ];
  }
  if (cleanPath === '/checkout') {
    return [
      { labelVi: 'Cửa hàng', labelEn: 'Shop', to: '/shop' },
      { labelVi: 'Giỏ hàng', labelEn: 'Cart', to: '/cart' },
      { labelVi: 'Thanh toán đơn hàng', labelEn: 'Checkout' },
    ];
  }
  if (cleanPath === '/orders/track') {
    return [
      { labelVi: 'Tài khoản thành viên', labelEn: 'Member Account', to: '/account' },
      { labelVi: 'Tra cứu & Theo dõi đơn hàng', labelEn: 'Track Order' },
    ];
  }
  if (cleanPath === '/account') {
    return [{ labelVi: 'Tài khoản Thành viên & Điểm thưởng', labelEn: 'Member Account & Rewards' }];
  }
  if (cleanPath === '/privacy') {
    return [{ labelVi: 'Chính sách Bảo mật', labelEn: 'Privacy Policy' }];
  }
  if (cleanPath === '/terms') {
    return [{ labelVi: 'Điều khoản Sử dụng', labelEn: 'Terms & Conditions' }];
  }
  if (cleanPath === '/shipping') {
    return [{ labelVi: 'Chính sách Vận chuyển & Đổi trả', labelEn: 'Shipping & Returns Policy' }];
  }

  return [];
}

export const Breadcrumb: React.FC = () => {
  const { pathname } = useLocation();
  const { t, localePath, stripLocale } = useI18n();
  const { customBreadcrumb } = useStore();

  const cleanPath = stripLocale(pathname);

  if (cleanPath === '/' || cleanPath.startsWith('/admin')) {
    return null;
  }

  const trail = customBreadcrumb && customBreadcrumb.length > 0 ? customBreadcrumb : getDefaultTrail(cleanPath);
  if (trail.length === 0) {
    return null;
  }

  const isPantherTheme = cleanPath === '/personalities/black-panther';
  const quickLinks = getQuickInterlinks(cleanPath).filter((ql) => ql.to !== cleanPath);
  const backNode = trail.length > 1 ? trail[trail.length - 2] : { labelVi: 'Trang chủ', labelEn: 'Home', to: '/' };

  return (
    <div
      className={
        isPantherTheme
          ? 'bg-[#121212] text-[#F8F5EF] border-b border-white/10 transition-colors'
          : 'bg-white/80 dark:bg-[#131E18]/90 text-[#202020] dark:text-[#F1EFEA] border-b border-[#202020]/10 dark:border-white/10 transition-colors'
      }
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {backNode.to && (
            <Link
              to={localePath(backNode.to)}
              title={t(`Quay lại ${backNode.labelVi}`, `Back to ${backNode.labelEn}`)}
              className={`sm:hidden inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border shrink-0 ${
                isPantherTheme
                  ? 'border-[#C6A667]/40 text-[#C6A667]'
                  : 'border-[#202020]/15 dark:border-white/15 text-[#00552B] dark:text-[#C6A667]'
              }`}
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{t('Quay lại', 'Back')}</span>
            </Link>
          )}

          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs">
              <li className="inline-flex items-center">
                <Link
                  to={localePath('/')}
                  className={`inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isPantherTheme
                      ? 'text-[#F8F5EF]/70 hover:text-[#C6A667]'
                      : 'text-[#202020]/65 dark:text-[#F1EFEA]/65 hover:text-[#00552B] dark:hover:text-[#C6A667]'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('Trang chủ', 'Home')}</span>
                </Link>
              </li>

              {trail.map((node, index) => {
                const isLast = index === trail.length - 1;
                const label = t(node.labelVi, node.labelEn);
                return (
                  <li key={`${label}-${index}`} className="inline-flex items-center gap-1 sm:gap-1.5 min-w-0">
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isPantherTheme ? 'text-white/35' : 'text-[#202020]/35 dark:text-[#F1EFEA]/35'
                      }`}
                    />
                    {!isLast && node.to ? (
                      <Link
                        to={localePath(node.to)}
                        className={`transition-colors truncate max-w-[160px] sm:max-w-[220px] ${
                          isPantherTheme
                            ? 'text-[#F8F5EF]/75 hover:text-[#C6A667]'
                            : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#00552B] dark:hover:text-[#C6A667]'
                        }`}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span
                        aria-current="page"
                        className={`font-semibold truncate max-w-[190px] sm:max-w-[340px] ${
                          isPantherTheme ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                        }`}
                      >
                        {label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Web Interlinks for quick cross-navigation */}
        {quickLinks.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 text-[11px] shrink-0">
            <span
              className={`inline-flex items-center gap-1 uppercase tracking-wider font-semibold ${
                isPantherTheme ? 'text-white/45' : 'text-[#202020]/45 dark:text-[#F1EFEA]/45'
              }`}
            >
              <Compass className="w-3 h-3" />
              {t('Liên kết nhanh:', 'Quick Links:')}
            </span>
            <div className="flex items-center gap-2.5">
              {quickLinks.slice(0, 4).map((ql, idx) => (
                <React.Fragment key={ql.to}>
                  {idx > 0 && (
                    <span className={isPantherTheme ? 'text-white/20' : 'text-[#202020]/20 dark:text-white/20'}>·</span>
                  )}
                  <Link
                    to={localePath(ql.to)}
                    className={`transition-colors whitespace-nowrap hover:underline ${
                      isPantherTheme
                        ? 'text-[#F8F5EF]/75 hover:text-[#C6A667]'
                        : 'text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#00552B] dark:hover:text-[#C6A667]'
                    }`}
                  >
                    {t(ql.labelVi, ql.labelEn)}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
