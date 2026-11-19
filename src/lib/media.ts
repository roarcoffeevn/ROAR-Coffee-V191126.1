import heroRoarCoffee from '../assets/images/hero_roar_coffee_1794800571279.jpg';
import heroSignatureReserveBanner from '../assets/images/hero_signature_reserve_banner_1794802732903.jpg';
import heroHighlandHarvestBanner from '../assets/images/hero_highland_harvest_banner_1794802732989.jpg';
import productRobustaHouse from '../assets/images/product_robusta_house_1794800572896.jpg';
import productArabicaSelection from '../assets/images/product_arabica_selection_1794800572345.jpg';
import productSignatureReserve from '../assets/images/product_signature_reserve_1794800571854.jpg';
import productInstantSilverGold from '../assets/images/product_instant_silver_gold_1794800573232.jpg';
import productGreenCoffeeBeans from '../assets/images/product_green_coffee_beans_1794800574134.jpg';
import productRoastingDrumClean from '../assets/images/product_roasting_drum_clean_1794802751194.jpg';
import productBrewingRitual from '../assets/images/product_brewing_ritual_1794802753460.jpg';
import originCentralHighlands from '../assets/images/origin_central_highlands_1794800574387.jpg';
import mascotTiger from '../assets/images/mascot_tiger_1794800573783.jpg';
import mascotLion from '../assets/images/mascot_lion_1794800574769.jpg';
import mascotFox from '../assets/images/mascot_fox_1794800575838.jpg';
import mascotEagle from '../assets/images/mascot_eagle_1794800576333.jpg';
import mascotWolf from '../assets/images/mascot_wolf_1794800576147.jpg';
import mascotOwl from '../assets/images/mascot_owl_1794800576592.jpg';
import mascotPanther from '../assets/images/mascot_panther_1794800577200.jpg';

export const OFFICIAL_LOGOS = {
  horizontal: '/assets/aistudio/ROAR_COFFEE_Logo_Ngang_1_Mau_e2b7f050.png',
  vertical: '/assets/aistudio/ROAR_COFFEE_Logo_Doc_1_Mau_3f42b817.png',
} as const;

export const MEDIA_ASSETS: Record<string, string> = {
  hero_roar_coffee: heroRoarCoffee,
  hero_signature_reserve_banner: heroSignatureReserveBanner,
  hero_highland_harvest_banner: heroHighlandHarvestBanner,
  product_robusta_house: productRobustaHouse,
  product_arabica_selection: productArabicaSelection,
  product_signature_reserve: productSignatureReserve,
  product_instant_silver_gold: productInstantSilverGold,
  product_green_coffee_beans: productGreenCoffeeBeans,
  product_roasting_drum_clean: productRoastingDrumClean,
  product_brewing_ritual: productBrewingRitual,
  origin_central_highlands: originCentralHighlands,
  mascot_tiger: mascotTiger,
  mascot_lion: mascotLion,
  mascot_fox: mascotFox,
  mascot_eagle: mascotEagle,
  mascot_wolf: mascotWolf,
  mascot_owl: mascotOwl,
  mascot_panther: mascotPanther,
};

export interface BuiltinMediaItem {
  key: string;
  labelVi: string;
  labelEn: string;
  category: string;
  url: string;
}

export const BUILTIN_MEDIA_ITEMS: BuiltinMediaItem[] = [
  { key: 'hero_roar_coffee', labelVi: 'Banner chính ROAR COFFEE', labelEn: 'ROAR COFFEE Flagship Hero', category: 'Banner', url: heroRoarCoffee },
  { key: 'hero_signature_reserve_banner', labelVi: 'Banner Signature Reserve & Espresso', labelEn: 'Signature Reserve Espresso Banner', category: 'Banner', url: heroSignatureReserveBanner },
  { key: 'hero_highland_harvest_banner', labelVi: 'Banner Thu hoạch Cao nguyên', labelEn: 'Highland Harvest Banner', category: 'Banner', url: heroHighlandHarvestBanner },
  { key: 'product_robusta_house', labelVi: 'Sản phẩm Robusta House Blend', labelEn: 'Robusta House Blend Product', category: 'Sản phẩm', url: productRobustaHouse },
  { key: 'product_arabica_selection', labelVi: 'Sản phẩm Arabica Selection', labelEn: 'Arabica Selection Product', category: 'Sản phẩm', url: productArabicaSelection },
  { key: 'product_signature_reserve', labelVi: 'Sản phẩm Signature Reserve', labelEn: 'Signature Reserve Product', category: 'Sản phẩm', url: productSignatureReserve },
  { key: 'product_instant_silver_gold', labelVi: 'Sản phẩm Hòa tan Silver & Gold', labelEn: 'Instant Silver & Gold Product', category: 'Sản phẩm', url: productInstantSilverGold },
  { key: 'product_green_coffee_beans', labelVi: 'Khay Cà phê Nhân xanh B2B', labelEn: 'Green Coffee Beans Trays', category: 'Sản phẩm', url: productGreenCoffeeBeans },
  { key: 'product_roasting_drum_clean', labelVi: 'Trống rang & Hạt rang mới', labelEn: 'Roasting Drum & Roasted Beans', category: 'Sản xuất', url: productRoastingDrumClean },
  { key: 'product_brewing_ritual', labelVi: 'Nghệ thuật pha Phin Việt Nam', labelEn: 'Vietnamese Phin Brewing Ritual', category: 'Pha chế', url: productBrewingRitual },
  { key: 'origin_central_highlands', labelVi: 'Vùng nguyên liệu Tây Nguyên', labelEn: 'Central Highlands Origin', category: 'Vùng trồng', url: originCentralHighlands },
  { key: 'mascot_tiger', labelVi: 'Linh vật Hổ (Đậm)', labelEn: 'Mascot Tiger', category: 'Linh vật', url: mascotTiger },
  { key: 'mascot_lion', labelVi: 'Linh vật Sư Tử (Phin)', labelEn: 'Mascot Lion', category: 'Linh vật', url: mascotLion },
  { key: 'mascot_fox', labelVi: 'Linh vật Cáo (Espresso)', labelEn: 'Mascot Fox', category: 'Linh vật', url: mascotFox },
  { key: 'mascot_eagle', labelVi: 'Linh vật Đại Bàng (Espresso Gold)', labelEn: 'Mascot Eagle', category: 'Linh vật', url: mascotEagle },
  { key: 'mascot_wolf', labelVi: 'Linh vật Sói (Tương lai)', labelEn: 'Mascot Wolf', category: 'Linh vật', url: mascotWolf },
  { key: 'mascot_owl', labelVi: 'Linh vật Cú Mèo (Tương lai)', labelEn: 'Mascot Owl', category: 'Linh vật', url: mascotOwl },
  { key: 'mascot_panther', labelVi: 'Linh vật Báo Đen (Reserve)', labelEn: 'Mascot Black Panther', category: 'Linh vật', url: mascotPanther },
];

export function resolveMediaUrl(keyOrUrl?: string, fallbackKey = 'product_robusta_house'): string {
  if (!keyOrUrl) return MEDIA_ASSETS[fallbackKey] || heroRoarCoffee;
  if (keyOrUrl.startsWith('http') || keyOrUrl.startsWith('/') || keyOrUrl.startsWith('data:')) {
    return keyOrUrl;
  }
  return MEDIA_ASSETS[keyOrUrl] || MEDIA_ASSETS[fallbackKey] || heroRoarCoffee;
}

export interface ProductGallerySlide {
  imageKey: string;
  captionVi: string;
  captionEn: string;
}

export type RawGalleryItem = string | Partial<ProductGallerySlide>;

export function normalizeGallerySlides(
  raw: RawGalleryItem[] | undefined | null,
  fallbackCaptionPrefixVi = 'Hình ảnh chi tiết sản phẩm',
  fallbackCaptionPrefixEn = 'Product detail image'
): ProductGallerySlide[] {
  if (!Array.isArray(raw)) return [];
  const result: ProductGallerySlide[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (typeof item === 'string') {
      const key = item.trim();
      if (!key) continue;
      result.push({
        imageKey: key,
        captionVi: `${fallbackCaptionPrefixVi} #${result.length + 1}`,
        captionEn: `${fallbackCaptionPrefixEn} #${result.length + 1}`,
      });
    } else if (item && typeof item === 'object' && typeof item.imageKey === 'string' && item.imageKey.trim()) {
      result.push({
        imageKey: item.imageKey.trim(),
        captionVi: (item.captionVi || '').trim() || `${fallbackCaptionPrefixVi} #${result.length + 1}`,
        captionEn: (item.captionEn || '').trim() || (item.captionVi || '').trim() || `${fallbackCaptionPrefixEn} #${result.length + 1}`,
      });
    }
  }
  return result;
}

export function getMainProductSlide(product: {
  image_key: string;
  category: string;
  slug: string;
  name_vi?: string;
  name_en?: string;
}): ProductGallerySlide {
  if (product.slug === 'signature-reserve') {
    return {
      imageKey: product.image_key,
      captionVi: product.name_vi || 'Phiên bản Signature Reserve (Báo Đen)',
      captionEn: product.name_en || 'Signature Reserve Edition (Black Panther)',
    };
  }
  if (product.slug === 'roar-espresso') {
    return {
      imageKey: product.image_key,
      captionVi: 'ROAR COFFEE ESPRESSO (Mã RC-RST-ESP · Cá tính Cáo)',
      captionEn: 'ROAR COFFEE ESPRESSO (RC-RST-ESP · Fox Edition)',
    };
  }
  if (product.slug === 'roar-espresso-gold') {
    return {
      imageKey: product.image_key,
      captionVi: 'ROAR COFFEE ESPRESSO GOLD (Mã RC-RST-ESG · Cá tính Đại Bàng)',
      captionEn: 'ROAR COFFEE ESPRESSO GOLD (RC-RST-ESG · Eagle Edition)',
    };
  }
  return {
    imageKey: product.image_key,
    captionVi: product.name_vi || 'Sản phẩm chính thức ROAR COFFEE®',
    captionEn: product.name_en || 'Official ROAR COFFEE® Packaging',
  };
}

export function getDefaultAdditionalGallerySlides(product: {
  category: string;
  slug: string;
  mascot_slug?: string;
}): ProductGallerySlide[] {
  const mascotKey = product.mascot_slug
    ? `mascot_${product.mascot_slug.replace('black-panther', 'panther').replace(/-/g, '_')}`
    : '';

  if (product.slug === 'signature-reserve') {
    return [
      { imageKey: 'hero_signature_reserve_banner', captionVi: 'Chiết xuất Espresso & lớp Crema vàng hổ phách', captionEn: 'Espresso extraction & tiger-striped crema' },
      { imageKey: 'mascot_panther', captionVi: 'Biểu tượng Báo Đen — Bản lĩnh & Sang trọng', captionEn: 'Black Panther crest — Power & Prestige' },
      { imageKey: 'product_roasting_drum_clean', captionVi: 'Quy trình rang kiểm soát nhiệt độ từng mẻ', captionEn: 'Small-batch precision drum roasting' },
      { imageKey: 'origin_central_highlands', captionVi: 'Tuyển chọn từ vùng nguyên liệu Tây Nguyên', captionEn: 'Selected from Vietnam Central Highlands' },
    ];
  }

  if (product.slug === 'roar-espresso') {
    return [
      { imageKey: 'hero_signature_reserve_banner', captionVi: 'Chiết xuất Espresso 18g → 36g ổn định crema', captionEn: 'Dialed 18g → 36g Espresso crema extraction' },
      { imageKey: 'mascot_fox', captionVi: 'Linh vật Cáo — Thông minh, linh hoạt, sáng tạo', captionEn: 'Fox Personality — Agility & Creativity' },
      { imageKey: 'product_roasting_drum_clean', captionVi: 'Mẻ rang vừa-đậm kiểm soát độ đồng nhất', captionEn: 'Uniform Medium-Dark Espresso roast batch' },
      { imageKey: 'origin_central_highlands', captionVi: 'Nguồn hạt phối trộn từ Đắk Lắk & Lâm Đồng', captionEn: 'Sourced from Đắk Lắk & Lâm Đồng plateaus' },
    ];
  }

  if (product.slug === 'roar-espresso-gold') {
    return [
      { imageKey: 'product_roasting_drum_clean', captionVi: 'Hạt rang S18 chọn lọc cho chuẩn quầy Barista & HORECA', captionEn: 'S18 selected beans for Barista & HORECA bars' },
      { imageKey: 'mascot_eagle', captionVi: 'Linh vật Đại Bàng — Tầm nhìn, tham vọng, bứt phá', captionEn: 'Eagle Personality — Vision & Excellence' },
      { imageKey: 'hero_highland_harvest_banner', captionVi: 'Tuyển chọn lô CBU & Honey từ vùng cao nguyên', captionEn: 'CBU Washed & Honey highland lot selection' },
      { imageKey: 'product_brewing_ritual', captionVi: 'Phù hợp máy Espresso chuyên nghiệp & Moka Pot', captionEn: 'Calibrated for commercial Espresso & Moka Pot' },
    ];
  }

  if (product.category === 'roasted_beans') {
    return [
      { imageKey: 'origin_central_highlands', captionVi: 'Nguồn hạt sàng S18 tuyển chọn vùng nguyên liệu Tây Nguyên', captionEn: 'Selected Screen 18 highland-grown Vietnamese lots' },
      { imageKey: 'hero_highland_harvest_banner', captionVi: 'Thu hái chín chọn lọc & phơi giàn tiêu chuẩn cao', captionEn: 'Ripe harvest & raised-bed preparation' },
      { imageKey: 'product_brewing_ritual', captionVi: 'Tối ưu pha máy Espresso, Phin và rang xay sỉ HORECA', captionEn: 'Ideal for commercial Espresso, Phin & HORECA' },
    ];
  }

  if (product.category === 'green_bean') {
    return [
      { imageKey: 'hero_highland_harvest_banner', captionVi: 'Thu hái chín và phơi giàn chế biến Natural / Honey / CBU', captionEn: 'Ripe cherry picking & drying beds' },
      { imageKey: 'origin_central_highlands', captionVi: 'Cao nguyên bazan Việt Nam — Vùng nguyên liệu', captionEn: 'Vietnamese basalt highlands origin' },
      { imageKey: 'product_roasting_drum_clean', captionVi: 'Kiểm định mẫu thử rang (Sample Cupping)', captionEn: 'Sample roasting & cupping verification' },
    ];
  }

  if (product.category === 'instant') {
    return [
      { imageKey: 'hero_roar_coffee', captionVi: 'Hương vị cà phê Việt đậm đà tiện lợi mỗi ngày', captionEn: 'Rich Vietnamese coffee character, effortless preparation' },
      { imageKey: 'product_brewing_ritual', captionVi: 'Cảm hứng tách cà phê sáng chuẩn gu Việt', captionEn: 'Inspired by authentic morning coffee rituals' },
      { imageKey: 'origin_central_highlands', captionVi: 'Nguồn hạt tuyển chọn từ nông hộ Tây Nguyên', captionEn: 'Highland-grown Vietnamese coffee selection' },
    ];
  }

  const slides: ProductGallerySlide[] = [
    { imageKey: 'product_roasting_drum_clean', captionVi: 'Hạt rang tươi mới ra lò từ trống rang thép không gỉ', captionEn: 'Freshly roasted batch from cooling drum' },
    { imageKey: 'product_brewing_ritual', captionVi: 'Chiết xuất Phin & Thưởng thức chuẩn gu Việt', captionEn: 'Authentic Phin & cupping extraction' },
    { imageKey: 'hero_signature_reserve_banner', captionVi: 'Chiết xuất Espresso đậm crema & hậu vị sâu', captionEn: 'Rich espresso crema & lasting finish' },
  ];

  if (mascotKey && MEDIA_ASSETS[mascotKey]) {
    slides.push({
      imageKey: mascotKey,
      captionVi: 'Linh vật Cá tính Thương hiệu đại diện',
      captionEn: 'Brand Personality Crest & Story',
    });
  } else {
    slides.push({
      imageKey: 'origin_central_highlands',
      captionVi: 'Vùng nguyên liệu cà phê Việt Nam',
      captionEn: 'Vietnamese Coffee Origins',
    });
  }

  return slides;
}

export function getProductGallery(product: {
  image_key: string;
  category: string;
  slug: string;
  mascot_slug?: string;
  name_vi?: string;
  name_en?: string;
  gallery_images?: RawGalleryItem[];
}): ProductGallerySlide[] {
  const mainSlide = getMainProductSlide(product);
  const customSlides = normalizeGallerySlides(product.gallery_images);
  if (customSlides.length > 0) {
    return [mainSlide, ...customSlides];
  }
  return [mainSlide, ...getDefaultAdditionalGallerySlides(product)];
}
