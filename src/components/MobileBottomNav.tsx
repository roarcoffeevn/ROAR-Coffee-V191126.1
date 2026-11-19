import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Coffee, Home, ShoppingBag, Tag, User } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const { t, localePath, stripLocale } = useI18n();
  const { cartCount, setCartOpen, user } = useStore();
  const location = useLocation();
  const current = stripLocale(location.pathname);

  if (current.startsWith('/admin')) return null;

  const isActive = (path: string) => {
    if (path === '/') return current === '/';
    return current.startsWith(path);
  };

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#16221C]/95 backdrop-blur-md border-t border-[#202020]/10 dark:border-white/10 pb-safe transition-colors"
    >
      <div className="grid grid-cols-5 h-[56px]">
        <Link
          to={localePath('/')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/') ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
          }`}
        >
          <Home className="w-[18px] h-[18px]" />
          <span className="truncate">{t('Trang chủ', 'Home')}</span>
        </Link>

        <Link
          to={localePath('/shop')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/shop') || isActive('/coffee') || isActive('/product')
              ? 'text-[#00552B] dark:text-[#C6A667]'
              : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
          }`}
        >
          <Coffee className="w-[18px] h-[18px]" />
          <span className="truncate">{t('Sản phẩm', 'Shop')}</span>
        </Link>

        <Link
          to={localePath('/promotions')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/promotions') ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
          }`}
        >
          <Tag className="w-[18px] h-[18px]" />
          <span className="truncate">{t('Ưu đãi', 'Offers')}</span>
        </Link>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
            isActive('/cart') || isActive('/checkout') ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-[18px] h-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#00552B] text-white text-[9px] font-semibold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </div>
          <span className="truncate">{t('Giỏ hàng', 'Cart')}</span>
        </button>

        <Link
          to={localePath('/account')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/account') ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
          }`}
        >
          <div className="relative">
            <User className="w-[18px] h-[18px]" />
            {(user?.unreadNotifications ?? 0) > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#C6A667] text-[#111111] text-[9px] font-bold flex items-center justify-center tabular-nums">
                {user!.unreadNotifications}
              </span>
            )}
          </div>
          <span className="truncate">{t('Tài khoản', 'Account')}</span>
        </Link>
      </div>
    </nav>
  );
};
