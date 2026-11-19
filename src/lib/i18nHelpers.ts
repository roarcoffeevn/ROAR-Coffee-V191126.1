import type { Lang } from '../i18n/I18nContext';

const VARIANT_VI_MAP: Record<string, string> = {
  '250g · Whole Bean': '250g · Hạt nguyên chất',
  '250g · Phin Ground': '250g · Xay pha Phin',
  '500g · Whole Bean': '500g · Hạt nguyên chất',
  '1kg · HORECA Pack': '1kg · Gói chuyên dụng quán (HORECA)',
  '250g · Filter Ground': '250g · Xay pha giấy lọc',
  '1kg · Barista Pack': '1kg · Gói Barista 1kg',
  '250g · Signature Tin (Whole Bean)': '250g · Hộp thiếc Signature (Hạt nguyên chất)',
  '500g · Obsidian Gift Box': '500g · Hộp quà Đen Tuyền 500g',
  'Corporate Gift Set (2 x 250g)': 'Bộ quà Doanh nghiệp (2 × 250g)',
  '500g · Phin Ground': '500g · Xay pha Phin',
  '250g · Espresso Fine Ground': '250g · Xay mịn Espresso',
  '250g · Whole Bean (Gold)': '250g · Hạt nguyên chất (Gold)',
  '500g · Whole Bean (Gold)': '500g · Hạt nguyên chất (Gold)',
  '1kg · HORECA Gold Pack': '1kg · Gói HORECA Gold 1kg',
  'Box 10 Sticks (Configurable Spec)': 'Hộp 10 gói hòa tan',
  'Box 20 Sticks (Configurable Spec)': 'Hộp 20 gói hòa tan',
  'Gold Box 10 Sticks (Configurable Spec)': 'Hộp Gold 10 gói hòa tan',
  'Gold Box 20 Sticks (Configurable Spec)': 'Hộp Gold 20 gói hòa tan',
  'Sample 1kg (Đánh giá mẫu)': 'Mẫu thử 1kg (Đánh giá mẫu)',
  '30kg Bag (Báo giá theo kg)': 'Bao 30kg (Báo giá theo kg)',
  '60kg Jute / PP Bag': 'Bao đay / PP 60kg',
  '69kg Export Bag': 'Bao xuất khẩu 69kg',
  '1,000kg Big Bag (Container / Contract)': 'Bao lớn 1.000kg (Container / Hợp đồng)',
  Standard: 'Tiêu chuẩn',
};

export function localizeVariantLabel(label: string, lang: Lang): string {
  if (lang === 'en') {
    return label.replace(/Sỉ:\s*≥\s*100\s*kg/gi, 'Wholesale: ≥100 kg');
  }
  return VARIANT_VI_MAP[label] || label;
}

const ORDER_STATUS_VI: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Processing: 'Đang xử lý',
  Shipping: 'Đang giao hàng',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã hủy',
  Returned: 'Hoàn trả',
};

export function localizeOrderStatus(status: string, lang: Lang): string {
  if (lang === 'en') return status;
  return ORDER_STATUS_VI[status] || status;
}

const PAYMENT_STATUS_VI: Record<string, string> = {
  awaiting_payment: 'Chờ thanh toán',
  pending_verification: 'Chờ đối soát QR / Ví',
  paid: 'Đã thanh toán',
  confirmed_demo: 'Đã thanh toán (Dữ liệu mẫu)',
  refunded: 'Đã hoàn tiền',
};

export function localizePaymentStatus(status: string, lang: Lang): string {
  if (lang === 'en') {
    const mapEn: Record<string, string> = {
      awaiting_payment: 'Awaiting Payment',
      pending_verification: 'Pending QR / Transfer Verification',
      paid: 'Paid',
      confirmed_demo: 'Paid (Demo)',
      refunded: 'Refunded',
    };
    return mapEn[status] || status;
  }
  return PAYMENT_STATUS_VI[status] || status;
}

const JOURNAL_CAT_VI: Record<string, string> = {
  'Coffee processing': 'Sơ chế & Chế biến',
  'Coffee varieties': 'Giống & Phân loại hạt',
  'Brewing techniques': 'Kỹ thuật Pha chế',
  'Coffee knowledge': 'Kiến thức Cà phê',
  'Coffee origins': 'Vùng Nguyên liệu',
};

export function localizeJournalCategory(category: string, lang: Lang): string {
  if (lang === 'en') return category;
  return JOURNAL_CAT_VI[category] || category;
}

const BREW_METHOD_VI: Record<string, string> = {
  'Vietnamese Phin': 'Phin Việt Nam',
  Espresso: 'Máy pha Espresso',
  'Moka Pot': 'Ấm Moka Pot',
  'Pour-over': 'Pha giấy lọc (Pour-over)',
  'French Press': 'Bình ép Pháp (French Press)',
  'Cold Brew': 'Ủ lạnh (Cold Brew)',
  'Iced Milk Coffee': 'Cà phê Sữa Đá',
  'Hot Water (70–80°C)': 'Nước nóng (70–80°C)',
  'Iced Coffee': 'Cà phê Đá',
  'Commercial Roasting': 'Rang thương mại',
  'Sample Roasting': 'Rang thử mẫu',
  'Export Blending': 'Phối trộn xuất khẩu',
};

export function localizeBrewingMethod(method: string, lang: Lang): string {
  if (lang === 'en') return method;
  return BREW_METHOD_VI[method] || method;
}

const COFFEE_TYPE_VI: Record<string, string> = {
  '100% Robusta': '100% Robusta',
  '100% Arabica': '100% Arabica',
  '60% Robusta · 20% Culi · 20% Arabica': '60% Robusta · 20% Culi · 20% Arabica',
  'Proprietary Blend': 'Phối trộn Độc quyền',
  'Proprietary Phin Blend': 'Phối trộn Pha Phin Độc quyền',
  'Proprietary Espresso Blend': 'Phối trộn Espresso Độc quyền',
  'Premium Espresso Gold Blend': 'Phối trộn Espresso Gold Cao cấp',
  'Instant Coffee Blend': 'Cà phê Hòa tan Phối trộn',
  'Premium Instant Coffee': 'Cà phê Hòa tan Cao cấp',
  'Culi / Peaberry': 'Culi (Hạt tròn)',
  'Custom Blend': 'Phối trộn Tùy chỉnh',
};

export function localizeCoffeeType(type: string, lang: Lang): string {
  if (lang === 'en') return type;
  return COFFEE_TYPE_VI[type] || type;
}

const LEDGER_ENTRY_VI: Record<string, string> = {
  earn_pending: 'Điểm chờ duyệt',
  earn_available: 'Cộng điểm khả dụng',
  redeem: 'Quy đổi điểm',
  reverse: 'Hoàn trừ điểm',
  expire: 'Hết hạn điểm',
  admin_adjustment: 'Quản trị viên điều chỉnh',
};

export function localizeLedgerEntry(entryType: string, lang: Lang): string {
  if (lang === 'en') return entryType;
  return LEDGER_ENTRY_VI[entryType] || entryType;
}

const B2B_TYPE_VI: Record<string, string> = {
  sample_request: 'Yêu cầu mẫu thử',
  green_quotation: 'Báo giá nhân xanh',
  wholesale_partner: 'Đối tác bán sỉ',
  horeca: 'Nhà hàng / Khách sạn / Quán',
  oem_private_label: 'Gia công OEM / Nhãn riêng',
  export_inquiry: 'Yêu cầu Xuất khẩu',
  corporate_gifting: 'Quà tặng Doanh nghiệp',
  contact: 'Liên hệ chung',
};

export function localizeB2BType(type: string, lang: Lang): string {
  if (lang === 'en') return type;
  return B2B_TYPE_VI[type] || type;
}
