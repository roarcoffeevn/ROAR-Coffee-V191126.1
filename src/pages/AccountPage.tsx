import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Award, Bell, CheckCheck, Copy, Gift, LogOut, PlusCircle, QrCode, RefreshCw, Shield, Sparkles, Tag, UserCheck, Wallet, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { localizeLedgerEntry, localizeOrderStatus, localizePaymentStatus, localizeVariantLabel } from '../lib/i18nHelpers';
import { MembershipTierVisualizer } from '../components/MembershipTierVisualizer';
import { LoyaltyTierProgressCard } from '../components/LoyaltyTierProgressCard';
import { DailyCheckinGame } from '../components/DailyCheckinGame';

export const AccountPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { user, setAuthSession, clearAuthSession, apiFetch, refreshUser, formatPrice, addToCart, showToast, vcbRate } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleIntent, setRoleIntent] = useState<'customer' | 'b2b_partner'>('customer');
  const [companyName, setCompanyName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [demoCodeHint, setDemoCodeHint] = useState('');
  const [socialModal, setSocialModal] = useState<'google' | 'facebook' | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const initialTab = (searchParams.get('tab') as any) || 'dashboard';
  const [tab, setTab] = useState<'dashboard' | 'wallet' | 'notifications' | 'vouchers' | 'orders' | 'rewards' | 'profile'>(
    ['dashboard', 'wallet', 'notifications', 'vouchers', 'orders', 'rewards', 'profile'].includes(initialTab) ? initialTab : 'dashboard'
  );
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'order' | 'promo'>('all');
  const [dash, setDash] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [customTopup, setCustomTopup] = useState('500000');
  const [topupLoading, setTopupLoading] = useState(false);
  const [pendingTopup, setPendingTopup] = useState<{
    amountVnd: number;
    bonusPct: number;
    bonusVnd: number;
    totalCreditVnd: number;
    bonusPoints: number;
    refCode: string;
  } | null>(null);

  const openTopupQr = (amountVnd: number) => {
    const clean = Math.floor(Number(amountVnd || 0));
    if (!Number.isFinite(clean) || clean < 50000) {
      showToast(t('Số tiền nạp tối thiểu là 50.000₫', 'Minimum top-up amount is 50,000 VND'));
      return;
    }
    const bonusPct = clean >= 2000000 ? 30 : clean >= 1000000 ? 20 : clean >= 500000 ? 15 : 10;
    const bonusVnd = Math.round((clean * bonusPct) / 100);
    const totalCreditVnd = clean + bonusVnd;
    const bonusPoints = Math.floor(totalCreditVnd / 10000);
    const refCode = `ROAR-${(user?.memberCode || 'MEM').replace(/[^A-Z0-9]/gi, '').slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setPendingTopup({ amountVnd: clean, bonusPct, bonusVnd, totalCreditVnd, bonusPoints, refCode });
  };

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [currPass, setCurrPass] = useState('');
  const [nextPass, setNextPass] = useState('');

  const loadWallet = async () => {
    if (!user) return;
    const res = await apiFetch('/api/wallet');
    if (res.ok) {
      setWalletData(await res.json());
    }
  };

  const handleWalletTopup = async (amountVnd: number) => {
    if (!amountVnd || amountVnd < 50000 || topupLoading) return;
    setTopupLoading(true);
    try {
      const res = await apiFetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVnd }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          t(
            `Nạp thành công ${amountVnd.toLocaleString('vi-VN')}₫ (+${d.bonusPct}% thưởng = ${Number(d.totalCreditVnd || amountVnd).toLocaleString('vi-VN')}₫ vào Ví & +${d.pointsDelta || 0} điểm)`,
            `Topped up ${amountVnd.toLocaleString('vi-VN')} VND (+${d.bonusPct}% bonus credited & +${d.pointsDelta || 0} pts)`
          )
        );
        await Promise.all([loadWallet(), loadDashboard(), refreshUser()]);
      } else {
        showToast(d.error || t('Không thể nạp ví lúc này', 'Unable to top up wallet right now'));
      }
    } finally {
      setTopupLoading(false);
    }
  };

  const loadDashboard = async () => {
    if (!user) return;
    const res = await apiFetch('/api/account/dashboard');
    if (res.ok) {
      const d = await res.json();
      setDash(d);
      setEditName(d.user.full_name || '');
      setEditPhone(d.user.phone || '');
    }
  };

  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && ['dashboard', 'wallet', 'notifications', 'vouchers', 'orders', 'rewards', 'profile'].includes(qTab)) {
      setTab(qTab as any);
    }
  }, [searchParams]);

  const switchTab = (next: typeof tab) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
      loadWallet();
    } else {
      setDash(null);
      setWalletData(null);
    }
  }, [user]);

  const markNotificationsRead = async (notificationId?: number) => {
    const res = await apiFetch('/api/account/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationId ? { notificationId } : {}),
    });
    if (res.ok) {
      await loadDashboard();
      await refreshUser();
      if (!notificationId) {
        showToast(t('Đã đánh dấu đã đọc tất cả thông báo', 'Marked all notifications as read'));
      }
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(t(`Đã sao chép mã ưu đãi ${code}`, `Copied voucher code ${code}`));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.user) {
      setAuthSession(d.user, d.token);
      showToast(t('Đăng nhập thành công', 'Signed in successfully'));
    } else {
      showToast(d.error || t('Sai email hoặc mật khẩu', 'Invalid credentials'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, phone, roleIntent, companyName }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.user) {
      setAuthSession(d.user, d.token);
      showToast(t('Tạo tài khoản ROAR Member thành công!', 'Welcome to ROAR COFFEE Members!'));
    } else {
      showToast(d.error || t('Đăng ký thất bại', 'Registration failed'));
    }
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialModal || !socialEmail.trim()) return;
    setSocialLoading(true);
    try {
      const res = await apiFetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: socialModal,
          email: socialEmail.trim(),
          fullName: socialName.trim() || socialEmail.trim().split('@')[0],
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.user) {
        setAuthSession(d.user, d.token);
        setSocialModal(null);
        setSocialEmail('');
        setSocialName('');
        showToast(
          t(
            `Đăng nhập thành công qua ${socialModal === 'google' ? 'Google' : 'Facebook'}!`,
            `Signed in with ${socialModal === 'google' ? 'Google' : 'Facebook'}!`
          )
        );
      } else {
        showToast(d.error || t('Không thể xác thực tài khoản mạng xã hội.', 'Social sign-in failed.'));
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetStep === 'request') {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (res.ok) {
        if (d.demoResetCode) setDemoCodeHint(d.demoResetCode);
        setResetStep('confirm');
        showToast(t('Đã tạo mã khôi phục mật khẩu', 'Recovery code generated'));
      }
    } else {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: resetToken, newPassword }),
      });
      if (res.ok) {
        setAuthMode('login');
        setResetStep('request');
        showToast(t('Đã đặt lại mật khẩu thành công', 'Password updated successfully'));
      } else {
        const d = await res.json();
        showToast(d.error || 'Error');
      }
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearAuthSession();
    showToast(t('Đã đăng xuất', 'Signed out'));
  };

  const handleVerifyEmail = async () => {
    const res = await apiFetch('/api/auth/verify-email', { method: 'POST' });
    if (res.ok) {
      await refreshUser();
      await loadDashboard();
      showToast(t('Đã xác thực email thành công', 'Email verified'));
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: editName, phone: editPhone }),
    });
    if (res.ok) {
      await refreshUser();
      await loadDashboard();
      showToast(t('Đã cập nhật hồ sơ cá nhân', 'Profile updated'));
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLine.trim() || !dash) return;
    const current = dash.user.addresses || [];
    const next = [
      ...current,
      {
        id: `addr-${Date.now()}`,
        label: newAddressLabel.trim() || t('Địa chỉ mới', 'Address'),
        recipient: dash.user.full_name,
        phone: dash.user.phone,
        addressLine: newAddressLine.trim(),
        isDefault: current.length === 0,
      },
    ];
    await apiFetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: next }),
    });
    setNewAddressLabel('');
    setNewAddressLine('');
    await loadDashboard();
    showToast(t('Đã thêm địa chỉ giao hàng', 'Shipping address saved'));
  };

  const setDefaultAddress = async (id: string) => {
    if (!dash) return;
    const next = (dash.user.addresses || []).map((a: any) => ({ ...a, isDefault: a.id === id }));
    await apiFetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: next }),
    });
    await loadDashboard();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currPass, newPassword: nextPass }),
    });
    const d = await res.json();
    if (res.ok) {
      setCurrPass('');
      setNextPass('');
      showToast(t('Đã đổi mật khẩu', 'Password changed'));
    } else {
      showToast(d.error || 'Error');
    }
  };

  const requestAccountDeletion = async () => {
    await apiFetch('/api/account/request-deletion', { method: 'POST' });
    await loadDashboard();
    showToast(t('Đã ghi nhận yêu cầu xóa tài khoản', 'Account deletion request recorded'));
  };

  const reorder = (order: any) => {
    for (const item of order.items || []) {
      addToCart({
        productId: item.product_id,
        slug: item.product_slug || item.sku.toLowerCase(),
        sku: item.sku,
        nameVi: item.product_name_vi,
        nameEn: item.product_name_en,
        variantLabel: item.variant_label,
        unitPriceVnd: item.unit_price_vnd,
        unitPriceUsd: Number((item.unit_price_vnd / vcbRate).toFixed(2)),
        quantity: item.quantity,
        imageKey: item.product_image_key || 'product_robusta_house',
      });
    }
    showToast(t('Đã thêm lại sản phẩm từ đơn hàng vào giỏ', 'Items added back to cart'));
  };

  const requestOrderAction = async (orderNumber: string, action: 'cancel' | 'return') => {
    const res = await apiFetch(`/api/orders/${orderNumber}/request-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await loadDashboard();
      showToast(t('Đã cập nhật yêu cầu đơn hàng', 'Order updated'));
    }
  };

  if (!user) {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-14 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {t('THÀNH VIÊN ROAR COFFEE', 'ROAR COFFEE MEMBERS')}
          </p>
          <h1 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {authMode === 'login'
              ? t('Đăng Nhập Thành Viên', 'Member Sign In')
              : authMode === 'register'
              ? t('Đăng Ký Thành Viên ROAR', 'Create Member Account')
              : t('Khôi Phục Mật Khẩu', 'Password Recovery')}
          </h1>
        </div>

        <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8 space-y-5">
          {/* Quick Social ID Registration & Sign-In (Google / Facebook) */}
          {authMode !== 'forgot' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSocialModal('google');
                    setSocialEmail('');
                    setSocialName('');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-[#202020] dark:text-[#F1EFEA] transition-colors cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-[#EA4335] text-white font-bold text-[10px] flex items-center justify-center">G</span>
                  <span>{t('Tiếp tục với Google', 'Continue with Google')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSocialModal('facebook');
                    setSocialEmail('');
                    setSocialName('');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[#1877F2]/30 bg-[#1877F2]/5 hover:bg-[#1877F2]/15 text-xs font-semibold text-[#1877F2] dark:text-[#60A5FA] transition-colors cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white font-bold text-[10px] flex items-center justify-center">f</span>
                  <span>{t('Tiếp tục với Facebook', 'Continue with Facebook')}</span>
                </button>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#202020]/10 dark:border-white/10 w-full" />
                <span className="bg-white dark:bg-[#16221C] px-3 text-[11px] text-[#202020]/50 dark:text-[#F1EFEA]/50 whitespace-nowrap">
                  {t('hoặc dùng Email ROAR', 'or use Email')}
                </span>
                <div className="border-t border-[#202020]/10 dark:border-white/10 w-full" />
              </div>
            </div>
          )}

          {socialModal && (
            <form
              onSubmit={handleSocialSubmit}
              className="p-4 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/25 dark:border-[#C6A667]/30 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#00552B] dark:text-[#C6A667]">
                  {socialModal === 'google'
                    ? t('Xác nhận tài khoản Google', 'Continue with Google Account')
                    : t('Xác nhận tài khoản Facebook', 'Continue with Facebook Account')}
                </p>
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="text-[#202020]/60 dark:text-[#F1EFEA]/60 hover:underline cursor-pointer"
                >
                  {t('Đóng', 'Close')}
                </button>
              </div>
              <input
                type="email"
                required
                value={socialEmail}
                onChange={(e) => setSocialEmail(e.target.value)}
                placeholder={
                  socialModal === 'google'
                    ? t('Nhập email Google (vd: tenban@gmail.com)', 'Enter your Google email')
                    : t('Nhập email Facebook của bạn', 'Enter your Facebook email')
                }
                className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                value={socialName}
                onChange={(e) => setSocialName(e.target.value)}
                placeholder={t('Họ và tên hiển thị (tùy chọn)', 'Display name (optional)')}
                className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2"
              />
              <button
                type="submit"
                disabled={socialLoading}
                className="w-full py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {socialLoading
                  ? t('Đang xác thực...', 'Connecting...')
                  : t('Xác nhận & Đăng nhập ngay (+50 điểm)', 'Continue & Sign In (+50 pts)')}
              </button>
            </form>
          )}

          <div className="flex border-b border-[#202020]/10 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 pb-3 cursor-pointer ${authMode === 'login' ? 'text-[#00552B] dark:text-[#C6A667] border-b-2 border-[#00552B] dark:border-[#C6A667]' : 'text-[#202020]/55 dark:text-[#F1EFEA]/55'}`}
            >
              {t('Đăng nhập', 'Sign In')}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 pb-3 cursor-pointer ${authMode === 'register' ? 'text-[#00552B] dark:text-[#C6A667] border-b-2 border-[#00552B] dark:border-[#C6A667]' : 'text-[#202020]/55 dark:text-[#F1EFEA]/55'}`}
            >
              {t('Đăng ký mới', 'Register')}
            </button>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('Mật khẩu', 'Password')}</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#00552B] text-white font-semibold rounded hover:bg-[#003D25] cursor-pointer">
                {t('Đăng nhập', 'Sign In')}
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button type="button" onClick={() => setAuthMode('forgot')} className="text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer">
                  {t('Quên mật khẩu?', 'Forgot password?')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('member@roarcoffee.vn');
                    setPassword('RoarMember!2026');
                  }}
                  className="text-[#202020]/65 dark:text-[#F1EFEA]/70 hover:text-[#00552B] dark:hover:text-[#C6A667] cursor-pointer"
                >
                  {t('Điền tài khoản mẫu', 'Fill demo member')}
                </button>
              </div>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">{t('Loại tài khoản', 'Account Type')}</label>
                <select value={roleIntent} onChange={(e) => setRoleIntent(e.target.value as any)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2">
                  <option value="customer">{t('Khách hàng Thành viên (B2C)', 'Personal Member (B2C)')}</option>
                  <option value="b2b_partner">{t('Đối tác Doanh nghiệp / HORECA (B2B)', 'Business / HORECA Partner (B2B)')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('Họ và tên *', 'Full Name *')}</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
              </div>
              {roleIntent === 'b2b_partner' && (
                <div>
                  <label className="block text-xs font-medium mb-1">{t('Tên Doanh nghiệp / Quán', 'Company Name')}</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t('Số điện thoại', 'Phone')}</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('Mật khẩu (tối thiểu 8 ký tự) *', 'Password (min 8 chars) *')}</label>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#00552B] text-white font-semibold rounded hover:bg-[#003D25] cursor-pointer">
                {t('Tạo tài khoản', 'Create Account')}
              </button>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
              </div>
              {resetStep === 'confirm' && (
                <>
                  {demoCodeHint && (
                    <p className="text-xs bg-[#F8F5EF] dark:bg-[#0E1512] p-2.5 rounded font-mono text-[#00552B] dark:text-[#C6A667]">
                      {t('Mã khôi phục (Dev mode):', 'Dev recovery code:')} {demoCodeHint}
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-medium mb-1">{t('Mã khôi phục', 'Recovery Code')}</label>
                    <input type="text" required value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2 font-mono uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">{t('Mật khẩu mới (min 8)', 'New Password')}</label>
                    <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
                  </div>
                </>
              )}
              <button type="submit" className="w-full py-2.5 bg-[#00552B] text-white font-semibold rounded cursor-pointer">
                {resetStep === 'request' ? t('Gửi mã khôi phục', 'Request Recovery Code') : t('Đặt lại mật khẩu', 'Reset Password')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const unreadCount = dash?.unreadNotifications ?? user.unreadNotifications ?? 0;
  const filteredNotifications = (dash?.notifications || []).filter((n: any) => {
    if (notifFilter === 'unread') return !n.is_read;
    if (notifFilter === 'order') return n.category === 'order';
    if (notifFilter === 'promo') return n.category === 'promo' || n.category === 'loyalty';
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-8">
      {/* Member Header */}
      <div className="bg-[#003D25] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest text-[#C6A667] font-semibold">
            {user.tier} · <span className="font-mono">{user.memberCode}</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t('Xin chào,', 'Welcome back,')} {user.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#F8F5EF]/80">
            <span>{user.email}</span>
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[#C6A667]"><UserCheck className="w-3.5 h-3.5" /> {t('Đã xác thực email', 'Email Verified')}</span>
            ) : (
              <button type="button" onClick={handleVerifyEmail} className="underline text-[#C6A667] cursor-pointer">
                {t('Xác thực email ngay', 'Verify Email Now')}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/15">
            <span className="text-[11px] text-[#C6A667] block">{t('Điểm khả dụng', 'Available Points')}</span>
            <span className="text-2xl font-bold font-mono tabular-nums">{dash?.points?.available ?? user.points?.available ?? 0}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-white/25 rounded text-xs font-medium hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('Đăng xuất', 'Sign Out')}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-3">
        {[
          { id: 'dashboard', vi: 'Tổng quan', en: 'Dashboard' },
          { id: 'wallet', vi: 'Ví ROAR & Nạp tiền', en: 'ROAR Wallet' },
          { id: 'notifications', vi: 'Thông báo', en: 'Notifications', badge: unreadCount },
          { id: 'vouchers', vi: 'Ưu đãi & Voucher', en: 'Offers & Vouchers', badge: dash?.activeVouchers?.length },
          { id: 'orders', vi: 'Đơn hàng', en: 'Orders' },
          { id: 'rewards', vi: 'Điểm thưởng ROAR', en: 'ROAR Rewards' },
          { id: 'profile', vi: 'Tài khoản & Địa chỉ', en: 'Profile & Privacy' },
        ].map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => switchTab(tb.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
              tab === tb.id
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] text-[#202020]/80 dark:text-[#F1EFEA]/85 border border-[#202020]/10 dark:border-white/10'
            }`}
          >
            <span>{t(tb.vi, tb.en)}</span>
            {typeof tb.badge === 'number' && tb.badge > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                  tab === tb.id ? 'bg-white/20 text-white' : 'bg-[#C6A667] text-[#111111]'
                }`}
              >
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && dash && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
              <span className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Điểm khả dụng', 'Available Points')}</span>
              <p className="text-2xl font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums mt-1">{dash.points.available}</p>
            </div>
            <div className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
              <span className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Thông báo chưa đọc', 'Unread Alerts')}</span>
              <p className="text-2xl font-bold font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums mt-1">{unreadCount}</p>
            </div>
            <div className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
              <span className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Voucher đang mở', 'Active Vouchers')}</span>
              <p className="text-2xl font-bold font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums mt-1">{dash.activeVouchers.length}</p>
            </div>
            <div className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
              <span className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Tổng đơn hàng', 'Total Orders')}</span>
              <p className="text-2xl font-bold font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums mt-1">{dash.orders.length}</p>
            </div>
          </div>

          <LoyaltyTierProgressCard
            accumulatedPoints={Number(dash.points?.available || 0) + Number(dash.points?.redeemed || 0)}
            availablePoints={Number(dash.points?.available || 0)}
            currentTierName={user.tier}
            onViewBenefits={() => switchTab('rewards')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('Đơn hàng gần đây', 'Recent Orders')}</h2>
                <button type="button" onClick={() => switchTab('orders')} className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer">
                  {t('Xem tất cả →', 'View All →')}
                </button>
              </div>
              {dash.orders.length === 0 ? (
                <p className="text-sm text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Bạn chưa có đơn hàng nào.', 'No orders placed yet.')}</p>
              ) : (
                dash.orders.slice(0, 3).map((o: any) => (
                  <div key={o.id} className="p-4 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{o.order_number}</span>
                      <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{o.created_at.slice(0, 10)} · {localizeOrderStatus(o.order_status, lang)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold tabular-nums">{formatPrice(o.total)}</span>
                      <button
                        type="button"
                        onClick={() => reorder(o)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00552B] text-white text-xs rounded cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> {t('Đặt lại', 'Reorder')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t('Thông báo mới nhất', 'Recent Notifications')}</h2>
                <button type="button" onClick={() => switchTab('notifications')} className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer">
                  {t('Mở hộp thư →', 'View All →')}
                </button>
              </div>
              <div className="space-y-3">
                {(dash.notifications || []).slice(0, 3).map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markNotificationsRead(n.id)}
                    className={`p-3.5 rounded-lg border space-y-1 cursor-pointer transition-colors ${
                      n.is_read
                        ? 'border-[#202020]/10 dark:border-white/10 bg-transparent'
                        : 'border-[#C6A667]/60 bg-[#C6A667]/8 dark:bg-[#C6A667]/12'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold uppercase text-[#00552B] dark:text-[#C6A667]">
                        {n.category === 'order'
                          ? t('Đơn hàng', 'Order')
                          : n.category === 'promo'
                          ? t('Khuyến mãi', 'Promo')
                          : n.category === 'loyalty'
                          ? t('Điểm thưởng', 'Loyalty')
                          : t('Hệ thống', 'System')}
                      </span>
                      <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50 tabular-nums">{String(n.created_at).slice(0, 10)}</span>
                    </div>
                    <p className="text-xs font-bold">{lang === 'vi' ? n.title_vi : n.title_en}</p>
                    <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2">{lang === 'vi' ? n.message_vi : n.message_en}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && dash && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: 'all', label: t('Tất cả', 'All') },
                { id: 'unread', label: `${t('Chưa đọc', 'Unread')} (${unreadCount})` },
                { id: 'order', label: t('Cập nhật Đơn hàng', 'Order Updates') },
                { id: 'promo', label: t('Khuyến mãi & Điểm', 'Promos & Points') },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setNotifFilter(flt.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    notifFilter === flt.id
                      ? 'bg-[#00552B] text-white'
                      : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/75 dark:text-[#F1EFEA]/75'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markNotificationsRead()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#00552B]/30 dark:border-[#C6A667]/40 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B]/5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('Đánh dấu đã đọc tất cả', 'Mark All Read')}
              </button>
            )}
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-10 text-center space-y-2">
              <Bell className="w-8 h-8 mx-auto text-[#202020]/25 dark:text-[#F1EFEA]/25" />
              <p className="text-sm text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t('Không có thông báo nào trong mục này.', 'No notifications in this category.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markNotificationsRead(n.id)}
                  className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer ${
                    n.is_read
                      ? 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10'
                      : 'bg-[#F8F5EF] dark:bg-[#192820] border-[#C6A667] ring-1 ring-[#C6A667]/25'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold uppercase text-[#00552B] dark:text-[#C6A667]">
                        {n.category === 'order'
                          ? t('Đơn hàng', 'Order')
                          : n.category === 'promo'
                          ? t('Ưu đãi', 'Offer')
                          : n.category === 'loyalty'
                          ? t('Điểm ROAR', 'Points')
                          : t('Hệ thống', 'System')}
                      </span>
                      {!n.is_read && (
                        <span className="px-2 py-0.5 rounded bg-[#C6A667] text-[#111111] text-[10px] font-bold">
                          {t('Mới', 'New')}
                        </span>
                      )}
                      <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50 font-mono tabular-nums">{n.created_at}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#202020] dark:text-[#F1EFEA]">
                      {lang === 'vi' ? n.title_vi : n.title_en}
                    </h3>
                    <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                      {lang === 'vi' ? n.message_vi : n.message_en}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationsRead(n.id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium border border-[#202020]/15 dark:border-white/15 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        {t('Đã đọc', 'Mark Read')}
                      </button>
                    )}
                    {n.link_url && (
                      <Link
                        to={localePath(n.link_url)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-1.5 bg-[#00552B] text-white text-xs font-semibold rounded-lg hover:bg-[#003D25]"
                      >
                        {t('Xem chi tiết', 'View Detail')}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'vouchers' && dash && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
                {t('Chương Trình Khuyến Mãi & Ví Voucher Thành Viên', 'Member Promotions & Voucher Wallet')}
              </h2>
              <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 mt-1">
                {t(
                  'Sao chép mã ưu đãi dưới đây và dán trực tiếp ở bước Giỏ hàng hoặc Thanh toán để áp dụng tức thì.',
                  'Copy any active voucher code below and apply it in Cart or Checkout.'
                )}
              </p>
            </div>
            <Link
              to={localePath('/promotions')}
              className="px-4 py-2 border border-[#00552B]/30 dark:border-[#C6A667]/40 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] rounded-lg whitespace-nowrap"
            >
              {t('Trang Ưu đãi công khai →', 'Public Offers Page →')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dash.activeVouchers.map((v: any) => (
              <div
                key={v.id}
                className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                      <Tag className="w-3.5 h-3.5" /> {v.code}
                    </span>
                    <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
                      {t('HSD:', 'Valid until')} {v.end_date}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
                    {lang === 'vi' ? v.title_vi : v.title_en}
                  </h3>
                  <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {lang === 'vi' ? v.description_vi : v.description_en}
                  </p>
                  <div className="pt-2 border-t border-[#202020]/8 dark:border-white/10 text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 space-y-1">
                    <p>{t('Điều kiện:', 'Terms:')} {lang === 'vi' ? v.terms_vi : v.terms_en}</p>
                    <p className="tabular-nums">
                      {v.min_order_value > 0
                        ? t(`Đơn tối thiểu: ${v.min_order_value.toLocaleString('vi-VN')} ₫`, `Min order: ${v.min_order_value.toLocaleString()} VND`)
                        : t('Áp dụng cho mọi giá trị đơn hàng', 'No minimum order required')}
                      {v.member_only === 1 ? ` · ${t('Dành riêng Thành viên ROAR', 'ROAR Members Only')}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => copyVoucherCode(v.code)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-xs font-semibold rounded-lg hover:bg-[#00552B]/5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> {t('Sao chép mã', 'Copy Code')}
                  </button>
                  <Link
                    to={localePath('/shop')}
                    className="flex-1 text-center py-2 bg-[#00552B] text-white text-xs font-semibold rounded-lg hover:bg-[#003D25]"
                  >
                    {t('Mua sắm dùng ngay', 'Use in Store')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && dash && (
        <div className="space-y-4">
          {dash.orders.length === 0 ? (
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-10 text-center text-sm text-[#202020]/65 dark:text-[#F1EFEA]/65">
              {t('Chưa có lịch sử đơn hàng.', 'No order history found.')}
            </div>
          ) : (
            dash.orders.map((o: any) => (
              <div key={o.id} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#202020]/10 dark:border-white/10">
                  <div>
                    <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{o.order_number}</span>
                    <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">{o.created_at} · {t('Thanh toán:', 'Payment:')} {localizePaymentStatus(o.payment_status, lang)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">{localizeOrderStatus(o.order_status, lang)}</span>
                    {o.tracking_code && <span className="font-mono text-[#00552B] dark:text-[#C6A667]">{o.tracking_code}</span>}
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {(o.items || []).map((it: any) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{lang === 'vi' ? it.product_name_vi : it.product_name_en} ({localizeVariantLabel(it.variant_label, lang)}) × {it.quantity}</span>
                      <span className="font-mono tabular-nums">{formatPrice(it.line_total_vnd)}</span>
                    </div>
                  ))}
                </div>
                {o.notes && (
                  <p className="text-xs bg-[#F8F5EF] dark:bg-[#0E1512] p-3 rounded-lg text-[#202020]/75 dark:text-[#F1EFEA]/75 whitespace-pre-line">
                    {o.notes}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#202020]/10 dark:border-white/10">
                  <span className="font-bold tabular-nums">{t('Tổng cộng:', 'Total:')} {formatPrice(o.total)}</span>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => reorder(o)} className="px-3 py-1.5 bg-[#00552B] text-white rounded cursor-pointer">
                      {t('Mua lại', 'Reorder')}
                    </button>
                    {(o.order_status === 'Pending' || o.order_status === 'Confirmed') && (
                      <button type="button" onClick={() => requestOrderAction(o.order_number, 'cancel')} className="px-3 py-1.5 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 rounded cursor-pointer">
                        {t('Yêu cầu hủy', 'Cancel Order')}
                      </button>
                    )}
                    {o.order_status === 'Completed' && (
                      <button type="button" onClick={() => requestOrderAction(o.order_number, 'return')} className="px-3 py-1.5 border border-[#202020]/20 dark:border-white/20 rounded cursor-pointer">
                        {t('Yêu cầu trả hàng', 'Request Return')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'wallet' && (
        <div className="space-y-6">
          {/* Starbucks-Style Digital ROAR Member Wallet Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#003D25] via-[#00552B] to-[#0E1512] text-white p-6 sm:p-8 border border-[#C6A667]/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#C6A667] font-semibold">
                  <Wallet className="w-4 h-4" />
                  <span>{t('VÍ THÀNH VIÊN ROAR REWARDS', 'ROAR REWARDS MEMBER WALLET')}</span>
                </div>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-white mt-2 tabular-nums">
                  {formatPrice(walletData?.walletBalanceVnd ?? user.walletBalanceVnd ?? 0)}
                </p>
                <p className="text-xs text-[#F8F5EF]/75 mt-1">
                  {t(
                    `Điểm thưởng hiện có: ${(walletData?.points?.available ?? user.points?.available ?? 0).toLocaleString()} điểm · Hạng ${user.tier}`,
                    `Available points: ${(walletData?.points?.available ?? user.points?.available ?? 0).toLocaleString()} pts · ${user.tier}`
                  )}
                </p>
              </div>
              <div className="sm:text-right space-y-1">
                <p className="text-xs text-[#C6A667] font-mono">{user.memberCode}</p>
                <p className="text-sm font-semibold">{user.fullName}</p>
                <Link
                  to={localePath('/checkout')}
                  className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-2 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('Dùng Ví thanh toán ngay', 'Pay with Wallet')}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Top-up Packages (+10% to +30% Bonus) */}
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#202020] dark:text-[#F1EFEA] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
                {t('Nạp tiền vào Ví — Tặng thưởng ngay +10% đến +30%', 'Top Up Wallet — Instant +10% to +30% Bonus')}
              </h2>
              <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 mt-1">
                {t(
                  'Chọn mệnh giá nạp để được cộng thêm 10% – 30% giá trị vào Ví ROAR và tích điểm thưởng mua hàng như thành viên Starbucks.',
                  'Choose a top-up pack to receive an instant +10% to +30% bonus credit plus reward points for every purchase.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                walletData?.packages || [
                  { amountVnd: 100000, bonusPct: 10, bonusVnd: 10000, totalCreditVnd: 110000, bonusPoints: 11, labelVi: 'Gói Khởi Động · +10%', labelEn: 'Starter · +10%' },
                  { amountVnd: 500000, bonusPct: 15, bonusVnd: 75000, totalCreditVnd: 575000, bonusPoints: 57, labelVi: 'Gói Thành Viên · +15%', labelEn: 'Member · +15%' },
                  { amountVnd: 1000000, bonusPct: 20, bonusVnd: 200000, totalCreditVnd: 1200000, bonusPoints: 120, labelVi: 'Gói Gold · +20%', labelEn: 'Gold · +20%' },
                  { amountVnd: 2000000, bonusPct: 30, bonusVnd: 600000, totalCreditVnd: 2600000, bonusPoints: 260, labelVi: 'Gói Reserve VIP · +30%', labelEn: 'Reserve VIP · +30%' },
                ]
              ).map((pkg: any) => (
                <div
                  key={pkg.amountVnd}
                  className="p-4 rounded-xl border border-[#00552B]/20 dark:border-[#C6A667]/30 bg-[#F8F5EF] dark:bg-[#0E1512] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                        {lang === 'en' ? pkg.labelEn : pkg.labelVi}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#C6A667] text-[#111111] text-[10px] font-extrabold">
                        +{pkg.bonusPct}%
                      </span>
                    </div>
                    <p className="text-lg font-mono font-bold text-[#202020] dark:text-[#F1EFEA] mt-2 tabular-nums">
                      {formatPrice(pkg.amountVnd)}
                    </p>
                    <p className="text-[11px] text-[#00552B] dark:text-[#C6A667] font-semibold mt-0.5">
                      {t(
                        `Nhận ${formatPrice(pkg.totalCreditVnd)} + ${pkg.bonusPoints} điểm`,
                        `Get ${formatPrice(pkg.totalCreditVnd)} + ${pkg.bonusPoints} pts`
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={topupLoading}
                    onClick={() => openTopupQr(pkg.amountVnd)}
                    className="w-full py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t('Quét QR nạp gói này', 'Pay via QR')}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Top-up Amount */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                openTopupQr(Number(customTopup));
              }}
              className="pt-3 border-t border-[#202020]/10 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <input
                type="number"
                min={50000}
                step={50000}
                value={customTopup}
                onChange={(e) => setCustomTopup(e.target.value)}
                placeholder={t('Nhập số tiền nạp khác (tối thiểu 50.000₫)', 'Enter custom amount (min 50,000 VND)')}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs font-mono"
              />
              <button
                type="submit"
                disabled={topupLoading}
                className="px-5 py-2.5 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{t('Tạo mã QR nạp Ví', 'Generate Top-up QR')}</span>
              </button>
            </form>
          </div>

          {/* VietQR Top-Up Modal */}
          {pendingTopup && (
            <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#16221C] border border-[#00552B]/25 dark:border-[#C6A667]/35 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
                    <h3 className="text-sm sm:text-base font-bold text-[#202020] dark:text-[#F1EFEA]">
                      {t('Quét mã VietQR để Nạp Ví ROAR', 'Scan VietQR to Top Up ROAR Wallet')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingTopup(null)}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center bg-[#F8F5EF] dark:bg-[#0E1512] rounded-xl p-4 border border-[#202020]/10 dark:border-white/10">
                  <img
                    src={`https://img.vietqr.io/image/VCB-102866889999-compact2.png?amount=${pendingTopup.amountVnd}&addInfo=${encodeURIComponent(pendingTopup.refCode)}&accountName=${encodeURIComponent('ROAR COFFEE VIETNAM')}`}
                    alt="VietQR Top-up"
                    className="w-52 h-52 object-contain rounded-lg bg-white p-1.5 shadow-sm"
                  />
                  <div className="mt-3 text-center text-xs space-y-1">
                    <p className="font-bold text-[#202020] dark:text-[#F1EFEA]">Vietcombank · STK: <span className="font-mono">1028 6688 9999</span></p>
                    <p className="text-[#202020]/70 dark:text-[#F1EFEA]/70">ROAR COFFEE VIETNAM</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 font-mono text-[11px]">
                      <span>{t('Nội dung CK:', 'Ref:')} <strong>{pendingTopup.refCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(pendingTopup.refCode);
                          showToast(t('Đã sao chép nội dung chuyển khoản', 'Copied transfer reference'));
                        }}
                        className="text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#00552B]/8 dark:bg-[#C6A667]/10 border border-[#00552B]/20 dark:border-[#C6A667]/25 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Số tiền chuyển khoản:', 'Transfer amount:')}</span>
                    <span className="font-mono font-bold">{formatPrice(pendingTopup.amountVnd)}</span>
                  </div>
                  <div className="flex justify-between text-[#00552B] dark:text-[#C6A667]">
                    <span>{t(`Thưởng gói nạp (+${pendingTopup.bonusPct}%):`, `Bonus (+${pendingTopup.bonusPct}%):`)}</span>
                    <span className="font-mono font-bold">+{formatPrice(pendingTopup.bonusVnd)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#202020]/10 dark:border-white/10 font-bold">
                    <span>{t('Tổng cộng vào Ví & Điểm:', 'Total Credited:')}</span>
                    <span className="font-mono text-[#00552B] dark:text-[#C6A667]">
                      {formatPrice(pendingTopup.totalCreditVnd)} (+{pendingTopup.bonusPoints} {t('điểm', 'pts')})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingTopup(null)}
                    className="flex-1 py-2.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold cursor-pointer"
                  >
                    {t('Đóng', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={topupLoading}
                    onClick={async () => {
                      const amt = pendingTopup.amountVnd;
                      await handleWalletTopup(amt);
                      setPendingTopup(null);
                    }}
                    className="flex-[2] py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {topupLoading ? t('Đang xác nhận...', 'Confirming...') : t('Xác nhận đã chuyển khoản', 'Confirm Transfer & Credit Wallet')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Transaction History */}
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-3">
            <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Lịch sử giao dịch Ví ROAR', 'ROAR Wallet Transaction History')}
            </h3>
            {!walletData?.transactions?.length ? (
              <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">
                {t('Chưa có giao dịch nào. Nạp gói đầu tiên để nhận ngay +10% đến +30% thưởng nhé!', 'No transactions yet. Top up your first pack for +10% to +30% bonus!')}
              </p>
            ) : (
              <div className="divide-y divide-[#202020]/10 dark:divide-white/10">
                {walletData.transactions.map((tx: any) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-[#202020] dark:text-[#F1EFEA]">{tx.note}</p>
                      <p className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 font-mono">
                        {tx.reference_code} · {tx.created_at}
                      </p>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <p className={`font-bold ${tx.tx_type === 'spend' ? 'text-rose-600 dark:text-rose-400' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                        {tx.tx_type === 'spend'
                          ? `-${formatPrice(Math.abs(tx.amount_vnd))}`
                          : `+${formatPrice(tx.amount_vnd + (tx.bonus_vnd || 0))}`}
                      </p>
                      {tx.points_delta > 0 && (
                        <p className="text-[10px] text-[#C6A667]">+{tx.points_delta} {t('điểm', 'pts')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'rewards' && dash && (
        <div className="space-y-8">
          <DailyCheckinGame onRewardClaimed={loadDashboard} />
          <MembershipTierVisualizer
            currentTierName={user.tier}
            lifetimeSpendVnd={(dash.orders || [])
              .filter((o: any) => o.order_status !== 'Cancelled')
              .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)}
            lifetimePoints={Number(dash.points?.available || 0) + Number(dash.points?.redeemed || 0)}
          />
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" /> {t('ĐIỂM THƯỞNG ROAR', 'ROAR REWARDS')}</h2>
              <span className="text-xs text-[#00552B] dark:text-[#C6A667]">{dash.loyaltySettings?.policy_status === 'proposed_configurable' ? t('Chính sách tham chiếu (có thể cấu hình)', 'Proposed configurable policy') : dash.loyaltySettings?.policy_status}</span>
            </div>
            <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75">
              {t(
                `Quy tắc tham chiếu có thể cấu hình: ${dash.loyaltySettings?.points_per_10k_vnd} điểm / 10.000đ chi tiêu hợp lệ · 1 điểm = ${dash.loyaltySettings?.vnd_per_point}đ khi quy đổi. Điểm được cộng chính thức khi đơn hàng hoàn tất.`,
                `Configurable proposed rules: ${dash.loyaltySettings?.points_per_10k_vnd} pt per 10,000 VND net purchase · 1 pt = ${dash.loyaltySettings?.vnd_per_point} VND redemption value. Points settle upon order completion.`
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {dash.tiers.map((tr: any) => (
                <div key={tr.id} className={`p-4 rounded-lg border ${user.tier === tr.name ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/5 dark:bg-[#00552B]/25' : 'border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF] dark:bg-[#0E1512]'}`}>
                  <p className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">{tr.name}</p>
                  <p className="text-xs font-mono text-[#00552B] dark:text-[#C6A667] mt-0.5">{tr.point_multiplier}x {t('Điểm', 'Points')}</p>
                  <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 mt-2">{lang === 'vi' ? tr.benefits_vi : tr.benefits_en}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4">
            <h3 className="text-base font-bold">{t('Lịch sử giao dịch điểm', 'Points Ledger History')}</h3>
            {dash.ledger.length === 0 ? (
              <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Chưa có giao dịch điểm.', 'No points transactions yet.')}</p>
            ) : (
              <div className="divide-y divide-[#202020]/8 dark:divide-white/10 text-sm">
                {dash.ledger.map((row: any) => (
                  <div key={row.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? row.description_vi : row.description_en}</p>
                      <span className="text-xs text-[#202020]/55 dark:text-[#F1EFEA]/55">{row.created_at} · {localizeLedgerEntry(row.entry_type, lang)}</span>
                    </div>
                    <span className={`font-mono font-bold tabular-nums ${row.points >= 0 ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-red-500'}`}>
                      {row.points > 0 ? `+${row.points}` : row.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'profile' && dash && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={saveProfile} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4 text-sm">
            <h2 className="text-lg font-bold">{t('Thông tin cá nhân', 'Personal Information')}</h2>
            <div>
              <label className="block text-xs font-medium mb-1">{t('Họ và tên', 'Full Name')}</label>
              <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('Số điện thoại', 'Phone')}</label>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
            </div>
            <button type="submit" className="px-5 py-2 bg-[#00552B] text-white text-xs font-semibold rounded cursor-pointer">
              {t('Lưu thay đổi', 'Save Profile')}
            </button>
          </form>

          <form onSubmit={changePassword} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4 text-sm">
            <h2 className="text-lg font-bold">{t('Đổi mật khẩu', 'Change Password')}</h2>
            <div>
              <label className="block text-xs font-medium mb-1">{t('Mật khẩu hiện tại', 'Current Password')}</label>
              <input type="password" required value={currPass} onChange={(e) => setCurrPass(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('Mật khẩu mới (min 8)', 'New Password')}</label>
              <input type="password" required minLength={8} value={nextPass} onChange={(e) => setNextPass(e.target.value)} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2" />
            </div>
            <button type="submit" className="px-5 py-2 bg-[#202020] dark:bg-[#C6A667] text-white dark:text-[#111111] text-xs font-semibold rounded cursor-pointer">
              {t('Cập nhật mật khẩu', 'Update Password')}
            </button>
          </form>

          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4 text-sm">
            <h2 className="text-lg font-bold">{t('Sổ địa chỉ giao hàng', 'Shipping Addresses')}</h2>
            <div className="space-y-2">
              {(dash.user.addresses || []).map((a: any) => (
                <div key={a.id} className="p-3 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold">{a.label}</span> {a.isDefault && <span className="text-[#00552B] dark:text-[#C6A667] font-semibold">({t('Mặc định', 'Default')})</span>}
                    <p className="text-[#202020]/75 dark:text-[#F1EFEA]/75 mt-0.5">{a.addressLine}</p>
                  </div>
                  {!a.isDefault && (
                    <button type="button" onClick={() => setDefaultAddress(a.id)} className="text-[#00552B] dark:text-[#C6A667] underline cursor-pointer shrink-0">
                      {t('Đặt mặc định', 'Set Default')}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={addAddress} className="space-y-2 pt-2 border-t border-[#202020]/10 dark:border-white/10">
              <input type="text" value={newAddressLabel} onChange={(e) => setNewAddressLabel(e.target.value)} placeholder={t('Nhãn (vd: Nhà riêng / Công ty)', 'Label (Home / Office)')} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2 text-xs" />
              <input type="text" required value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} placeholder={t('Địa chỉ đầy đủ...', 'Full delivery address...')} className="w-full border border-[#202020]/15 dark:border-white/15 dark:bg-[#0E1512] rounded px-3 py-2 text-xs" />
              <button type="submit" className="px-4 py-2 bg-[#00552B] text-white text-xs font-semibold rounded cursor-pointer">
                {t('Thêm địa chỉ', 'Add Address')}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-4 text-sm">
            <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> {t('Quyền riêng tư & Dữ liệu', 'Privacy & Account Deletion')}</h2>
            <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">
              {t(
                'Bạn có thể gửi yêu cầu xóa dữ liệu tài khoản bất cứ lúc nào theo chính sách bảo mật.',
                'You may submit a formal account deletion request at any time.'
              )}
            </p>
            {dash.user.deletion_requested ? (
              <p className="text-xs font-semibold text-amber-600">{t('Yêu cầu xóa tài khoản đang được xử lý.', 'Account deletion request recorded.')}</p>
            ) : (
              <button type="button" onClick={requestAccountDeletion} className="px-4 py-2 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer">
                {t('Yêu cầu xóa tài khoản', 'Request Account Deletion')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
