import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdaptiveLogo } from './AdaptiveLogo';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { lang, setLang, t, localePath } = useI18n();
  const { settings, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), lang }),
      });
      if (res.ok) {
        setEmail('');
        showToast(t('Đã đăng ký nhận bản tin ROAR COFFEE.', 'Subscribed to ROAR COFFEE updates.'));
      } else {
        showToast(t('Vui lòng nhập địa chỉ email hợp lệ.', 'Please enter a valid email address.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#003D25] text-[#F8F5EF] pb-20 lg:pb-0">
      <div className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 border-b border-white/10">
        {/* Brand Column with Adaptive Logo (vertical on desktop, horizontal on mobile) */}
        <div className="lg:col-span-4 space-y-5">
          <AdaptiveLogo variant="auto" surface="dark" size="sm" />
          <p className="text-xs tracking-[0.16em] uppercase text-[#C6A667] font-medium">
            {lang === 'vi'
              ? settings.tagline_vi || 'KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.'
              : settings.tagline_en || 'IGNITING COURAGE. DEFINING CHARACTER.'}
          </p>
          <p className="text-sm text-[#F8F5EF]/75 leading-relaxed max-w-sm">
            {t(
              'Thương hiệu cà phê Việt Nam kết nối bản sắc vùng nguyên liệu Tây Nguyên, quy chuẩn nhân xanh chuyên nghiệp và trải nghiệm thưởng thức đương đại.',
              'A distinctive Vietnamese coffee brand uniting authentic highland origins, disciplined green bean sourcing, and modern coffee culture.'
            )}
          </p>

          <form onSubmit={handleSubscribe} className="pt-2 space-y-2 max-w-sm">
            <label htmlFor="footer-newsletter" className="block text-xs font-medium text-[#F8F5EF]/90">
              {t('Đăng ký Bản tin Cà phê & Lô thu hoạch mới', 'Subscribe for Roast Releases & Harvest Notes')}
            </label>
            <div className="flex gap-2">
              <input
                id="footer-newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-[#C6A667]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#C6A667] text-[#111111] text-xs font-semibold rounded hover:bg-[#d4b67a] transition-colors cursor-pointer disabled:opacity-60"
              >
                {t('Đăng ký', 'Join')}
              </button>
            </div>
          </form>
        </div>

        {/* Products */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A667]">
            {t('Sản phẩm', 'Products')}
          </h3>
          <ul className="space-y-2 text-sm text-[#F8F5EF]/80">
            <li>
              <Link to={localePath('/coffee/roasted')} className="hover:text-white">
                {t('Cà phê rang xay', 'Roasted Coffee')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/product/robusta-house-blend')} className="hover:text-white">
                Robusta House Blend
              </Link>
            </li>
            <li>
              <Link to={localePath('/product/arabica-selection')} className="hover:text-white">
                Arabica Selection
              </Link>
            </li>
            <li>
              <Link to={localePath('/product/roar-espresso')} className="hover:text-white">
                ROAR Espresso
              </Link>
            </li>
            <li>
              <Link to={localePath('/product/roar-espresso-gold')} className="hover:text-white">
                ROAR Espresso Gold
              </Link>
            </li>
            <li>
              <Link to={localePath('/signature-reserve')} className="hover:text-white">
                Signature Reserve
              </Link>
            </li>
            <li>
              <Link to={localePath('/coffee/roasted-beans')} className="hover:text-white font-medium text-[#C6A667]">
                {t('Cà phê Hạt rang (Giá theo kg)', 'Roasted Coffee Beans')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/coffee/green-beans')} className="hover:text-white">
                {t('Cà phê nhân xanh', 'Green Coffee Beans')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/coffee/instant')} className="hover:text-white">
                {t('Cà phê hòa tan', 'Instant Coffee')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Brand & Discovery */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A667]">
            {t('Khám phá', 'Discover')}
          </h3>
          <ul className="space-y-2 text-sm text-[#F8F5EF]/80">
            <li>
              <Link to={localePath('/about')} className="hover:text-white">
                {t('Về ROAR COFFEE', 'About ROAR COFFEE')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/personalities')} className="hover:text-white">
                {t('7 Cá Tính Thương Hiệu', 'Seven Personalities')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/origins')} className="hover:text-white">
                {t('Vùng Nguyên Liệu', 'Coffee Origins Map')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/farm-to-cup')} className="hover:text-white">
                {t('Từ Nông Trại Đến Tách', 'From Farm to Cup')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/brewing')} className="hover:text-white">
                {t('Hướng dẫn pha chế', 'Brewing Guide')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/journal')} className="hover:text-white">
                {t('Tạp chí cà phê', 'Coffee Journal')}
              </Link>
            </li>
          </ul>
        </div>

        {/* B2B & Customer Care */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A667]">
            {t('Đối tác & Dịch vụ', 'Partners & Care')}
          </h3>
          <ul className="space-y-2 text-sm text-[#F8F5EF]/80">
            <li>
              <Link to={localePath('/partners')} className="hover:text-white">
                {t('Bán sỉ & HORECA', 'Wholesale & HORECA')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/oem-export')} className="hover:text-white">
                {t('Gia công OEM, Nhãn riêng & Xuất khẩu', 'OEM / Private Label / Export')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/account')} className="hover:text-white">
                {t('Thành viên ROAR COFFEE', 'ROAR COFFEE Members')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/orders/track')} className="hover:text-white">
                {t('Tra cứu đơn hàng', 'Track Order')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/shipping')} className="hover:text-white">
                {t('Giao hàng & Đổi trả', 'Shipping & Returns')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/privacy')} className="hover:text-white">
                {t('Chính sách bảo mật', 'Privacy Policy')}
              </Link>
            </li>
            <li>
              <Link to={localePath('/terms')} className="hover:text-white">
                {t('Điều khoản sử dụng', 'Terms & Conditions')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A667]">
            {t('Liên hệ', 'Contact')}
          </h3>
          <div className="space-y-2 text-sm text-[#F8F5EF]/80">
            <p>{settings.contact_email || 'hello@roarcoffee.vn'}</p>
            <p>{settings.b2b_email || 'b2b@roarcoffee.vn'}</p>
            <p className="text-xs text-[#F8F5EF]/60">
              {lang === 'vi'
                ? settings.office_address_vi || 'TP. Hồ Chí Minh, Việt Nam'
                : settings.office_address_en || 'Ho Chi Minh City, Vietnam'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap gap-3 text-xs text-[#F8F5EF]/75">
            <Link to={localePath('/contact')} className="underline underline-offset-4 hover:text-white">
              {t('Gửi yêu cầu liên hệ', 'Contact Form')}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Legal + Language + Discreet CMS link */}
      <div className="max-w-[1280px] mx-auto px-6 sm:pr-20 lg:pr-24 pt-5 pb-24 lg:pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F8F5EF]/60">
        <p>© {new Date().getFullYear()} ROAR COFFEE®. {t('Bảo lưu mọi quyền.', 'All rights reserved.')}</p>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang('vi')}
              className={`cursor-pointer ${lang === 'vi' ? 'text-white font-semibold' : 'hover:text-white'}`}
            >
              Tiếng Việt
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`cursor-pointer ${lang === 'en' ? 'text-white font-semibold' : 'hover:text-white'}`}
            >
              English
            </button>
          </div>

          <span className="opacity-30">|</span>

          <Link
            to="/admin"
            className="text-[11px] tracking-wide text-[#F8F5EF]/55 hover:text-[#F8F5EF]/90 transition-colors"
          >
            {t('Quản trị Website (CMS)', 'CMS Admin')}
          </Link>
        </div>
      </div>
    </footer>
  );
};
