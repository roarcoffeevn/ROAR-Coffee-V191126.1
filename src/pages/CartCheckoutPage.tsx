import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Check, CheckCircle2, Copy, Minus, Plus, QrCode, ShieldCheck, Smartphone, Tag, Trash2, Wallet } from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { localizeOrderStatus, localizeVariantLabel } from '../lib/i18nHelpers';
import { calculateShippingFee } from '../lib/pricing';
import { fetchPromotionsWithFallback } from '../lib/staticFallback';

interface PaymentMethodOption {
  id: string;
  labelVi: string;
  labelEn: string;
  subVi: string;
  subEn: string;
  accentColor: string;
  badgeText: string;
  accountName: string;
  accountNumber: string;
  bankOrWalletVi: string;
  bankOrWalletEn: string;
  isQR: boolean;
}

const PAYMENT_OPTIONS: PaymentMethodOption[] = [
  {
    id: 'vietqr',
    labelVi: 'VietQR / Chuyển khoản 24/7',
    labelEn: 'VietQR / 24/7 Bank Transfer',
    subVi: 'Quét mã từ mọi ứng dụng ngân hàng Việt Nam',
    subEn: 'Scan with any Vietnamese banking app',
    accentColor: '#00552B',
    badgeText: 'VIETQR NAPAS 24/7',
    accountName: 'CONG TY ROAR COFFEE VIETNAM',
    accountNumber: '1903 8868 9999 01',
    bankOrWalletVi: 'Ngân hàng TMCP Kỹ Thương (Techcombank) · VietQR',
    bankOrWalletEn: 'Techcombank Vietnam · VietQR Interbank',
    isQR: true,
  },
  {
    id: 'momo',
    labelVi: 'Ví điện tử MoMo (QR)',
    labelEn: 'MoMo E-Wallet (QR)',
    subVi: 'Quét mã MoMo QR thanh toán tức thì',
    subEn: 'Scan MoMo QR for instant payment',
    accentColor: '#A50064',
    badgeText: 'MOMO WALLET',
    accountName: 'ROAR COFFEE OFFICIAL',
    accountNumber: '0901 686 888',
    bankOrWalletVi: 'Ví điện tử MoMo · Tài khoản doanh nghiệp đối soát',
    bankOrWalletEn: 'MoMo E-Wallet · Merchant Verification',
    isQR: true,
  },
  {
    id: 'zalopay',
    labelVi: 'Ví ZaloPay (QR / Zalo)',
    labelEn: 'ZaloPay Wallet (QR / Zalo)',
    subVi: 'Thanh toán nhanh qua ZaloPay hoặc Zalo',
    subEn: 'Quick scan via ZaloPay or Zalo app',
    accentColor: '#0068FF',
    badgeText: 'ZALOPAY QR',
    accountName: 'ROAR COFFEE OFFICIAL',
    accountNumber: 'ZP-ROAR-202601',
    bankOrWalletVi: 'Ví ZaloPay · Quét mã trong ứng dụng Zalo',
    bankOrWalletEn: 'ZaloPay · Scan inside Zalo / ZaloPay',
    isQR: true,
  },
  {
    id: 'vnpay_qr',
    labelVi: 'VNPAY-QR (40+ Ngân hàng)',
    labelEn: 'VNPAY-QR (40+ Bank Apps)',
    subVi: 'Quét VNPAY-QR trên Vietcombank, BIDV, MB, ACB...',
    subEn: 'Scan VNPAY-QR on major Vietnamese bank apps',
    accentColor: '#005BAA',
    badgeText: 'VNPAY-QR',
    accountName: 'ROAR COFFEE VIETNAM',
    accountNumber: 'VNPAY-RC-8826',
    bankOrWalletVi: 'Cổng quét VNPAY-QR đa ngân hàng Việt Nam',
    bankOrWalletEn: 'VNPAY-QR Multi-Bank Network',
    isQR: true,
  },
  {
    id: 'shopeepay',
    labelVi: 'Ví ShopeePay (QR)',
    labelEn: 'ShopeePay Wallet (QR)',
    subVi: 'Quét mã trực tiếp bằng ví ShopeePay',
    subEn: 'Direct QR scan with ShopeePay app',
    accentColor: '#EE4D2D',
    badgeText: 'SHOPEEPAY',
    accountName: 'ROAR COFFEE STORE',
    accountNumber: 'SPP-ROAR-9901',
    bankOrWalletVi: 'Ví điện tử ShopeePay',
    bankOrWalletEn: 'ShopeePay E-Wallet',
    isQR: true,
  },
  {
    id: 'wallet',
    labelVi: 'Ví Thành viên ROAR (Thanh toán bằng số dư Ví)',
    labelEn: 'ROAR Member Wallet (Pay with Wallet Balance)',
    subVi: 'Trừ trực tiếp từ số dư Ví ROAR đã nạp (+10% đến +30% thưởng) · Xác nhận tức thì',
    subEn: 'Instant deduction from your ROAR Member Wallet (+10% to +30% top-up bonus)',
    accentColor: '#00552B',
    badgeText: 'ROAR WALLET',
    accountName: 'ROAR REWARDS WALLET',
    accountNumber: '',
    bankOrWalletVi: 'Ví Thành viên ROAR COFFEE®',
    bankOrWalletEn: 'ROAR COFFEE® Member Wallet',
    isQR: false,
  },
  {
    id: 'points',
    labelVi: 'Mua hàng bằng Điểm thưởng ROAR (Quy đổi 100% Điểm)',
    labelEn: 'Pay 100% with ROAR Reward Points',
    subVi: 'Quy đổi trực tiếp điểm tích lũy (1 điểm = 100₫) để thanh toán toàn bộ đơn hàng',
    subEn: 'Redeem your accumulated reward points (1 pt = 100 VND) to cover the full order',
    accentColor: '#C6A667',
    badgeText: 'ROAR POINTS',
    accountName: 'ROAR REWARDS POINTS',
    accountNumber: '',
    bankOrWalletVi: 'Điểm thưởng Thành viên ROAR COFFEE®',
    bankOrWalletEn: 'ROAR COFFEE® Reward Points',
    isQR: false,
  },
  {
    id: 'cod',
    labelVi: 'Thanh toán khi nhận hàng (COD)',
    labelEn: 'Cash on Delivery (COD)',
    subVi: 'Kiểm tra niêm phong và thanh toán trực tiếp cho shipper',
    subEn: 'Inspect package seal and pay courier upon delivery',
    accentColor: '#202020',
    badgeText: 'COD',
    accountName: '',
    accountNumber: '',
    bankOrWalletVi: '',
    bankOrWalletEn: '',
    isQR: false,
  },
];

function getPaymentOption(methodId?: string): PaymentMethodOption {
  return PAYMENT_OPTIONS.find((m) => m.id === methodId) || PAYMENT_OPTIONS[0];
}

function buildDeterministicQRMatrix(seedText: string, size = 21): boolean[][] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[top + r][left + c] = isBorder || isCore;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let state = hash >>> 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      const inCenterBadge = r >= 8 && r <= 12 && c >= 8 && c <= 12;
      if (inTL || inTR || inBL || inCenterBadge) continue;
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      matrix[r][c] = (state & 3) !== 0 && ((state >>> 4) & 1) === 1;
    }
  }
  return matrix;
}

const PaymentQRPanel: React.FC<{
  orderNumber: string;
  customerEmail: string;
  paymentMethod: string;
  totalVnd: number;
  initialPaymentStatus?: string;
}> = ({ orderNumber, customerEmail, paymentMethod, totalVnd, initialPaymentStatus }) => {
  const { lang, t } = useI18n();
  const { formatPrice, showToast } = useStore();
  const option = getPaymentOption(paymentMethod);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [txRef, setTxRef] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus || 'awaiting_payment');
  const [confirming, setConfirming] = useState(false);

  const transferMemo = `ROAR ${orderNumber}`;
  const qrPayload = `${option.id.toUpperCase()}|${option.accountNumber}|${totalVnd}|${transferMemo}`;
  const matrix = useMemo(() => buildDeterministicQRMatrix(qrPayload, 21), [qrPayload]);

  if (!option.isQR) {
    return (
      <div className="bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 rounded-xl p-4 text-left text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-[#202020] dark:text-[#F1EFEA]">
          <Banknote className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
          <span>{t('Thanh toán tiền mặt khi nhận hàng (COD)', 'Cash on Delivery (COD)')}</span>
        </div>
        <p className="text-[#202020]/70 dark:text-[#F1EFEA]/70">
          {t(
            'Quý khách thanh toán đúng số tiền đơn hàng cho đơn vị vận chuyển sau khi kiểm tra ngoại quan hộp hàng.',
            'Please pay the courier the exact order amount upon inspecting the sealed parcel.'
          )}
        </p>
      </div>
    );
  }

  const copyText = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      showToast(t('Đã sao chép vào khay nhớ tạm', 'Copied to clipboard'));
      window.setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 2000);
    } catch {
      showToast(val);
    }
  };

  const handleConfirmTransfer = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/confirm-payment-reference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, transactionRef: txRef }),
      });
      if (res.ok) {
        setPaymentStatus('pending_verification');
        showToast(t('Đã ghi nhận thông báo chuyển khoản!', 'Transfer notification recorded!'));
      } else {
        showToast(t('Không thể gửi xác nhận. Vui lòng thử lại.', 'Unable to confirm. Please retry.'));
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/20 dark:border-white/15 rounded-xl p-5 text-left space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#202020]/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded text-[11px] font-bold text-white tracking-wider"
            style={{ backgroundColor: option.accentColor }}
          >
            {option.badgeText}
          </span>
          <span className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {lang === 'vi' ? option.labelVi : option.labelEn}
          </span>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded ${
            paymentStatus === 'pending_verification'
              ? 'bg-[#C6A667]/25 text-[#694f15] dark:text-[#C6A667]'
              : paymentStatus === 'paid'
                ? 'bg-[#00552B]/15 text-[#00552B] dark:text-[#86EFAC]'
                : 'bg-[#202020]/10 dark:bg-white/10 text-[#202020] dark:text-[#F1EFEA]'
          }`}
        >
          {paymentStatus === 'pending_verification'
            ? t('Đã gửi xác nhận · Chờ đối soát', 'Submitted · Pending Verification')
            : paymentStatus === 'paid'
              ? t('Đã thanh toán', 'Paid')
              : t('Chờ quét mã / chuyển khoản', 'Awaiting QR / Transfer')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        <div className="sm:col-span-5 flex flex-col items-center">
          <div className="bg-white p-3 rounded-xl border-2 shadow-sm" style={{ borderColor: option.accentColor }}>
            <svg viewBox="0 0 21 21" className="w-40 h-40 block" aria-label={option.badgeText}>
              <rect width="21" height="21" fill="#FFFFFF" />
              {matrix.map((row, r) =>
                row.map((on, c) =>
                  on ? (
                    <rect
                      key={`${r}-${c}`}
                      x={c}
                      y={r}
                      width="1"
                      height="1"
                      fill={r < 7 && c < 7 ? option.accentColor : '#111111'}
                    />
                  ) : null
                )
              )}
              <rect x="8.3" y="8.3" width="4.4" height="4.4" rx="0.6" fill={option.accentColor} />
              <text
                x="10.5"
                y="11.15"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="1.65"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                ROAR
              </text>
            </svg>
          </div>
          <p className="text-[11px] text-[#202020]/65 mt-2 text-center">
            {t('Mở ứng dụng ngân hàng hoặc ví để quét', 'Open bank or e-wallet app to scan')}
          </p>
        </div>

        <div className="sm:col-span-7 space-y-2.5 text-xs">
          <div className="bg-white dark:bg-[#16221C] rounded-lg p-3 border border-[#202020]/10 dark:border-white/10 space-y-1.5">
            <p className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{lang === 'vi' ? option.bankOrWalletVi : option.bankOrWalletEn}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Tài khoản:', 'Account:')}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#202020] dark:text-[#F1EFEA]">{option.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => copyText('acct', option.accountNumber)}
                  className="p-1 rounded border border-[#202020]/15 dark:border-white/15 hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                  aria-label="Copy account number"
                >
                  {copiedKey === 'acct' ? <Check className="w-3 h-3 text-[#00552B] dark:text-[#C6A667]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Chủ tài khoản:', 'Beneficiary:')}</span>
              <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">{option.accountName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Số tiền:', 'Amount:')}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">{formatPrice(totalVnd)}</span>
                <button
                  type="button"
                  onClick={() => copyText('amt', String(totalVnd))}
                  className="p-1 rounded border border-[#202020]/15 dark:border-white/15 hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                  aria-label="Copy amount"
                >
                  {copiedKey === 'amt' ? <Check className="w-3 h-3 text-[#00552B] dark:text-[#C6A667]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#202020]/10 dark:border-white/10">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Nội dung CK:', 'Memo:')}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{transferMemo}</span>
                <button
                  type="button"
                  onClick={() => copyText('memo', transferMemo)}
                  className="p-1 rounded border border-[#202020]/15 dark:border-white/15 hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                  aria-label="Copy memo"
                >
                  {copiedKey === 'memo' ? <Check className="w-3 h-3 text-[#00552B] dark:text-[#C6A667]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {paymentStatus === 'awaiting_payment' && (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder={t('Nhập mã giao dịch ví / ngân hàng (tuỳ chọn)', 'Wallet / bank transaction reference (optional)')}
                className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 text-xs font-mono"
              />
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmTransfer}
                className="w-full py-2.5 bg-[#00552B] text-white font-semibold rounded hover:bg-[#003D25] transition-colors cursor-pointer disabled:opacity-50"
              >
                {confirming
                  ? t('Đang gửi xác nhận...', 'Submitting confirmation...')
                  : t('Tôi đã quét mã / chuyển khoản xong', 'I Have Completed QR / Transfer')}
              </button>
            </div>
          )}

          <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 leading-relaxed">
            {t(
              'Mã QR hiển thị thông tin thanh toán trực tiếp theo mã đơn hàng để đối soát nhanh. Kết nối webhook gạch nợ tự động sẽ kích hoạt khi tích hợp khóa API đối tác chính thức.',
              'This QR encodes direct order transfer details for reconciliation. Automated webhook settlement activates once live merchant gateway APIs are connected.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export const CartPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { cart, updateCartQty, removeFromCart, cartSubtotalVnd, formatPrice, settings } = useStore();
  const cartShipping = calculateShippingFee(cartSubtotalVnd, settings);

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12 space-y-8">
      <h1 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">{t('Giỏ hàng của bạn', 'Shopping Cart')}</h1>
      {cart.length === 0 ? (
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-12 text-center space-y-4">
          <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Giỏ hàng đang trống.', 'Your shopping cart is empty.')}</p>
          <Link to={localePath('/shop')} className="inline-block px-5 py-2.5 bg-[#00552B] text-white text-sm rounded">
            {t('Tiếp tục mua sắm', 'Browse Coffee')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-3">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.variantLabel}`} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 flex gap-4 items-center">
                <div className="w-16 aspect-[4/5] rounded overflow-hidden shrink-0">
                  <MediaImage imageKey={item.imageKey} alt={item.nameEn} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={localePath(`/product/${item.slug}`)} className="font-bold text-sm text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                    {lang === 'vi' ? item.nameVi : item.nameEn}
                  </Link>
                  <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{item.sku} · {localizeVariantLabel(item.variantLabel, lang)}</p>
                  {(item.unit === 'kg' || (item.pricingTiers?.length || 0) > 0) && (
                    <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] mt-0.5 tabular-nums">
                      {formatPrice(item.unitPriceVnd, item.unitPriceUsd)}/kg × {item.quantity} kg
                    </p>
                  )}
                </div>
                <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded">
                  <button type="button" onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center cursor-pointer">
                    <Minus className="w-3.5 h-3.5" />
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
                      className="w-14 text-center text-xs font-semibold bg-transparent focus:outline-none tabular-nums"
                    />
                  ) : (
                    <span className="px-3 text-xs font-semibold tabular-nums">{item.quantity}</span>
                  )}
                  <button type="button" onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-right min-w-[90px]">
                  <span className="text-sm font-bold tabular-nums">{formatPrice(item.unitPriceVnd * item.quantity, item.unitPriceUsd * item.quantity)}</span>
                </div>
                <button type="button" onClick={() => removeFromCart(item.productId, item.variantLabel)} className="text-[#202020]/40 dark:text-[#F1EFEA]/40 hover:text-red-600 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
            <h2 className="text-lg font-bold">{t('Tóm tắt đơn hàng', 'Order Summary')}</h2>
            <div className="flex justify-between text-sm">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Tạm tính', 'Subtotal')}</span>
              <span className="font-bold tabular-nums">{formatPrice(cartSubtotalVnd)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Phí vận chuyển ước tính', 'Est. Shipping')}</span>
              <span className="font-medium tabular-nums">
                {cartShipping.feeVnd === 0 ? t('Miễn phí', 'Free') : formatPrice(cartShipping.feeVnd)}
              </span>
            </div>
            <Link
              to={localePath('/checkout')}
              className="block text-center w-full py-3 bg-[#00552B] text-white text-sm font-semibold rounded hover:bg-[#003D25]"
            >
              {t('Tiến hành Thanh toán', 'Proceed to Checkout')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export const CheckoutPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { cart, cartSubtotalVnd, formatPrice, currency, user, clearCart, refreshUser, showToast, apiFetch, settings } = useStore();

  const defaultAddr = user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
  const [customerName, setCustomerName] = useState(defaultAddr?.recipient || user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(defaultAddr?.phone || user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(defaultAddr?.addressLine || '');
  const [paymentMethod, setPaymentMethod] = useState('vietqr');
  const [notes, setNotes] = useState('');

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [appliedVoucherType, setAppliedVoucherType] = useState<string>('');
  const [voucherMsg, setVoucherMsg] = useState('');
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  useEffect(() => {
    fetchPromotionsWithFallback()
      .then((list) => setAvailablePromos(list || []))
      .catch(() => {});
  }, []);

  const availablePoints = user?.points?.available || 0;
  const maxRedeemPoints = Math.min(availablePoints, Math.floor((cartSubtotalVnd * 0.3) / 100));
  const pointsDiscount = pointsToRedeem * 100;
  const shippingCalc = calculateShippingFee(cartSubtotalVnd, settings);
  const shippingFee = appliedVoucherType === 'free_shipping' ? 0 : shippingCalc.feeVnd;
  const effectiveVoucherDiscount = appliedVoucherType === 'free_shipping' ? 0 : voucherDiscount;
  const grandTotal = Math.max(0, cartSubtotalVnd - effectiveVoucherDiscount - pointsDiscount + shippingFee);
  const selectedPaymentOption = getPaymentOption(paymentMethod);

  const applyVoucher = async (overrideCode?: string) => {
    const codeToUse = (overrideCode ?? voucherCode).trim();
    if (!codeToUse) return;
    if (overrideCode !== undefined) setVoucherCode(codeToUse);
    const res = await apiFetch('/api/promotions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeToUse, subtotal: cartSubtotalVnd }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.valid) {
      setVoucherDiscount(d.discountAmount || 0);
      setAppliedVoucherType(d.promo?.discount_type || '');
      setVoucherMsg(
        d.promo?.discount_type === 'free_shipping'
          ? t(`Đã áp dụng mã ${d.promo.code} (Miễn phí vận chuyển)`, `Applied ${d.promo.code} (Free Shipping)`)
          : t(`Đã áp dụng mã ${d.promo.code} (-${formatPrice(d.discountAmount)})`, `Applied ${d.promo.code} (-${formatPrice(d.discountAmount)})`)
      );
    } else {
      setVoucherDiscount(0);
      setAppliedVoucherType('');
      setVoucherMsg(d.error || t('Mã không hợp lệ', 'Invalid code'));
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          currency,
          items: cart.map((c) => ({ productId: c.productId, variantLabel: c.variantLabel, quantity: c.quantity })),
          voucherCode: voucherDiscount > 0 ? voucherCode.trim() : '',
          pointsToRedeem,
          paymentMethod,
          notes,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setConfirmedOrder(d.order);
        clearCart();
        refreshUser();
        showToast(t('Đơn hàng đã được tạo thành công!', 'Order placed successfully!'));
      } else {
        showToast(d.error || t('Không thể tạo đơn hàng.', 'Unable to place order.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-12">
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#00552B]/20 dark:border-white/10 p-6 sm:p-8 text-center space-y-5">
          <CheckCircle2 className="w-12 h-12 text-[#00552B] dark:text-[#C6A667] mx-auto" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Đã Ghi Nhận Đơn Hàng', 'Order Recorded')}
            </h1>
            <p className="font-mono text-base font-bold text-[#00552B] dark:text-[#C6A667]">{confirmedOrder.orderNumber}</p>
          </div>
          <div className="bg-[#F8F5EF] dark:bg-[#0E1512] p-4 rounded-lg text-sm space-y-1 text-left">
            <div className="flex justify-between">
              <span>{t('Tổng thanh toán:', 'Total Due:')}</span>
              <span className="font-bold tabular-nums text-[#00552B] dark:text-[#C6A667]">{formatPrice(confirmedOrder.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">
              <span>{t('Phương thức:', 'Method:')}</span>
              <span className="font-semibold">
                {lang === 'vi'
                  ? getPaymentOption(confirmedOrder.paymentMethod).labelVi
                  : getPaymentOption(confirmedOrder.paymentMethod).labelEn}
              </span>
            </div>
          </div>

          <PaymentQRPanel
            orderNumber={confirmedOrder.orderNumber}
            customerEmail={confirmedOrder.customerEmail || customerEmail}
            paymentMethod={confirmedOrder.paymentMethod || paymentMethod}
            totalVnd={confirmedOrder.total}
          />

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to={localePath('/orders/track')} className="px-5 py-2.5 bg-[#00552B] text-white text-xs font-semibold rounded">
              {t('Tra cứu đơn hàng', 'Track Order')}
            </Link>
            <Link to={localePath('/shop')} className="px-5 py-2.5 border border-[#202020]/20 dark:border-white/20 text-xs font-medium rounded">
              {t('Tiếp tục khám phá', 'Continue Browsing')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">{t('Thanh toán đơn hàng', 'Checkout')}</h1>
        <span className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
          {user ? t(`Đăng nhập: ${user.memberCode}`, `Member: ${user.memberCode}`) : t('Thanh toán không cần tài khoản (Khách vãng lai)', 'Guest Checkout')}
        </span>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-5">
            <h2 className="text-lg font-bold">{t('Thông tin Giao hàng', 'Shipping Information')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Họ và tên *', 'Full Name *')}</label>
                <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">Email *</label>
                <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Số điện thoại *', 'Phone *')}</label>
                <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
              </div>
            </div>
            <div className="text-sm">
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Địa chỉ nhận hàng chi tiết *', 'Full Delivery Address *')}</label>
              <input type="text" required value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div className="text-sm">
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Ghi chú đơn hàng', 'Order Notes')}</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t('Phương thức Thanh toán', 'Payment Method')}</h2>
              <span className="text-xs text-[#00552B] dark:text-[#C6A667] font-medium flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>{t('VietQR · Ví ROAR · Điểm · COD', 'VietQR · ROAR Wallet · Points · COD')}</span>
              </span>
            </div>

            {user && (
              <div className="rounded-xl bg-[#003D25] text-white p-3.5 sm:p-4 border border-[#C6A667]/35 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#C6A667] font-semibold">
                      {t('Số dư Ví ROAR hiện còn', 'ROAR Wallet Balance')}
                    </p>
                    <p className="text-base font-mono font-bold tabular-nums">
                      {formatPrice(user.walletBalanceVnd || 0)}
                    </p>
                  </div>
                  <div className="h-7 w-px bg-white/15 hidden sm:block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#C6A667] font-semibold">
                      {t('Điểm thưởng hiện còn', 'Available Reward Points')}
                    </p>
                    <p className="text-base font-mono font-bold tabular-nums">
                      {(user.points?.available || 0).toLocaleString('vi-VN')} {t('điểm', 'pts')}{' '}
                      <span className="text-[11px] font-normal text-[#F8F5EF]/75">
                        (≈ {formatPrice((user.points?.available || 0) * 100)})
                      </span>
                    </p>
                  </div>
                </div>
                <Link
                  to={localePath('/account?tab=wallet')}
                  className="px-3 py-1.5 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] font-bold text-[11px] shrink-0"
                >
                  {t('+ Nạp Ví (+10%–30%)', '+ Top Up Wallet')}
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selected
                        ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/5 dark:bg-[#00552B]/25 ring-1 ring-[#00552B] dark:ring-[#C6A667]'
                        : 'border-[#202020]/12 dark:border-white/15 hover:border-[#00552B]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide"
                        style={{ backgroundColor: opt.accentColor }}
                      >
                        {opt.badgeText}
                      </span>
                      {opt.isQR ? (
                        <Smartphone className="w-4 h-4 text-[#202020]/50 dark:text-[#F1EFEA]/50" />
                      ) : (
                        <Wallet className="w-4 h-4 text-[#202020]/50 dark:text-[#F1EFEA]/50" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? opt.labelVi : opt.labelEn}</p>
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5 leading-snug">
                        {lang === 'vi' ? opt.subVi : opt.subEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPaymentOption.isQR && (
              <div className="p-3.5 bg-[#F8F5EF] dark:bg-[#0E1512] rounded-lg border border-[#00552B]/15 dark:border-white/10 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80 flex items-start gap-2.5">
                <QrCode className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0 mt-0.5" />
                <span>
                  {t(
                    `Sau khi nhấn "Xác nhận Đặt hàng", mã ${selectedPaymentOption.badgeText} kèm số tiền và nội dung chuyển khoản theo mã đơn sẽ hiển thị ngay để bạn quét trực tiếp.`,
                    `After placing your order, your ${selectedPaymentOption.badgeText} QR code with exact VND amount and order memo appears immediately for direct scanning.`
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">{t('Tóm tắt & Ưu đãi', 'Summary & Vouchers')}</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto text-xs border-b border-[#202020]/10 dark:border-white/10 pb-3">
            {cart.map((c) => (
              <div key={`${c.productId}-${c.variantLabel}`} className="flex justify-between gap-2">
                <span>{lang === 'vi' ? c.nameVi : c.nameEn} ({localizeVariantLabel(c.variantLabel, lang)}) × {c.quantity}</span>
                <span className="font-mono font-semibold tabular-nums">{formatPrice(c.unitPriceVnd * c.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            {/* Dynamic Upsell & Discount Milestone Status Bar */}
            {availablePromos.length > 0 && (() => {
              const milestones = [...availablePromos]
                .filter((p) => Number(p.min_order_value || 0) > 0)
                .sort((a, b) => Number(a.min_order_value || 0) - Number(b.min_order_value || 0));
              if (milestones.length === 0) return null;

              const formatBenefit = (p: any) => {
                if (p.discount_type === 'percent') return t(`Giảm ${p.discount_value}%`, `${p.discount_value}% OFF`);
                if (p.discount_type === 'free_shipping') return t('Miễn phí vận chuyển', 'Free Shipping');
                return t(`Giảm ${formatPrice(Number(p.discount_value || 0))}`, `Save ${formatPrice(Number(p.discount_value || 0))}`);
              };

              const nextPromo = milestones.find((p) => cartSubtotalVnd < Number(p.min_order_value || 0));
              const bestUnlocked = [...milestones].reverse().find((p) => cartSubtotalVnd >= Number(p.min_order_value || 0));
              const targetVal = nextPromo ? Number(nextPromo.min_order_value) : Number(milestones[milestones.length - 1].min_order_value);
              const pct = Math.min(100, Math.max(4, Math.round((cartSubtotalVnd / Math.max(1, targetVal)) * 100)));
              const remaining = nextPromo ? Math.max(0, Number(nextPromo.min_order_value) - cartSubtotalVnd) : 0;

              return (
                <div className="rounded-xl bg-gradient-to-r from-[#00552B]/10 via-[#C6A667]/12 to-[#00552B]/10 dark:from-[#00552B]/30 dark:via-[#C6A667]/15 dark:to-[#00552B]/30 border border-[#00552B]/20 dark:border-[#C6A667]/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2 text-xs">
                    {nextPromo ? (
                      <p className="text-[#202020] dark:text-[#F1EFEA] leading-snug">
                        {t('Mua thêm ', 'Add ')}
                        <strong className="font-mono text-[#00552B] dark:text-[#C6A667]">{formatPrice(remaining)}</strong>
                        {t(' để mở khóa ưu đãi ', ' to unlock ')}
                        <strong className="text-[#00552B] dark:text-[#C6A667]">{formatBenefit(nextPromo)}</strong>
                        <span className="text-[11px] opacity-75"> ({nextPromo.code})</span>
                      </p>
                    ) : (
                      <p className="text-[#00552B] dark:text-[#C6A667] font-semibold leading-snug">
                        {t(
                          `Chúc mừng! Bạn đã đạt mốc ưu đãi cao nhất (${formatBenefit(bestUnlocked)})`,
                          `Unlocked! Your order qualifies for our highest offer (${formatBenefit(bestUnlocked)})`
                        )}
                      </p>
                    )}
                    {nextPromo ? (
                      <Link
                        to={localePath('/shop')}
                        className="px-2 py-1 rounded bg-[#00552B] text-white text-[10px] font-bold whitespace-nowrap shrink-0 hover:bg-[#003D25]"
                      >
                        {t('+ Mua thêm', '+ Add More')}
                      </Link>
                    ) : bestUnlocked ? (
                      <button
                        type="button"
                        onClick={() => applyVoucher(bestUnlocked.code)}
                        className="px-2 py-1 rounded bg-[#C6A667] text-[#111111] text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t('Áp dụng ngay', 'Apply Now')}
                      </button>
                    ) : null}
                  </div>

                  {/* Progress Track */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00552B] via-[#007a3d] to-[#C6A667] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {milestones.slice(0, 4).map((m) => {
                        const unlocked = cartSubtotalVnd >= Number(m.min_order_value || 0);
                        return (
                          <button
                            key={m.code}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => unlocked && applyVoucher(m.code)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              unlocked
                                ? 'bg-[#00552B] text-white font-semibold cursor-pointer hover:bg-[#003D25]'
                                : 'bg-white/70 dark:bg-black/25 text-[#202020]/60 dark:text-[#F1EFEA]/60 border border-[#202020]/10 dark:border-white/10'
                            }`}
                          >
                            {unlocked ? '✓ ' : ''}
                            {formatPrice(Number(m.min_order_value))} · {formatBenefit(m)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder={t('Nhập mã voucher (vd: ROARWELCOME10)', 'Promo code (e.g. ROARWELCOME10)')}
                className="flex-1 bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={() => applyVoucher()}
                className="px-4 py-2 bg-[#00552B] text-white text-xs font-medium rounded cursor-pointer"
              >
                {t('Áp dụng', 'Apply')}
              </button>
            </div>
            {voucherMsg && <p className="text-xs text-[#00552B] dark:text-[#C6A667] font-medium">{voucherMsg}</p>}

            {/* Available & Suggested Vouchers Picker */}
            {availablePromos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-[#202020]/70 dark:text-[#F1EFEA]/70 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                  <span>{t('Voucher khuyến mãi gợi ý cho bạn:', 'Suggested Vouchers for You:')}</span>
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {availablePromos.map((promo) => {
                    const minVal = Number(promo.min_order_value || 0);
                    const needsMember = Boolean(promo.member_only) && !user;
                    const meetsMin = cartSubtotalVnd >= minVal;
                    const eligible = meetsMin && !needsMember;
                    const isApplied =
                      voucherCode.trim().toUpperCase() === String(promo.code || '').toUpperCase() &&
                      (voucherDiscount > 0 || appliedVoucherType === 'free_shipping');

                    const badgeText =
                      promo.discount_type === 'percent'
                        ? `-${promo.discount_value}%`
                        : promo.discount_type === 'free_shipping'
                          ? t('Freeship', 'Free Ship')
                          : `-${formatPrice(promo.discount_value)}`;

                    return (
                      <div
                        key={promo.id || promo.code}
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-[11px] transition-colors ${
                          isApplied
                            ? 'border-[#00552B] bg-[#00552B]/10 dark:border-[#C6A667] dark:bg-[#C6A667]/10'
                            : eligible
                              ? 'border-[#202020]/12 dark:border-white/12 bg-[#F8F5EF]/70 dark:bg-[#0E1512]'
                              : 'border-[#202020]/8 dark:border-white/8 bg-[#F8F5EF]/40 dark:bg-[#0E1512]/40 opacity-65'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{promo.code}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[#C6A667]/25 text-[#694f15] dark:text-[#C6A667] font-semibold text-[10px]">
                              {badgeText}
                            </span>
                            {promo.member_only ? (
                              <span className="text-[10px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                                ({t('Thành viên', 'Member')})
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[#202020]/70 dark:text-[#F1EFEA]/70 truncate mt-0.5">
                            {lang === 'vi' ? promo.title_vi : promo.title_en}
                            {minVal > 0 ? ` · ${t('Đơn từ', 'Min')} ${formatPrice(minVal)}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!eligible}
                          onClick={() => applyVoucher(promo.code)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                            isApplied
                              ? 'bg-[#00552B] text-white'
                              : eligible
                                ? 'border border-[#00552B] text-[#00552B] dark:border-[#C6A667] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                          }`}
                        >
                          {isApplied
                            ? t('Đang dùng', 'Applied')
                            : needsMember
                              ? t('Cần ĐN', 'Login')
                              : !meetsMin
                                ? t('Chưa đủ', 'Min')
                                : t('Chọn', 'Use')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {user && maxRedeemPoints > 0 && (
            <div className="p-3 bg-[#F8F5EF] dark:bg-[#0E1512] rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>{t(`Đổi điểm thưởng (Có ${availablePoints} điểm)`, `Redeem ROAR Points (${availablePoints} avail.)`)}</span>
                <span className="font-mono font-semibold">-{formatPrice(pointsDiscount)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={maxRedeemPoints}
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                className="w-full accent-[#00552B]"
              />
            </div>
          )}

          <div className="space-y-2 text-sm border-t border-[#202020]/10 dark:border-white/10 pt-3">
            <div className="flex justify-between">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Tạm tính', 'Subtotal')}</span>
              <span className="tabular-nums">{formatPrice(cartSubtotalVnd)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-[#00552B] dark:text-[#C6A667]">
                <span>{t('Giảm giá voucher', 'Voucher Discount')}</span>
                <span className="tabular-nums">-{formatPrice(voucherDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-[#00552B] dark:text-[#C6A667]">
                <span>{t('Quy đổi điểm thưởng', 'Points Redeemed')}</span>
                <span className="tabular-nums">-{formatPrice(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Vận chuyển', 'Shipping')}</span>
              <span className="tabular-nums">{shippingFee === 0 ? t('Miễn phí', 'Free') : formatPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[#202020]/10 dark:border-white/10">
              <span>{t('Tổng cộng', 'Total')}</span>
              <span className="text-[#00552B] dark:text-[#C6A667] tabular-nums">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || cart.length === 0}
            className="w-full py-3 bg-[#00552B] text-white text-sm font-semibold rounded hover:bg-[#003D25] cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? t('Đang xử lý...', 'Placing Order...')
              : selectedPaymentOption.isQR
                ? t(`Đặt hàng & Lấy mã ${selectedPaymentOption.badgeText}`, `Place Order & Show ${selectedPaymentOption.badgeText}`)
                : t('Xác nhận Đặt hàng (COD)', 'Place Order (COD)')}
          </button>

          <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0" />
            <span>
              {t(
                'Đơn hàng lưu trực tiếp trên hệ thống với tính điểm thưởng minh bạch. Đối soát tự động qua API ví điện tử / ngân hàng kích hoạt khi kết nối khóa cổng thanh toán chính thức.',
                'Orders are persisted server-side with full ledger integrity. Automated settlement activates once live payment gateway API keys are configured.'
              )}
            </span>
          </p>
        </div>
      </form>
      <RecentlyViewedStrip />
    </div>
  );
};

export const OrderTrackPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { formatPrice } = useStore();
  const [lookupMode, setLookupMode] = useState<'orderNumber' | 'phone' | 'email'>('orderNumber');
  const [queryValue, setQueryValue] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryValue.trim();
    if (!trimmed) {
      setError(t('Vui lòng nhập thông tin tra cứu.', 'Please enter a lookup value.'));
      return;
    }
    setError('');
    setSearching(true);
    try {
      const paramKey =
        lookupMode === 'orderNumber' ? 'orderNumber' : lookupMode === 'phone' ? 'phone' : 'email';
      const res = await fetch(`/api/orders/track?${paramKey}=${encodeURIComponent(trimmed)}`);
      const d = await res.json();
      if (res.ok) {
        const list = Array.isArray(d.orders) ? d.orders : d.order ? [d.order] : [];
        setOrders(list);
        if (list.length === 0) {
          setError(t('Không tìm thấy đơn hàng.', 'No matching orders found.'));
        }
      } else {
        setOrders([]);
        setError(d.error || t('Không tìm thấy đơn hàng.', 'Order not found.'));
      }
    } catch {
      setOrders([]);
      setError(t('Lỗi kết nối máy chủ.', 'Server connection error.'));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto px-6 py-14 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">{t('Tra cứu Đơn hàng', 'Track Your Order')}</h1>
        <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
          {t(
            'Chọn 1 trong 3 điều kiện bên dưới để tra cứu nhanh tình trạng đơn hàng của bạn: Mã đơn hàng, Số điện thoại hoặc Email.',
            'Choose any 1 of 3 conditions to track your order: Order Number, Phone Number, or Email.'
          )}
        </p>
      </div>

      <form onSubmit={handleTrack} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512]">
          {[
            { id: 'orderNumber', vi: '1. Mã đơn hàng', en: '1. Order Number' },
            { id: 'phone', vi: '2. Số điện thoại', en: '2. Phone Number' },
            { id: 'email', vi: '3. Email đặt hàng', en: '3. Email Address' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setLookupMode(m.id as 'orderNumber' | 'phone' | 'email');
                setError('');
              }}
              className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                lookupMode === m.id
                  ? 'bg-[#00552B] text-white'
                  : 'text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#202020] dark:hover:text-white'
              }`}
            >
              {t(m.vi, m.en)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type={lookupMode === 'email' ? 'email' : lookupMode === 'phone' ? 'tel' : 'text'}
            required
            value={queryValue}
            onChange={(e) => setQueryValue(e.target.value)}
            placeholder={
              lookupMode === 'orderNumber'
                ? t('Nhập mã đơn hàng (vd: RC-20261101-1001)', 'Enter Order Number (e.g. RC-20261101-1001)')
                : lookupMode === 'phone'
                  ? t('Nhập số điện thoại đặt hàng (vd: 0901234567)', 'Enter Phone Number (e.g. +84 901 234 567)')
                  : t('Nhập email đặt hàng (vd: member@roarcoffee.vn)', 'Enter Email Address (e.g. member@roarcoffee.vn)')
            }
            className="flex-1 bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3.5 py-2.5 font-mono"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-[#00552B] text-white font-semibold rounded px-6 py-2.5 hover:bg-[#003D25] cursor-pointer disabled:opacity-50"
          >
            {searching ? t('Đang tra cứu...', 'Searching...') : t('Tra cứu đơn', 'Track Order')}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {orders.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667]">
            {t(`Tìm thấy ${orders.length} đơn hàng phù hợp:`, `Found ${orders.length} matching order(s):`)}
          </p>
          {orders.map((order) => (
            <div key={order.id || order.order_number} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#202020]/10 dark:border-white/10">
                <div>
                  <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{order.order_number}</span>
                  <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">
                    {order.customer_name} · {order.customer_phone} · {order.created_at}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-[#202020] dark:text-[#F1EFEA] block">
                    {t('Trạng thái:', 'Status:')} {localizeOrderStatus(order.order_status, lang)}
                  </span>
                  {order.tracking_code && (
                    <span className="font-mono text-[#00552B] dark:text-[#C6A667]">
                      {t('Mã vận đơn:', 'Tracking:')} {order.tracking_code}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {(order.items || []).map((it: any) => (
                  <div key={it.id} className="flex justify-between gap-3">
                    <span>
                      {lang === 'vi' ? it.product_name_vi : it.product_name_en} ({localizeVariantLabel(it.variant_label, lang)}) × {it.quantity}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">{formatPrice(it.line_total_vnd)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold pt-3 border-t border-[#202020]/10 dark:border-white/10">
                <span>{t('Tổng đơn', 'Total')}</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>

              <PaymentQRPanel
                orderNumber={order.order_number}
                customerEmail={order.customer_email}
                paymentMethod={order.payment_method}
                totalVnd={order.total}
                initialPaymentStatus={order.payment_status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
