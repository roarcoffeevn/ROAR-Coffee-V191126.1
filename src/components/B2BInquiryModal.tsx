import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

interface B2BInquiryModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: 'sample_request' | 'green_quotation' | 'wholesale_partner' | 'oem_private_label' | 'export_inquiry' | 'corporate_gifting';
  productSku?: string;
  productTitle?: string;
}

export const B2BInquiryModal: React.FC<B2BInquiryModalProps> = ({
  open,
  onClose,
  defaultType = 'green_quotation',
  productSku = '',
  productTitle = '',
}) => {
  const { t } = useI18n();
  const { showToast, user } = useStore();

  const [inquiryType, setInquiryType] = useState(defaultType);
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState('Vietnam');
  const [packagingOption, setPackagingOption] = useState('60kg');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [message, setMessage] = useState(productTitle ? `${t('Quan tâm sản phẩm', 'Inquiry regarding')}: ${productTitle} (${productSku})` : '');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/b2b/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryType,
          companyName,
          contactName,
          email,
          phone,
          country,
          productSku,
          packagingOption,
          estimatedVolume,
          message,
        }),
      });
      if (res.ok) {
        showToast(t('Đã ghi nhận yêu cầu B2B. Đội ngũ thương mại sẽ phản hồi sớm nhất.', 'B2B inquiry recorded. Our commercial team will respond promptly.'));
        onClose();
      } else {
        const d = await res.json();
        showToast(d.error || t('Không thể gửi yêu cầu.', 'Unable to submit inquiry.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#16221C] rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-transparent dark:border-white/10">
        <div className="flex items-center justify-between pb-3 border-b border-[#202020]/10 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
              {inquiryType === 'sample_request'
                ? t('Yêu Cầu Gửi Mẫu Cà Phê', 'Request a Coffee Sample')
                : t('Yêu Cầu Báo Giá & Hợp Tác B2B', 'Request a B2B Quotation')}
            </h3>
            {productSku && <p className="text-xs font-mono text-[#00552B] dark:text-[#C6A667] mt-0.5">{productSku}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-[#202020]/60 dark:text-[#F1EFEA]/60 hover:text-[#202020] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">
              {t('Loại yêu cầu', 'Inquiry Type')}
            </label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value as any)}
              className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2 bg-[#F8F5EF]/50"
            >
              <option value="sample_request">{t('Yêu cầu mẫu thử', 'Sample Request')}</option>
              <option value="green_quotation">{t('Báo giá cà phê nhân xanh', 'Green Coffee Quotation')}</option>
              <option value="wholesale_partner">{t('Bán sỉ cà phê rang / Quán (HORECA)', 'Roasted Wholesale / HORECA')}</option>
              <option value="oem_private_label">{t('Gia công OEM / Nhãn hiệu riêng', 'OEM / Private Label')}</option>
              <option value="export_inquiry">{t('Yêu cầu xuất khẩu / Container', 'Export / Container Inquiry')}</option>
              <option value="corporate_gifting">{t('Quà tặng doanh nghiệp', 'Corporate Gifting')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Họ và tên *', 'Contact Name *')}</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Công ty / Quán', 'Company / Business')}</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Số điện thoại *', 'Phone *')}</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Quy cách đóng gói', 'Packaging')}</label>
              <select
                value={packagingOption}
                onChange={(e) => setPackagingOption(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              >
                <option value="Sample 1kg">{t('Mẫu thử 1kg', 'Sample 1kg')}</option>
                <option value="30kg">{t('Bao 30kg', '30kg Bag')}</option>
                <option value="60kg">{t('Bao 60kg', '60kg Bag')}</option>
                <option value="69kg">{t('Bao xuất khẩu 69kg', '69kg Export Bag')}</option>
                <option value="1,000kg Big Bag">{t('Bao lớn 1.000kg (Container)', '1,000kg Big Bag')}</option>
                <option value="Custom Retail / OEM">{t('Gia công OEM / Đóng gói riêng', 'Custom / OEM')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Sản lượng dự kiến', 'Est. Volume')}</label>
              <input
                type="text"
                value={estimatedVolume}
                onChange={(e) => setEstimatedVolume(e.target.value)}
                placeholder={t('vd: 500kg / 1 container 20ft', 'e.g. 500kg / 1 FCL')}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Quốc gia / Thị trường', 'Market / Country')}</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-1">{t('Nội dung yêu cầu *', 'Details & Specifications *')}</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] rounded px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#202020]/15 dark:border-white/15 rounded text-sm text-[#202020] dark:text-[#F1EFEA] cursor-pointer"
            >
              {t('Hủy', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#00552B] text-white rounded text-sm font-medium hover:bg-[#003D25] cursor-pointer disabled:opacity-60"
            >
              {submitting ? t('Đang gửi...', 'Submitting...') : t('Gửi yêu cầu', 'Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
