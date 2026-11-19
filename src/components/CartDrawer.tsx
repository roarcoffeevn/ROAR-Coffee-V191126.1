import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { MediaImage } from './MediaImage';
import { localizeVariantLabel } from '../lib/i18nHelpers';

export const CartDrawer: React.FC = () => {
  const { t, lang, localePath } = useI18n();
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    cartSubtotalVnd,
    formatPrice,
    currency,
    setCurrency,
  } = useStore();

  if (!cartOpen) return null;

  const freeShipRemaining = Math.max(0, 500000 - cartSubtotalVnd);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/55" onClick={() => setCartOpen(false)} />
      <aside
        aria-label={t('Giỏ hàng', 'Shopping Cart')}
        className="relative w-full max-w-md bg-[#F8F5EF] dark:bg-[#0E1512] h-full flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#16221C] border-b border-[#202020]/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
            <h2 className="text-lg font-semibold text-[#202020] dark:text-[#F1EFEA]">
              {t('Giỏ hàng của bạn', 'Your Cart')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrency(currency === 'VND' ? 'USD' : 'VND')}
              className="px-2 py-1 text-xs font-mono border border-[#202020]/15 dark:border-white/15 rounded text-[#202020] dark:text-[#F1EFEA] cursor-pointer"
            >
              {currency}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close cart"
              className="p-1.5 text-[#202020]/60 dark:text-[#F1EFEA]/60 hover:text-[#202020] dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-2.5 bg-[#00552B]/5 dark:bg-[#00552B]/25 border-b border-[#00552B]/10 dark:border-white/10 text-xs text-[#003D25] dark:text-[#C6A667]">
          {freeShipRemaining > 0
            ? t(
                `Mua thêm ${formatPrice(freeShipRemaining)} để được miễn phí vận chuyển tiêu chuẩn (từ 500.000đ).`,
                `Add ${formatPrice(freeShipRemaining)} more for complimentary standard domestic shipping.`
              )
            : t(
                'Đơn hàng đủ điều kiện miễn phí vận chuyển tiêu chuẩn toàn quốc.',
                'Your order qualifies for complimentary standard domestic shipping.'
              )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#202020]/25 dark:text-[#F1EFEA]/25" />
              <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t('Giỏ hàng của bạn đang trống.', 'Your shopping bag is currently empty.')}
              </p>
              <Link
                to={localePath('/shop')}
                onClick={() => setCartOpen(false)}
                className="inline-block px-5 py-2.5 bg-[#00552B] text-white text-sm font-medium rounded hover:bg-[#003D25] transition-colors"
              >
                {t('Khám phá Cà phê ROAR', 'Explore ROAR Coffee')}
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantLabel}`}
                className="flex gap-4 bg-white dark:bg-[#16221C] p-3.5 rounded-lg border border-[#202020]/8 dark:border-white/10"
              >
                <div className="w-16 aspect-[4/5] rounded overflow-hidden shrink-0 bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage
                    imageKey={item.imageKey}
                    alt={lang === 'vi' ? item.nameVi : item.nameEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={localePath(`/product/${item.slug}`)}
                      onClick={() => setCartOpen(false)}
                      className="text-sm font-semibold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] truncate"
                    >
                      {lang === 'vi' ? item.nameVi : item.nameEn}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantLabel)}
                      aria-label={t('Xóa sản phẩm', 'Remove item')}
                      className="text-[#202020]/40 dark:text-[#F1EFEA]/40 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 mt-0.5">
                    {item.sku} · {localizeVariantLabel(item.variantLabel, lang)}
                  </p>
                  {(item.unit === 'kg' || (item.pricingTiers?.length || 0) > 0) && (
                    <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] mt-0.5 tabular-nums">
                      {formatPrice(item.unitPriceVnd, item.unitPriceUsd)}/kg × {item.quantity} kg
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#202020]/15 dark:border-white/15 rounded">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      {item.unit === 'kg' || (item.pricingTiers?.length || 0) > 0 ? (
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.floor(Number(e.target.value) || 0);
                            if (val >= 1) updateCartQty(item.productId, item.variantLabel, val);
                          }}
                          className="w-12 text-center text-xs font-medium bg-transparent focus:outline-none tabular-nums"
                        />
                      ) : (
                        <span className="px-2.5 text-xs font-medium tabular-nums">{item.quantity}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                      {formatPrice(item.unitPriceVnd * item.quantity, item.unitPriceUsd * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-white dark:bg-[#16221C] border-t border-[#202020]/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Tạm tính', 'Subtotal')}</span>
              <span className="text-lg font-semibold text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                {formatPrice(cartSubtotalVnd)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to={localePath('/cart')}
                onClick={() => setCartOpen(false)}
                className="text-center py-2.5 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] rounded text-sm font-medium hover:bg-[#00552B]/5 transition-colors"
              >
                {t('Xem giỏ hàng', 'View Cart')}
              </Link>
              <Link
                to={localePath('/checkout')}
                onClick={() => setCartOpen(false)}
                className="text-center py-2.5 bg-[#00552B] text-white rounded text-sm font-medium hover:bg-[#003D25] transition-colors"
              >
                {t('Thanh toán', 'Checkout')}
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
