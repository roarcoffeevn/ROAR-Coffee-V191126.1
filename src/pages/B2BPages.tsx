import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, Coffee, Globe2, Package } from 'lucide-react';
import { AdminPageEditLink } from '../components/AdminPageEditBar';
import { B2BInquiryModal } from '../components/B2BInquiryModal';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const PartnersPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { cmsPages } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'wholesale_partner' | 'green_quotation' | 'sample_request'>('wholesale_partner');

  const page = cmsPages['partners'];
  const j1 = page?.sections?.[0];
  const j2 = page?.sections?.[1];

  const j1Bullets = ((lang === 'vi' ? j1?.tag_vi : j1?.tag_en) || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const j2Bullets = ((lang === 'vi' ? j2?.tag_vi : j2?.tag_en) || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const eyebrow =
    (lang === 'vi' ? page?.eyebrow_vi : page?.eyebrow_en) ||
    t('Cổng Thương Mại B2B & Phân Phối', 'B2B Wholesale & Distribution Portal');
  const title =
    (lang === 'vi' ? page?.title_vi : page?.title_en) ||
    t('Hợp Tác Kinh Doanh Cùng ROAR COFFEE', 'Partner with ROAR COFFEE');
  const body =
    (lang === 'vi' ? page?.body_vi : page?.body_en) ||
    t(
      'Thiết kế hai hành trình thương mại chuyên biệt cho đối tác Cà phê Rang xay (HORECA, Quán cà phê, Nhà phân phối, Siêu thị) và đối tác Cà phê Nhân xanh (Nhà rang, Nhà sản xuất, Đơn vị xuất nhập khẩu).',
      'Two distinct commercial pathways tailored separately for Roasted Coffee buyers (HORECA, cafes, retailers, distributors) and Green Coffee buyers (roasters, manufacturers, importers, and traders).'
    );

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-14 space-y-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {title}
          </h1>
          <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {body}
          </p>
        </div>
        <AdminPageEditLink slug="partners" />
      </div>

      {/* Two Distinct Commercial Sales Journeys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Coffee className="w-7 h-7 text-[#00552B] dark:text-[#C6A667]" />
            <h2 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {(lang === 'vi' ? j1?.title_vi : j1?.title_en) ||
                t('Hành trình 01 · Bán sỉ Cà phê Rang xay & HORECA', 'Journey 01 · Roasted Coffee Wholesale & HORECA')}
            </h2>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {(lang === 'vi' ? j1?.body_vi : j1?.body_en) ||
                t(
                  'Dành cho chuỗi quán cà phê, nhà hàng, khách sạn, văn phòng và nhà bán lẻ tìm nguồn cung Robusta House Blend, Arabica Selection, Đậm, Phin, Espresso Gold và Signature Reserve.',
                  'Built for coffee shops, hotels, restaurants, supermarkets, and distributors seeking Robusta House Blend, Arabica Selection, Espresso Gold, or Signature Reserve.'
                )}
            </p>
            <ul className="space-y-2 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80">
              {(j1Bullets.length
                ? j1Bullets
                : [
                    t('Đăng ký tài khoản đối tác & xác minh doanh nghiệp', 'Partner registration & business verification'),
                    t('Bảng giá sỉ theo sản lượng định kỳ', 'Volume-based partner pricing tiers'),
                    t('Gửi mẫu thử rang xay & hỗ trợ công thức pha chế', 'Sample kits & barista recipe calibration'),
                  ]
              ).map((bullet) => (
                <li key={bullet} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setModalType('wholesale_partner');
                setModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#00552B] text-white text-xs font-semibold rounded hover:bg-[#003D25] cursor-pointer"
            >
              {t('Đăng ký Đối tác Bán sỉ / HORECA', 'Register Wholesale / HORECA')}
            </button>
            <Link to={localePath('/coffee/roasted')} className="px-5 py-2.5 border border-[#202020]/20 dark:border-white/20 text-xs font-medium rounded">
              {t('Xem danh mục Rang xay', 'View Roasted Catalog')}
            </Link>
          </div>
        </div>

        <div className="bg-[#003D25] text-white rounded-2xl p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Package className="w-7 h-7 text-[#C6A667]" />
            <h2 className="text-2xl font-bold">
              {(lang === 'vi' ? j2?.title_vi : j2?.title_en) ||
                t('Hành trình 02 · Thương mại Cà phê Nhân xanh B2B', 'Journey 02 · Commercial Green Coffee Trading')}
            </h2>
            <p className="text-sm text-[#F8F5EF]/80 leading-relaxed">
              {(lang === 'vi' ? j2?.body_vi : j2?.body_en) ||
                t(
                  'Dành cho xưởng rang, nhà sản xuất cà phê hòa tan và đơn vị thương mại cần Robusta, Arabica, Culi cỡ sàng S14/S16/S18 (Natural, Honey, CBU) đóng bao 30kg, 60kg, 69kg hoặc Big Bag 1.000kg.',
                  'Engineered for commercial roasters, industrial buyers, and importers sourcing Robusta, Arabica, and Culi across S14/S16/S18 (Natural, Honey, CBU) in 30kg, 60kg, 69kg, or 1,000kg Big Bags.'
                )}
            </p>
            <ul className="space-y-2 text-xs text-[#F8F5EF]/85">
              {(j2Bullets.length
                ? j2Bullets
                : [
                    t('27 tổ hợp cấu hình chuẩn hóa theo mã SKU', '27-SKU standardized grading architecture'),
                    t('Yêu cầu mẫu xanh đánh giá thử nếm trước hợp đồng', 'Pre-contract green sample evaluation'),
                    t('Đơn hàng số lượng lớn, Container & Hợp đồng dài hạn', 'Bulk, container-load, and contract quotations'),
                  ]
              ).map((bullet) => (
                <li key={bullet} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C6A667]" /> {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={localePath('/coffee/green-beans')} className="px-5 py-2.5 bg-[#C6A667] text-[#111111] text-xs font-semibold rounded hover:bg-[#d4b67a]">
              {t('Mở Ma trận Nhân xanh 27 SKUs', 'Open Green Bean Matrix')}
            </Link>
            <button
              type="button"
              onClick={() => {
                setModalType('green_quotation');
                setModalOpen(true);
              }}
              className="px-5 py-2.5 border border-white/30 text-white text-xs font-medium rounded hover:bg-white/10 cursor-pointer"
            >
              {t('Yêu cầu Báo giá Nhân xanh', 'Request Green Quote')}
            </button>
          </div>
        </div>
      </div>

      <B2BInquiryModal open={modalOpen} onClose={() => setModalOpen(false)} defaultType={modalType} />
    </div>
  );
};

export const OemExportPage: React.FC = () => {
  const { lang, t } = useI18n();
  const { cmsPages, showToast } = useStore();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [serviceType, setServiceType] = useState<'oem_private_label' | 'export_inquiry'>('oem_private_label');
  const [volume, setVolume] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const page = cmsPages['oem-export'];
  const defaultCaps = [
    { icon: Globe2, title_vi: 'Tìm nguồn Nhân xanh', title_en: 'Green Coffee Sourcing', body_vi: 'Triển khai linh hoạt theo MOQ và thông số kỹ thuật đã thống nhất.', body_en: 'Configured per agreed MOQ and verified project specifications.' },
    { icon: Coffee, title_vi: 'Gia công Rang chuẩn hóa', title_en: 'Contract Roasting', body_vi: 'Triển khai linh hoạt theo MOQ và thông số kỹ thuật đã thống nhất.', body_en: 'Configured per agreed MOQ and verified project specifications.' },
    { icon: Package, title_vi: 'Đóng gói Private Label', title_en: 'Private Label Packaging', body_vi: 'Triển khai linh hoạt theo MOQ và thông số kỹ thuật đã thống nhất.', body_en: 'Configured per agreed MOQ and verified project specifications.' },
    { icon: Building2, title_vi: 'Hỗ trợ Chứng từ Xuất khẩu', title_en: 'Export Documentation Support', body_vi: 'Triển khai linh hoạt theo MOQ và thông số kỹ thuật đã thống nhất.', body_en: 'Configured per agreed MOQ and verified project specifications.' },
  ];
  const icons = [Globe2, Coffee, Package, Building2];
  const capCards = page?.sections?.length
    ? page.sections.map((s, idx) => ({ ...s, icon: icons[idx % icons.length] }))
    : defaultCaps;

  const eyebrow =
    (lang === 'vi' ? page?.eyebrow_vi : page?.eyebrow_en) ||
    t('Gia công OEM · Nhãn hiệu riêng · Xuất khẩu', 'OEM · Private Label · Export');
  const title =
    (lang === 'vi' ? page?.title_vi : page?.title_en) ||
    t('Dịch Vụ Gia Công OEM, Nhãn Hiệu Riêng & Xuất Khẩu', 'OEM, Private Label & International Export');
  const body =
    (lang === 'vi' ? page?.body_vi : page?.body_en) ||
    t(
      'Hỗ trợ đối tác quốc tế và thương hiệu nội địa từ khâu tìm nguồn nhân xanh, phát triển hồ sơ rang, đóng gói theo yêu cầu đến phối hợp chứng từ xuất khẩu khi được xác thực.',
      'Supporting international importers and private-label brands across green sourcing, roast profiling, custom packaging, MOQ planning, and verified export documentation support.'
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/b2b/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inquiryType: serviceType,
        companyName,
        contactName,
        email,
        phone,
        country,
        estimatedVolume: volume,
        message,
      }),
    });
    if (res.ok) {
      setSent(true);
      showToast(t('Đã gửi hồ sơ yêu cầu OEM / Xuất khẩu.', 'OEM / Export inquiry submitted.'));
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-14 space-y-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {title}
          </h1>
          <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {body}
          </p>
        </div>
        <AdminPageEditLink slug="oem-export" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {capCards.map((s, idx) => {
          const IconComp = s.icon;
          return (
            <div key={`${s.title_en}-${idx}`} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 space-y-2">
              <IconComp className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
              <h2 className="text-base font-bold text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? s.title_vi : s.title_en}</h2>
              <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {lang === 'vi' ? s.body_vi : s.body_en}
              </p>
            </div>
          );
        })}
      </div>

      <section id="export" className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA] mb-6">{t('Gửi Yêu Cầu Dự Án OEM / Xuất Khẩu', 'Submit Business & Export Inquiry')}</h2>
        {sent ? (
          <div className="p-6 bg-[#00552B]/8 dark:bg-[#00552B]/30 rounded-xl text-sm text-[#003D25] dark:text-[#C6A667]">
            {t('Cảm ơn Quý đối tác. Yêu cầu đã được lưu vào hệ thống CRM nội bộ của ROAR COFFEE.', 'Thank you. Your inquiry has been recorded in our B2B portal.')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Nhu cầu hợp tác', 'Service Category')}</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value as any)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2">
                <option value="oem_private_label">{t('Gia công OEM / Nhãn hiệu riêng', 'OEM / Private Label')}</option>
                <option value="export_inquiry">{t('Xuất khẩu cà phê (Nhân xanh / Rang xay / Hòa tan)', 'International Export Inquiry')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Thị trường / Quốc gia *', 'Destination Country *')}</label>
              <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Tên công ty *', 'Company Name *')}</label>
              <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Người liên hệ *', 'Contact Name *')}</label>
              <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Số điện thoại / WhatsApp *', 'Phone / WhatsApp *')}</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Sản lượng dự kiến / MOQ', 'Estimated MOQ / Volume')}</label>
              <input type="text" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 mb-1">{t('Mô tả thông số sản phẩm & đóng gói *', 'Product & Packaging Specifications *')}</label>
              <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="px-6 py-3 bg-[#00552B] text-white text-sm font-semibold rounded hover:bg-[#003D25] cursor-pointer">
                {t('Gửi Yêu Cầu Dự Án', 'Submit Inquiry')}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { lang, t } = useI18n();
  const { settings, cmsPages, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const page = cmsPages['contact'];
  const eyebrow = (lang === 'vi' ? page?.eyebrow_vi : page?.eyebrow_en) || t('Liên hệ', 'Contact');
  const title = (lang === 'vi' ? page?.title_vi : page?.title_en) || t('Kết Nối Với ROAR COFFEE', 'Connect with ROAR COFFEE');
  const body = lang === 'vi' ? page?.body_vi : page?.body_en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/b2b/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inquiryType: 'contact',
        contactName: name,
        email,
        phone,
        message,
      }),
    });
    if (res.ok) {
      setSent(true);
      showToast(t('Đã gửi tin nhắn liên hệ.', 'Message sent successfully.'));
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
      <div className="md:col-span-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">{eyebrow}</p>
          <AdminPageEditLink slug="contact" />
        </div>
        <h1 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">{title}</h1>
        {body && (
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">{body}</p>
        )}
        <div className="space-y-3 text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80 pt-2">
          <p><strong>{t('Khách hàng cá nhân:', 'General & Retail:')}</strong> {settings.contact_email || 'hello@roarcoffee.vn'}</p>
          <p><strong>{t('Thương mại B2B & Xuất khẩu:', 'B2B & Export:')}</strong> {settings.b2b_email || 'b2b@roarcoffee.vn'}</p>
          <p><strong>{t('Văn phòng:', 'Location:')}</strong> {lang === 'vi' ? settings.office_address_vi : settings.office_address_en}</p>
        </div>
      </div>

      <div className="md:col-span-7 bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8">
        {sent ? (
          <p className="text-sm text-[#00552B] dark:text-[#C6A667] font-medium">{t('Cảm ơn bạn đã liên hệ ROAR COFFEE.', 'Thank you for contacting ROAR COFFEE.')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1">{t('Họ và tên *', 'Full Name *')}</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('Số điện thoại *', 'Phone *')}</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('Nội dung *', 'Message *')}</label>
              <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-white dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2" />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-[#00552B] text-white font-semibold rounded hover:bg-[#003D25] cursor-pointer">
              {t('Gửi tin nhắn', 'Send Message')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const LegalPage: React.FC<{ doc: 'privacy' | 'terms' | 'shipping' }> = ({ doc }) => {
  const { lang, t } = useI18n();
  const { cmsPages } = useStore();
  const page = cmsPages[doc];

  const fallbackTitles = {
    privacy: t('Chính sách Bảo mật', 'Privacy Policy'),
    terms: t('Điều khoản Sử dụng', 'Terms & Conditions'),
    shipping: t('Chính sách Giao hàng & Đổi trả', 'Shipping & Returns'),
  };

  const title = (lang === 'vi' ? page?.title_vi : page?.title_en) || fallbackTitles[doc];
  const subtitle = lang === 'vi' ? page?.subtitle_vi : page?.subtitle_en;
  const rawBody =
    (lang === 'vi' ? page?.body_vi : page?.body_en) ||
    (doc === 'privacy'
      ? t(
          'Tài liệu chính sách pháp lý và quy định thương mại chính thức của ROAR COFFEE được cập nhật và rà soát đầy đủ trước khi vận hành thương mại chính thức.\n\nTài khoản thành viên có quyền chỉnh sửa thông tin, quản lý tùy chọn thông báo và gửi yêu cầu xóa tài khoản trực tiếp tại trang Tài khoản cá nhân.',
          'Official ROAR COFFEE legal policies and commercial terms are structured for compliance and finalized prior to commercial launch.\n\nRegistered members may update personal profiles, adjust communication preferences, and submit account deletion requests directly from their Account portal.'
        )
      : doc === 'shipping'
        ? t(
            'Tài liệu chính sách pháp lý và quy định thương mại chính thức của ROAR COFFEE được cập nhật và rà soát đầy đủ trước khi vận hành thương mại chính thức.\n\nĐơn hàng bán lẻ được áp dụng vận chuyển tiêu chuẩn toàn quốc. Đơn hàng cà phê nhân xanh B2B áp dụng giao nhận theo điều kiện thương mại thống nhất (EXW / FOB / CIF).',
            'Official ROAR COFFEE legal policies and commercial terms are structured for compliance and finalized prior to commercial launch.\n\nRetail orders ship via standard domestic couriers. B2B green coffee orders follow agreed commercial Incoterms and packaging specifications.'
          )
        : t(
            'Tài liệu chính sách pháp lý và quy định thương mại chính thức của ROAR COFFEE được cập nhật và rà soát đầy đủ trước khi vận hành thương mại chính thức.\n\nMọi thông tin thông số kỹ thuật, niên vụ và giá bán tham chiếu tuân thủ quy trình xác thực dữ liệu của ROAR COFFEE.',
            'Official ROAR COFFEE legal policies and commercial terms are structured for compliance and finalized prior to commercial launch.\n\nAll product specifications, harvest details, and promotional terms remain governed by verified ROAR COFFEE commercial schedules.'
          ));

  const paragraphs = rawBody.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="max-w-[820px] mx-auto px-6 py-14 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {(lang === 'vi' ? page?.eyebrow_vi : page?.eyebrow_en) || t('Pháp lý & Tuân thủ', 'Legal & Compliance')}
          </p>
          <h1 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">{title}</h1>
          {subtitle && <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">{subtitle}</p>}
        </div>
        <AdminPageEditLink slug={doc} />
      </div>

      <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8 space-y-4 text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="whitespace-pre-line">{p}</p>
        ))}

        {page?.sections && page.sections.length > 0 && (
          <div className="pt-4 border-t border-[#202020]/10 dark:border-white/10 space-y-4">
            {page.sections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <h2 className="text-base font-bold text-[#00552B] dark:text-[#C6A667]">{lang === 'vi' ? sec.title_vi : sec.title_en}</h2>
                <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 whitespace-pre-line">
                  {lang === 'vi' ? sec.body_vi : sec.body_en}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
