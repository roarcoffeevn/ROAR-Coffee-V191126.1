import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Barcode,
  ImagePlus,
  Languages,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  getDefaultAdditionalGallerySlides,
  normalizeGallerySlides,
  resolveMediaUrl,
  type ProductGallerySlide,
} from '../../lib/media';
import {
  buildFiveTierPrices,
  generateEan13Barcode,
  isValidEan13,
  normalizeVolumeTiers,
  type VolumePriceTier,
} from '../../lib/pricing';
import { localizeBrewingMethod } from '../../lib/i18nHelpers';
import { useStore } from '../../context/StoreContext';
import { useI18n } from '../../i18n/I18nContext';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';

interface VariantItem {
  label: string;
  priceVnd: number;
  priceUsd: number;
}

interface ProductEditorModalProps {
  open: boolean;
  product: any | null;
  mediaAssets: MediaAssetRecord[];
  onMediaUploaded: () => Promise<void> | void;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

type EnFieldKey =
  | 'nameEn'
  | 'subtitleEn'
  | 'descriptionEn'
  | 'roastProfileEn'
  | 'tastingNotesEn'
  | 'blendSummaryEn';

const AVAILABLE_BREW_METHODS = [
  'Vietnamese Phin',
  'Espresso',
  'Moka Pot',
  'Pour-over',
  'French Press',
  'Cold Brew',
  'Iced Milk Coffee',
  'Hot Water (70–80°C)',
  'Commercial Roasting',
  'Sample Roasting',
];

function toSafeSlugClient(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calcUsdByVcb(vnd: number, rate: number): number {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 25930;
  const safeVnd = Number(vnd) || 0;
  if (safeVnd <= 0) return 0;
  return Math.round((safeVnd / safeRate) * 100) / 100;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  open,
  product,
  mediaAssets,
  onMediaUploaded,
  onClose,
  onSaved,
}) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast, vcbRate, vcbRateInfo, refreshVcbRate } = useStore();

  const [tab, setTab] = useState<'general' | 'pricing' | 'media' | 'specs'>('general');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-translate VI -> EN state
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translateNotice, setTranslateNotice] = useState('');
  const [manualEnOverrides, setManualEnOverrides] = useState<Partial<Record<EnFieldKey, boolean>>>({});
  const [manualSlideCaptionOverrides, setManualSlideCaptionOverrides] = useState<Record<number, boolean>>({});
  const dirtyViFieldsRef = useRef<Set<string>>(new Set());
  const dirtySlideIndicesRef = useRef<Set<number>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // VCB rate mode selection in pricing tab
  const [vcbMode, setVcbMode] = useState<'sell' | 'transfer' | 'buy'>('sell');
  const [refreshingVcb, setRefreshingVcb] = useState(false);

  const effectiveVcbRate = vcbRateInfo
    ? vcbMode === 'buy'
      ? vcbRateInfo.buy
      : vcbMode === 'transfer'
        ? vcbRateInfo.transfer
        : vcbRateInfo.sell
    : vcbRate;

  // Form states
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState<'roasted' | 'roasted_beans' | 'instant' | 'green_bean'>('roasted');
  const [nameVi, setNameVi] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [subtitleVi, setSubtitleVi] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [descriptionVi, setDescriptionVi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [mascotSlug, setMascotSlug] = useState('');
  const [featured, setFeatured] = useState(false);

  const [priceVnd, setPriceVnd] = useState(220000);
  const [priceUsd, setPriceUsd] = useState(calcUsdByVcb(220000, effectiveVcbRate));
  const [inventory, setInventory] = useState(50);
  const [moq, setMoq] = useState('1');
  const [status, setStatus] = useState('active');
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [pricingTiers, setPricingTiers] = useState<VolumePriceTier[]>([]);

  // Media states
  const [imageKey, setImageKey] = useState('product_robusta_house');
  const [customGallery, setCustomGallery] = useState<ProductGallerySlide[]>([]);
  const [galleryCustomized, setGalleryCustomized] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Specs
  const [coffeeType, setCoffeeType] = useState('100% Robusta');
  const [originRegion, setOriginRegion] = useState('Đắk Lắk');
  const [screenSize, setScreenSize] = useState('S18');
  const [processingMethod, setProcessingMethod] = useState('Natural');
  const [harvestYear, setHarvestYear] = useState('2025/2026');
  const [moistureContent, setMoistureContent] = useState('≤ 12.5%');
  const [density, setDensity] = useState('Đang chờ phiếu kiểm nghiệm COA');
  const [defectInfo, setDefectInfo] = useState('Đang chờ phiếu kiểm nghiệm COA');
  const [gradingSpec, setGradingSpec] = useState('');
  const [roastProfileVi, setRoastProfileVi] = useState('');
  const [roastProfileEn, setRoastProfileEn] = useState('');
  const [tastingNotesVi, setTastingNotesVi] = useState('');
  const [tastingNotesEn, setTastingNotesEn] = useState('');
  const [blendSummaryVi, setBlendSummaryVi] = useState('');
  const [blendSummaryEn, setBlendSummaryEn] = useState('');
  const [blendPublic, setBlendPublic] = useState(true);
  const [brewingMethods, setBrewingMethods] = useState<string[]>([]);

  // Media Picker target: 'main' | 'add_gallery' | number (replace slide index)
  const [pickerTarget, setPickerTarget] = useState<'main' | 'add_gallery' | number | null>(null);

  useEffect(() => {
    if (vcbRateInfo?.rateMode) {
      setVcbMode(vcbRateInfo.rateMode);
    }
  }, [vcbRateInfo?.rateMode]);

  useEffect(() => {
    if (!open) return;
    setTab('general');
    setErrorMsg('');
    setTranslateNotice('');
    setAutoTranslate(true);
    setManualSlideCaptionOverrides({});
    dirtyViFieldsRef.current.clear();
    dirtySlideIndicesRef.current.clear();

    if (product) {
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setSubCategory(product.sub_category || '');
      setSlug(product.slug || '');
      setSlugEdited(true);
      setCategory(product.category || 'roasted');
      setNameVi(product.name_vi || '');
      setNameEn(product.name_en || '');
      setSubtitleVi(product.subtitle_vi || '');
      setSubtitleEn(product.subtitle_en || '');
      setDescriptionVi(product.description_vi || '');
      setDescriptionEn(product.description_en || '');
      setMascotSlug(product.mascot_slug || '');
      setFeatured(Boolean(product.featured));

      // Lock existing English fields initially only if editing an existing product that already has custom EN,
      // unless admin clicks "Dịch tất cả" or edits a VI field cleanly.
      // Actually: allow VI edits to update EN unless admin manually edits EN inside this modal session!
      setManualEnOverrides({});

      setPriceVnd(Number(product.price_vnd || 0));
      setPriceUsd(Number(product.price_usd || 0));
      setInventory(Number(product.inventory || 0));
      setMoq(product.moq || '1');
      setStatus(product.status || 'active');
      setVariants(Array.isArray(product.variants) ? product.variants : []);
      setPricingTiers(
        Array.isArray(product.pricing_tiers) && product.pricing_tiers.length > 0
          ? normalizeVolumeTiers(product.pricing_tiers, effectiveVcbRate)
          : product.category === 'roasted_beans'
            ? buildFiveTierPrices([240000, 225000, 210000, 195000, 180000], effectiveVcbRate)
            : []
      );

      setImageKey(product.image_key || 'product_robusta_house');
      const normalized = normalizeGallerySlides(product.gallery_images);
      if (normalized.length > 0) {
        setCustomGallery(normalized);
        setGalleryCustomized(true);
      } else {
        setCustomGallery([]);
        setGalleryCustomized(false);
      }

      setCoffeeType(product.coffee_type || '');
      setOriginRegion(product.origin_region || '');
      setScreenSize(product.screen_size || '');
      setProcessingMethod(product.processing_method || '');
      setHarvestYear(product.harvest_year || '');
      setMoistureContent(product.moisture_content || '');
      setDensity(product.density || '');
      setDefectInfo(product.defect_info || '');
      setGradingSpec(product.grading_spec || '');
      setRoastProfileVi(product.roast_profile_vi || '');
      setRoastProfileEn(product.roast_profile_en || '');
      setTastingNotesVi(product.tasting_notes_vi || '');
      setTastingNotesEn(product.tasting_notes_en || '');
      setBlendSummaryVi(product.blend_summary_vi || '');
      setBlendSummaryEn(product.blend_summary_en || '');
      setBlendPublic(Boolean(product.blend_public));
      setBrewingMethods(Array.isArray(product.brewing_methods) ? product.brewing_methods : []);
    } else {
      setSku('');
      setBarcode(generateEan13Barcode(Date.now()));
      setSubCategory('');
      setSlug('');
      setSlugEdited(false);
      setCategory('roasted');
      setNameVi('');
      setNameEn('');
      setSubtitleVi('');
      setSubtitleEn('');
      setDescriptionVi('');
      setDescriptionEn('');
      setMascotSlug('');
      setFeatured(false);
      setManualEnOverrides({});

      const initVnd = 220000;
      const initUsd = calcUsdByVcb(initVnd, effectiveVcbRate);
      setPriceVnd(initVnd);
      setPriceUsd(initUsd);
      setInventory(50);
      setMoq('1');
      setStatus('active');
      setVariants([{ label: '250g · Hạt nguyên chất', priceVnd: initVnd, priceUsd: initUsd }]);
      setPricingTiers([]);

      setImageKey('product_robusta_house');
      setCustomGallery([]);
      setGalleryCustomized(false);

      setCoffeeType('100% Robusta');
      setOriginRegion('Đắk Lắk');
      setScreenSize('S18');
      setProcessingMethod('Natural');
      setHarvestYear('2025/2026');
      setMoistureContent('≤ 12.5%');
      setDensity('Đang chờ phiếu kiểm nghiệm COA');
      setDefectInfo('Đang chờ phiếu kiểm nghiệm COA');
      setGradingSpec('');
      setRoastProfileVi('Rang vừa đậm');
      setRoastProfileEn('Medium-Dark Roast');
      setTastingNotesVi('');
      setTastingNotesEn('');
      setBlendSummaryVi('');
      setBlendSummaryEn('');
      setBlendPublic(true);
      setBrewingMethods(['Vietnamese Phin']);
    }
  }, [open, product]);

  // Compute displayed gallery slides (either custom or current category defaults)
  const displayedGallery: ProductGallerySlide[] = galleryCustomized
    ? customGallery
    : getDefaultAdditionalGallerySlides({
        category,
        slug: slug || product?.slug || '',
        mascot_slug: mascotSlug,
      });

  // Translation helper (calls server-side Gemini endpoint)
  const runTranslation = async (options?: {
    forceAll?: boolean;
    onlyFields?: EnFieldKey[];
    slideIndices?: number[];
  }): Promise<{
    name_en?: string;
    subtitle_en?: string;
    description_en?: string;
    roast_profile_en?: string;
    tasting_notes_en?: string;
    blend_summary_en?: string;
  } | null> => {
    const forceAll = Boolean(options?.forceAll);
    const reqBody: Record<string, any> = {};

    const want = (key: EnFieldKey, viVal: string) => {
      if (!viVal.trim()) return false;
      if (forceAll) return true;
      if (options?.onlyFields) return options.onlyFields.includes(key);
      return dirtyViFieldsRef.current.has(key) && !manualEnOverrides[key];
    };

    if (want('nameEn', nameVi)) reqBody.name_vi = nameVi;
    if (want('subtitleEn', subtitleVi)) reqBody.subtitle_vi = subtitleVi;
    if (want('descriptionEn', descriptionVi)) reqBody.description_vi = descriptionVi;
    if (want('roastProfileEn', roastProfileVi)) reqBody.roast_profile_vi = roastProfileVi;
    if (want('tastingNotesEn', tastingNotesVi)) reqBody.tasting_notes_vi = tastingNotesVi;
    if (want('blendSummaryEn', blendSummaryVi)) reqBody.blend_summary_vi = blendSummaryVi;

    const slideIndicesToTranslate = options?.slideIndices
      ? options.slideIndices
      : forceAll && galleryCustomized
        ? customGallery.map((_, i) => i)
        : Array.from(dirtySlideIndicesRef.current).filter((i) => !manualSlideCaptionOverrides[i]);

    const slideCaps = slideIndicesToTranslate
      .map((i) => ({ idx: i, text: customGallery[i]?.captionVi || '' }))
      .filter((x) => x.text.trim().length > 0);

    if (slideCaps.length > 0) {
      reqBody.gallery_captions_vi = slideCaps.map((x) => x.text);
    }

    if (Object.keys(reqBody).length === 0) return null;

    setTranslating(true);
    setTranslateNotice('');
    try {
      const res = await apiFetch('/api/admin/translate-vi-en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTranslateNotice(
          data.error || t('Không thể tự động dịch lúc này. Bạn có thể nhập tiếng Anh thủ công.', 'Auto-translate unavailable. Please enter English manually.')
        );
        return null;
      }

      const tr = data.translations || {};
      if (tr.name_en && (forceAll || !manualEnOverrides.nameEn)) {
        setNameEn(tr.name_en);
        dirtyViFieldsRef.current.delete('nameEn');
        if (forceAll) setManualEnOverrides((p) => ({ ...p, nameEn: false }));
      }
      if (tr.subtitle_en && (forceAll || !manualEnOverrides.subtitleEn)) {
        setSubtitleEn(tr.subtitle_en);
        dirtyViFieldsRef.current.delete('subtitleEn');
        if (forceAll) setManualEnOverrides((p) => ({ ...p, subtitleEn: false }));
      }
      if (tr.description_en && (forceAll || !manualEnOverrides.descriptionEn)) {
        setDescriptionEn(tr.description_en);
        dirtyViFieldsRef.current.delete('descriptionEn');
        if (forceAll) setManualEnOverrides((p) => ({ ...p, descriptionEn: false }));
      }
      if (tr.roast_profile_en && (forceAll || !manualEnOverrides.roastProfileEn)) {
        setRoastProfileEn(tr.roast_profile_en);
        dirtyViFieldsRef.current.delete('roastProfileEn');
        if (forceAll) setManualEnOverrides((p) => ({ ...p, roastProfileEn: false }));
      }
      if (tr.tasting_notes_en && (forceAll || !manualEnOverrides.tastingNotesEn)) {
        setTastingNotesEn(tr.tasting_notes_en);
        dirtyViFieldsRef.current.delete('tastingNotesEn');
        if (forceAll) setManualEnOverrides((p) => ({ ...p, tastingNotesEn: false }));
      }
      if (tr.blend_summary_en && (forceAll || !manualEnOverrides.blendSummaryEn)) {
        setBlendSummaryEn(tr.blend_summary_en);
        dirtyViFieldsRef.current.delete('blendSummaryEn');
        if (forceAll) setManualEnOverrides((p) => ({ ...p, blendSummaryEn: false }));
      }

      if (Array.isArray(tr.gallery_captions_en) && slideCaps.length > 0) {
        setCustomGallery((prev) => {
          const next = [...prev];
          slideCaps.forEach((sc, idx) => {
            const translatedCap = tr.gallery_captions_en[idx];
            if (translatedCap && next[sc.idx] && (forceAll || !manualSlideCaptionOverrides[sc.idx])) {
              next[sc.idx] = { ...next[sc.idx], captionEn: translatedCap };
            }
          });
          return next;
        });
        slideCaps.forEach((sc) => dirtySlideIndicesRef.current.delete(sc.idx));
      }

      if (forceAll) {
        showToast(t('Đã dịch toàn bộ nội dung sang Tiếng Anh (có thể chỉnh sửa tùy biến)', 'Translated all fields to English (fully editable)'));
      }
      return tr;
    } catch {
      setTranslateNotice(t('Lỗi kết nối dịch vụ dịch tự động.', 'Auto-translation network error.'));
      return null;
    } finally {
      setTranslating(false);
    }
  };

  // Debounced auto-translate when editing VI fields
  const scheduleAutoTranslate = () => {
    if (!autoTranslate) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      runTranslation();
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  if (!open) return null;

  const markViDirty = (fieldKey: EnFieldKey) => {
    if (!autoTranslate || manualEnOverrides[fieldKey]) return;
    dirtyViFieldsRef.current.add(fieldKey);
    scheduleAutoTranslate();
  };

  // Direct Upload Helper for Tab 3 (Featured Image & Product Detail Gallery)
  const uploadImageFileToMedia = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      showToast(t('Vui lòng chọn tệp ảnh PNG, JPG, WEBP hoặc GIF.', 'Please choose PNG, JPG, WEBP, or GIF.'));
      return null;
    }
    if (file.size > 6 * 1024 * 1024) {
      showToast(t('Dung lượng ảnh tối đa là 6MB.', 'Max image size is 6MB.'));
      return null;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Read error'));
      reader.readAsDataURL(file);
    });
    const cleanTitle = file.name.replace(/\.[^.]+$/, '');
    const res = await apiFetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        dataUrl,
        title: nameVi ? `${nameVi} — ${cleanTitle}` : cleanTitle,
        altText: nameVi || cleanTitle,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.asset?.url) {
      showToast(data.error || t('Tải ảnh lên thất bại.', 'Image upload failed.'));
      return null;
    }
    await onMediaUploaded();
    return data.asset.url as string;
  };

  const handleDirectUploadMain = async (file: File | undefined) => {
    if (!file) return;
    setUploadingSlot('main');
    try {
      const url = await uploadImageFileToMedia(file);
      if (url) {
        setImageKey(url);
        showToast(t('Đã tải lên & cập nhật ảnh đại diện sản phẩm', 'Uploaded & updated main product image'));
      }
    } finally {
      setUploadingSlot(null);
    }
  };

  const ensureEditableGallery = (): ProductGallerySlide[] => {
    if (galleryCustomized) return [...customGallery];
    const seeded = [...displayedGallery];
    setGalleryCustomized(true);
    setCustomGallery(seeded);
    return seeded;
  };

  const handleDirectUploadSlide = async (idx: number, file: File | undefined) => {
    if (!file) return;
    setUploadingSlot(`slide-${idx}`);
    try {
      const url = await uploadImageFileToMedia(file);
      if (url) {
        const base = ensureEditableGallery();
        base[idx] = {
          ...(base[idx] || { captionVi: `Hình chi tiết #${idx + 1}`, captionEn: `Product detail #${idx + 1}` }),
          imageKey: url,
        };
        setCustomGallery(base);
        setGalleryCustomized(true);
        showToast(t(`Đã thay đổi ảnh chi tiết #${idx + 1}`, `Updated detail image #${idx + 1}`));
      }
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDirectUploadMultipleGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingSlot('add_multi');
    try {
      const base = ensureEditableGallery();
      let addedCount = 0;
      for (const f of Array.from(files)) {
        const url = await uploadImageFileToMedia(f);
        if (url) {
          addedCount += 1;
          const label = f.name.replace(/\.[^.]+$/, '');
          base.push({
            imageKey: url,
            captionVi: nameVi ? `${nameVi} — ${label}` : label,
            captionEn: nameEn ? `${nameEn} — ${label}` : label,
          });
        }
      }
      if (addedCount > 0) {
        setCustomGallery(base);
        setGalleryCustomized(true);
        showToast(t(`Đã thêm ${addedCount} ảnh chi tiết sản phẩm`, `Added ${addedCount} product detail image(s)`));
      }
    } finally {
      setUploadingSlot(null);
    }
  };

  const moveGalleryItem = (idx: number, dir: -1 | 1) => {
    const base = ensureEditableGallery();
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= base.length) return;
    const [item] = base.splice(idx, 1);
    base.splice(nextIdx, 0, item);
    setCustomGallery(base);
    setGalleryCustomized(true);
  };

  const removeGalleryItem = (idx: number) => {
    const base = ensureEditableGallery();
    base.splice(idx, 1);
    setCustomGallery(base);
    setGalleryCustomized(true);
  };

  const updateSlideCaption = (idx: number, field: 'captionVi' | 'captionEn', value: string) => {
    const base = ensureEditableGallery();
    base[idx] = { ...base[idx], [field]: value };
    setCustomGallery(base);
    setGalleryCustomized(true);

    if (field === 'captionEn') {
      setManualSlideCaptionOverrides((p) => ({ ...p, [idx]: true }));
    } else if (autoTranslate && !manualSlideCaptionOverrides[idx]) {
      dirtySlideIndicesRef.current.add(idx);
      scheduleAutoTranslate();
    }
  };

  // Pricing helpers (Vietcombank)
  const handleRefreshVcbRate = async () => {
    setRefreshingVcb(true);
    try {
      const rate = await refreshVcbRate(true);
      if (rate) {
        const chosen = vcbMode === 'buy' ? rate.buy : vcbMode === 'transfer' ? rate.transfer : rate.sell;
        showToast(
          t(
            `Tỉ giá Vietcombank cập nhật: 1 USD = ${chosen.toLocaleString('vi-VN')} ₫`,
            `Vietcombank rate updated: 1 USD = ${chosen.toLocaleString('en-US')} VND`
          )
        );
      }
    } finally {
      setRefreshingVcb(false);
    }
  };

  const handleRecalcAllUsdByVcb = (overrideRate?: number) => {
    const r = overrideRate || effectiveVcbRate;
    setPriceUsd(calcUsdByVcb(priceVnd, r));
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        priceUsd: calcUsdByVcb(v.priceVnd, r),
      }))
    );
    setPricingTiers((prev) =>
      prev.map((tier) => ({
        ...tier,
        priceUsd: calcUsdByVcb(tier.priceVnd, r),
      }))
    );
    showToast(
      t(
        `Đã quy đổi giá USD theo tỉ giá Vietcombank (1 USD = ${r.toLocaleString('vi-VN')} ₫)`,
        `Converted all USD prices at Vietcombank rate (1 USD = ${r.toLocaleString('en-US')} VND)`
      )
    );
  };

  const updatePricingTierRow = (idx: number, patch: Partial<VolumePriceTier>) => {
    setPricingTiers((prev) => {
      const next = prev.map((tier, i) => (i === idx ? { ...tier, ...patch } : tier));
      if (idx === 0 && patch.priceVnd !== undefined && category === 'roasted_beans') {
        setPriceVnd(patch.priceVnd);
        setPriceUsd(patch.priceUsd ?? calcUsdByVcb(patch.priceVnd, effectiveVcbRate));
      }
      return next;
    });
  };

  const toggleBrewMethod = (m: string) => {
    setBrewingMethods((prev) => (prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]));
  };

  const addVariantRow = (label = '', vnd = priceVnd, usd = calcUsdByVcb(vnd, effectiveVcbRate)) => {
    setVariants((prev) => [...prev, { label, priceVnd: vnd, priceUsd: usd }]);
  };

  const updateVariantRow = (idx: number, patch: Partial<VariantItem>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const removeVariantRow = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!sku.trim() || !nameVi.trim()) {
      setErrorMsg(t('Vui lòng nhập đầy đủ Mã SKU và Tên sản phẩm (Tiếng Việt).', 'SKU and Product Name (VI) are required.'));
      setTab('general');
      return;
    }

    setSaving(true);
    try {
      // Auto-fill any missing English fields from Vietnamese if autoTranslate is ON
      let finalNameEn = nameEn.trim();
      let finalSubtitleEn = subtitleEn.trim();
      let finalDescEn = descriptionEn.trim();
      let finalRoastEn = roastProfileEn.trim();
      let finalNotesEn = tastingNotesEn.trim();
      let finalBlendEn = blendSummaryEn.trim();

      const missingKeys: EnFieldKey[] = [];
      if (nameVi.trim() && (!finalNameEn || dirtyViFieldsRef.current.has('nameEn'))) missingKeys.push('nameEn');
      if (subtitleVi.trim() && (!finalSubtitleEn || dirtyViFieldsRef.current.has('subtitleEn'))) missingKeys.push('subtitleEn');
      if (descriptionVi.trim() && (!finalDescEn || dirtyViFieldsRef.current.has('descriptionEn'))) missingKeys.push('descriptionEn');
      if (roastProfileVi.trim() && (!finalRoastEn || dirtyViFieldsRef.current.has('roastProfileEn'))) missingKeys.push('roastProfileEn');
      if (tastingNotesVi.trim() && (!finalNotesEn || dirtyViFieldsRef.current.has('tastingNotesEn'))) missingKeys.push('tastingNotesEn');
      if (blendSummaryVi.trim() && (!finalBlendEn || dirtyViFieldsRef.current.has('blendSummaryEn'))) missingKeys.push('blendSummaryEn');

      if (autoTranslate && missingKeys.length > 0) {
        const tr = await runTranslation({ onlyFields: missingKeys });
        if (tr) {
          if (tr.name_en && !manualEnOverrides.nameEn) finalNameEn = tr.name_en;
          if (tr.subtitle_en && !manualEnOverrides.subtitleEn) finalSubtitleEn = tr.subtitle_en;
          if (tr.description_en && !manualEnOverrides.descriptionEn) finalDescEn = tr.description_en;
          if (tr.roast_profile_en && !manualEnOverrides.roastProfileEn) finalRoastEn = tr.roast_profile_en;
          if (tr.tasting_notes_en && !manualEnOverrides.tastingNotesEn) finalNotesEn = tr.tasting_notes_en;
          if (tr.blend_summary_en && !manualEnOverrides.blendSummaryEn) finalBlendEn = tr.blend_summary_en;
        }
      }

      const cleanedTiers =
        category === 'roasted_beans' || pricingTiers.length > 0
          ? pricingTiers.filter((t) => Number(t.priceVnd) > 0)
          : [];
      const effectivePriceVnd =
        category === 'roasted_beans' && cleanedTiers.length > 0 ? cleanedTiers[0].priceVnd : Number(priceVnd || 0);
      const effectivePriceUsd =
        category === 'roasted_beans' && cleanedTiers.length > 0 ? cleanedTiers[0].priceUsd : Number(priceUsd || 0);

      const payload = {
        sku: sku.trim(),
        barcode: barcode.trim(),
        sub_category: subCategory.trim(),
        slug: (slug.trim() || toSafeSlugClient(nameVi) || sku.trim()).toLowerCase(),
        category,
        name_vi: nameVi.trim(),
        name_en: finalNameEn || nameVi.trim(),
        subtitle_vi: subtitleVi.trim(),
        subtitle_en: finalSubtitleEn || subtitleVi.trim(),
        description_vi: descriptionVi.trim(),
        description_en: finalDescEn || descriptionVi.trim(),
        mascot_slug: mascotSlug,
        featured,
        price_vnd: effectivePriceVnd,
        price_usd: effectivePriceUsd,
        inventory: Number(inventory || 0),
        moq: moq.trim() || '1',
        status,
        variants: variants.filter((v) => v.label.trim().length > 0),
        pricing_tiers: cleanedTiers,
        image_key: imageKey,
        gallery_images: galleryCustomized ? customGallery : [],
        coffee_type: coffeeType,
        origin_region: originRegion,
        screen_size: screenSize,
        processing_method: processingMethod,
        harvest_year: harvestYear,
        moisture_content: moistureContent,
        density,
        defect_info: defectInfo,
        grading_spec: gradingSpec,
        roast_profile_vi: roastProfileVi,
        roast_profile_en: finalRoastEn || roastProfileVi,
        tasting_notes_vi: tastingNotesVi,
        tasting_notes_en: finalNotesEn || tastingNotesVi,
        blend_summary_vi: blendSummaryVi,
        blend_summary_en: finalBlendEn || blendSummaryVi,
        blend_public: blendPublic,
        brewing_methods: brewingMethods,
      };

      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = product ? 'PATCH' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || t('Không thể lưu sản phẩm.', 'Unable to save product.'));
        return;
      }
      showToast(product ? t('Đã cập nhật sản phẩm', 'Updated product') : t('Đã tạo sản phẩm mới', 'Created new product'));
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const renderEnBadgeAndSync = (fieldKey: EnFieldKey, viValue: string) => (
    <span className="inline-flex items-center gap-1.5 ml-1.5">
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          manualEnOverrides[fieldKey]
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-emerald-50 text-[#00552B] border border-emerald-200'
        }`}
      >
        {manualEnOverrides[fieldKey] ? t('Đã tùy biến', 'Custom') : t('Tự động dịch', 'Auto-sync')}
      </span>
      {viValue.trim() && (
        <button
          type="button"
          onClick={() => {
            setManualEnOverrides((p) => ({ ...p, [fieldKey]: false }));
            runTranslation({ onlyFields: [fieldKey], forceAll: false });
          }}
          className="text-[10px] font-semibold text-[#00552B] hover:underline cursor-pointer"
          title={t('Dịch lại trường này từ Tiếng Việt', 'Re-translate from Vietnamese')}
        >
          ↻ {t('Dịch lại', 'Re-translate')}
        </button>
      )}
    </span>
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 w-full max-w-5xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {product
                  ? `${t('Sửa sản phẩm:', 'Edit Product:')} ${product.name_vi}`
                  : t('Thêm sản phẩm mới', 'Add New Product')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {product
                  ? `${t('Mã SKU:', 'SKU:')} ${product.sku}`
                  : t('Nhập Tiếng Việt tự dịch EN · Đổi USD theo tỉ giá Vietcombank · Quản lý ảnh chi tiết 4:5', 'Auto VI→EN translation · Vietcombank USD rate · Direct 4:5 gallery uploads')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={translating}
                onClick={() => runTranslation({ forceAll: true })}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#00552B]/10 hover:bg-[#00552B]/20 text-[#00552B] text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${translating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{translating ? t('Đang dịch...', 'Translating...') : t('Dịch toàn bộ VI → EN', 'Auto-Translate All')}</span>
                <span className="sm:hidden">{translating ? '...' : 'VI→EN'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 4 WooCommerce Tabs */}
          <div className="px-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'general', label: t('1. Thông tin & Dịch', '1. General & VI→EN') },
              { id: 'pricing', label: t('2. Giá VCB & Biến thể', '2. VCB Price & Variants') },
              { id: 'media', label: t('3. Ảnh chi tiết (4:5)', '3. Detail Images (4:5)') },
              { id: 'specs', label: t('4. Thông số & COA', '4. Specs & COA') },
            ].map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id as any)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer ${
                  tab === tb.id
                    ? 'border-[#00552B] text-[#00552B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">{errorMsg}</div>
            )}

            {/* Auto-Translation Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#00552B] shrink-0" />
                <span className="text-[11px] sm:text-xs text-slate-700">
                  {t(
                    'Chỉ cần nhập Tiếng Việt — hệ thống tự động dịch sang Tiếng Anh tương ứng và bạn vẫn có thể tùy biến sửa trực tiếp.',
                    'Type Vietnamese only — English auto-translates automatically and remains freely editable.'
                  )}
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 font-semibold text-[#00552B] cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#00552B]"
                />
                <span>{t('Tự động dịch VI→EN', 'Live VI→EN Sync')}</span>
              </label>
            </div>

            {translateNotice && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                {translateNotice}
              </div>
            )}

            {/* TAB 1: GENERAL */}
            {tab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Tên sản phẩm (Tiếng Việt) *', 'Product Name (VI) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameVi}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNameVi(val);
                      if (!slugEdited) setSlug(toSafeSlugClient(val));
                      markViDirty('nameEn');
                    }}
                    placeholder="VD: Cà phê Espresso Cao cấp"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="flex flex-wrap items-center font-semibold text-slate-700 mb-1">
                    <span>{t('Tên sản phẩm (Tiếng Anh)', 'Product Name (EN)')}</span>
                    {renderEnBadgeAndSync('nameEn', nameVi)}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => {
                      setNameEn(e.target.value);
                      setManualEnOverrides((p) => ({ ...p, nameEn: true }));
                    }}
                    placeholder="ROAR COFFEE Espresso"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Mã SKU *', 'SKU Code *')}</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="RC-RBN-ROS18"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Đường dẫn tĩnh (Slug)', 'URL Slug')}</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(e.target.value);
                    }}
                    placeholder="roar-espresso"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                {/* Barcode EAN-13 + Visual Barcode Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-[#00552B]" />
                      <span>{t('Mã Barcode sản phẩm (EAN-13)', 'Product Barcode (EAN-13)')}</span>
                    </label>
                    {barcode.trim() && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isValidEan13(barcode)
                            ? 'bg-emerald-100 text-[#00552B]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isValidEan13(barcode) ? t('Chuẩn EAN-13 hợp lệ', 'Valid EAN-13') : t('Mã tùy chỉnh', 'Custom code')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value.replace(/\s+/g, ''))}
                      placeholder="8938551000017"
                      className="flex-1 border border-slate-200 bg-white rounded-lg px-3 py-1.5 font-mono tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setBarcode(generateEan13Barcode(sku || slug || Date.now()))}
                      className="px-2.5 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                    >
                      {t('Tạo EAN-13', 'Generate')}
                    </button>
                  </div>
                  {barcode.trim().length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                      <svg viewBox="0 0 180 28" className="h-7 w-40 shrink-0" aria-hidden="true">
                        {barcode
                          .trim()
                          .split('')
                          .flatMap((ch, ci) => {
                            const code = ch.charCodeAt(0);
                            return [0, 1, 2, 3].map((bit) => ({
                              x: (ci * 4 + bit) * 3.3,
                              w: ((code >> bit) & 1) === 1 ? 2.2 : 1.0,
                              on: ((code + bit) % 2) === 0 || ci === 0 || ci === barcode.trim().length - 1,
                            }));
                          })
                          .map((bar, bi) =>
                            bar.on ? <rect key={bi} x={bar.x} y={1} width={bar.w} height={26} fill="#111827" /> : null
                          )}
                      </svg>
                      <span className="font-mono text-xs font-bold tracking-[0.14em] text-slate-800 truncate">
                        {barcode.trim()}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Mã phân loại / Tham chiếu hạt (Sub-SKU)', 'Grade / Sub-category Code')}
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="VD: RO-S18, CU-S18, AR-S18-CBU..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t('Hiển thị kèm SKU khi tra cứu mã tiêu chuẩn (như RO-S18, AR-S18-CBU).', 'Optional grade reference shown alongside SKU.')}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Danh mục sản phẩm', 'Category')}</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const nextCat = e.target.value as 'roasted' | 'roasted_beans' | 'instant' | 'green_bean';
                      setCategory(nextCat);
                      if (nextCat === 'roasted_beans' && pricingTiers.length === 0) {
                        const baseSeed = priceVnd >= 100000 ? priceVnd : 240000;
                        setPricingTiers(
                          buildFiveTierPrices(
                            [
                              baseSeed,
                              Math.round(baseSeed * 0.94),
                              Math.round(baseSeed * 0.88),
                              Math.round(baseSeed * 0.82),
                              Math.round(baseSeed * 0.75),
                            ],
                            effectiveVcbRate
                          )
                        );
                      }
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="roasted">{t('Cà phê Rang xay', 'Roasted Coffee')}</option>
                    <option value="roasted_beans">{t('Cà phê Hạt rang (5 mức giá theo kg)', 'Roasted Coffee Beans (5-tier kg)')}</option>
                    <option value="instant">{t('Cà phê Hòa tan', 'Instant Coffee')}</option>
                    <option value="green_bean">{t('Cà phê Nhân xanh B2B', 'Green Coffee Beans')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Linh vật Cá tính Thương hiệu', 'Brand Personality Mascot')}
                  </label>
                  <select
                    value={mascotSlug}
                    onChange={(e) => setMascotSlug(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="">{t('-- Không gắn linh vật --', '-- None --')}</option>
                    <option value="tiger">{t('Hổ · Đậm đà & Bản lĩnh', 'Tiger')}</option>
                    <option value="lion">{t('Sư Tử · Chuẩn gu Phin', 'Lion')}</option>
                    <option value="fox">{t('Cáo · Linh hoạt Espresso', 'Fox')}</option>
                    <option value="eagle">{t('Đại Bàng · Bứt phá Espresso Gold', 'Eagle')}</option>
                    <option value="black-panther">{t('Báo Đen · Phiên bản Signature Reserve', 'Black Panther')}</option>
                    <option value="wolf">{t('Sói · Bộ sưu tập tương lai', 'Wolf')}</option>
                    <option value="owl">{t('Cú Mèo · Bộ sưu tập tương lai', 'Owl')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Phụ đề (Tiếng Việt)', 'Subtitle (VI)')}</label>
                  <input
                    type="text"
                    value={subtitleVi}
                    onChange={(e) => {
                      setSubtitleVi(e.target.value);
                      markViDirty('subtitleEn');
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="flex flex-wrap items-center font-semibold text-slate-700 mb-1">
                    <span>{t('Phụ đề (Tiếng Anh)', 'Subtitle (EN)')}</span>
                    {renderEnBadgeAndSync('subtitleEn', subtitleVi)}
                  </label>
                  <input
                    type="text"
                    value={subtitleEn}
                    onChange={(e) => {
                      setSubtitleEn(e.target.value);
                      setManualEnOverrides((p) => ({ ...p, subtitleEn: true }));
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Mô tả chi tiết (Tiếng Việt)', 'Product Description (VI)')}
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionVi}
                    onChange={(e) => {
                      setDescriptionVi(e.target.value);
                      markViDirty('descriptionEn');
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex flex-wrap items-center font-semibold text-slate-700 mb-1">
                    <span>{t('Mô tả chi tiết (Tiếng Anh)', 'Product Description (EN)')}</span>
                    {renderEnBadgeAndSync('descriptionEn', descriptionVi)}
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionEn}
                    onChange={(e) => {
                      setDescriptionEn(e.target.value);
                      setManualEnOverrides((p) => ({ ...p, descriptionEn: true }));
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#00552B]"
                    />
                    {t('Đánh dấu là Sản phẩm nổi bật trên trang chủ', 'Feature this product on storefront highlights')}
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING, STOCK & VARIANTS (VIETCOMBANK EXCHANGE RATE) */}
            {tab === 'pricing' && (
              <div className="space-y-5">
                {/* Vietcombank Live Exchange Rate Bar */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#003D25] flex items-center gap-1.5">
                        <span>{t('Tỉ giá USD Ngân hàng Vietcombank (VCB)', 'Vietcombank Official USD Exchange Rate')}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            vcbRateInfo?.isLive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {vcbRateInfo?.isLive ? 'LIVE' : t('Đã lưu', 'Cached')}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 tabular-nums">
                        {t('Mua TM:', 'Buy:')} <strong>{(vcbRateInfo?.buy || 25520).toLocaleString('vi-VN')} ₫</strong> ·{' '}
                        {t('Chuyển khoản:', 'Transfer:')} <strong>{(vcbRateInfo?.transfer || 25550).toLocaleString('vi-VN')} ₫</strong> ·{' '}
                        {t('Bán ra:', 'Sell:')} <strong className="text-[#00552B]">{(vcbRateInfo?.sell || 25930).toLocaleString('vi-VN')} ₫</strong>
                        {vcbRateInfo?.bankDateTime ? ` · (${vcbRateInfo.bankDateTime})` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select
                        value={vcbMode}
                        onChange={(e) => {
                          const nextMode = e.target.value as 'sell' | 'transfer' | 'buy';
                          setVcbMode(nextMode);
                          const nextRate = vcbRateInfo
                            ? nextMode === 'buy'
                              ? vcbRateInfo.buy
                              : nextMode === 'transfer'
                                ? vcbRateInfo.transfer
                                : vcbRateInfo.sell
                            : effectiveVcbRate;
                          handleRecalcAllUsdByVcb(nextRate);
                        }}
                        className="border border-emerald-300 bg-white rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-800"
                      >
                        <option value="sell">{t('Theo giá Bán ra (Khuyến nghị)', 'VCB Sell Rate (Recommended)')}</option>
                        <option value="transfer">{t('Theo giá Chuyển khoản', 'VCB Transfer Rate')}</option>
                        <option value="buy">{t('Theo giá Mua tiền mặt', 'VCB Cash Buy Rate')}</option>
                      </select>
                      <button
                        type="button"
                        disabled={refreshingVcb}
                        onClick={handleRefreshVcbRate}
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-[#00552B] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshingVcb ? 'animate-spin' : ''}`} />
                        {t('Lấy tỉ giá mới', 'Refresh VCB')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecalcAllUsdByVcb()}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00552B] text-white font-semibold cursor-pointer"
                      >
                        {t('Quy đổi lại USD', 'Recalculate USD')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Giá mặc định (VND)', 'Base Price (VND)')}</label>
                    <input
                      type="number"
                      min={0}
                      value={priceVnd}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPriceVnd(val);
                        setPriceUsd(calcUsdByVcb(val, effectiveVcbRate));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('Giá (USD · VCB)', 'Price (USD · VCB)')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Tồn kho', 'Inventory')}</label>
                    <input
                      type="number"
                      min={0}
                      value={inventory}
                      onChange={(e) => setInventory(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('MOQ', 'MOQ')}</label>
                    <input
                      type="text"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">{t('Trạng thái bán', 'Status')}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="active">{t('Đang bán', 'Active')}</option>
                      <option value="configurable_on_request">{t('Đặt theo cấu hình', 'Configurable on Request')}</option>
                      <option value="out_of_stock">{t('Tạm hết hàng', 'Out of Stock')}</option>
                      <option value="draft">{t('Bản nháp / Lưu trữ', 'Draft / Archived')}</option>
                    </select>
                  </div>
                </div>

                {/* Visual Variant Builder */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {t('Biến thể & Quy cách đóng gói (WooCommerce)', 'Product Variations & Packaging')}
                      </h4>
                      <p className="text-slate-500">
                        {t('Khi nhập VND, giá USD tự động tính theo tỉ giá Vietcombank (1 USD = ', 'USD auto-calculates via Vietcombank rate (1 USD = ')}
                        {effectiveVcbRate.toLocaleString('vi-VN')} ₫).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addVariantRow('250g · Hạt nguyên chất', priceVnd, calcUsdByVcb(priceVnd, effectiveVcbRate))}
                        className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        + 250g Hạt
                      </button>
                      <button
                        type="button"
                        onClick={() => addVariantRow('500g · Hạt nguyên chất', priceVnd * 2, calcUsdByVcb(priceVnd * 2, effectiveVcbRate))}
                        className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        + 500g Hạt
                      </button>
                      <button
                        type="button"
                        onClick={() => addVariantRow('1kg · Gói chuyên dụng quán (HORECA)', Math.round(priceVnd * 3.7), calcUsdByVcb(Math.round(priceVnd * 3.7), effectiveVcbRate))}
                        className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        + 1kg HORECA
                      </button>
                      <button
                        type="button"
                        onClick={() => addVariantRow('', priceVnd, calcUsdByVcb(priceVnd, effectiveVcbRate))}
                        className="px-3 py-1.5 rounded bg-[#00552B] text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('Thêm biến thể', 'Add Variation')}
                      </button>
                    </div>
                  </div>

                  {variants.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-500">
                      {t('Chưa có biến thể nào. Sản phẩm sẽ dùng Giá mặc định ở trên.', 'No variants defined. Storefront will use the base price above.')}
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="p-2.5 text-left">{t('Tên quy cách / Biến thể', 'Variation Label')}</th>
                            <th className="p-2.5 text-right">{t('Giá (VND)', 'Price (VND)')}</th>
                            <th className="p-2.5 text-right">{t('Giá (USD · VCB)', 'Price (USD)')}</th>
                            <th className="p-2.5 text-right">{t('Xóa', 'Remove')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {variants.map((v, idx) => (
                            <tr key={idx}>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={v.label}
                                  onChange={(e) => updateVariantRow(idx, { label: e.target.value })}
                                  placeholder="VD: 500g · Xay pha Phin"
                                  className="w-full min-w-[160px] border border-slate-200 rounded px-2.5 py-1.5"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  value={v.priceVnd}
                                  onChange={(e) => {
                                    const vnd = Number(e.target.value);
                                    updateVariantRow(idx, {
                                      priceVnd: vnd,
                                      priceUsd: calcUsdByVcb(vnd, effectiveVcbRate),
                                    });
                                  }}
                                  className="w-28 sm:w-32 text-right border border-slate-200 rounded px-2.5 py-1.5 font-mono tabular-nums"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.priceUsd}
                                  onChange={(e) => updateVariantRow(idx, { priceUsd: Number(e.target.value) })}
                                  className="w-20 sm:w-24 text-right border border-slate-200 rounded px-2.5 py-1.5 font-mono tabular-nums"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(idx)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  aria-label={t('Xóa biến thể', 'Remove variation')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 5-Tier Kg Volume Pricing Table (Roasted Coffee Beans) */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {t('Bảng giá 5 mức theo số lượng kg (Cà phê Hạt rang / Sỉ)', '5-Tier Volume Pricing (per kg)')}
                      </h4>
                      <p className="text-slate-500">
                        {t(
                          'Tự động áp dụng theo số kg khách chọn trên website: 1 kg, 5–19 kg, 20–49 kg, 50–99 kg và Sỉ ≥100 kg.',
                          'Auto-applied based on customer kg quantity: 1 kg, 5–19 kg, 20–49 kg, 50–99 kg, Wholesale ≥100 kg.'
                        )}
                      </p>
                    </div>
                    {pricingTiers.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const baseSeed = priceVnd >= 100000 ? priceVnd : 240000;
                          setPricingTiers(
                            buildFiveTierPrices(
                              [
                                baseSeed,
                                Math.round(baseSeed * 0.94),
                                Math.round(baseSeed * 0.88),
                                Math.round(baseSeed * 0.82),
                                Math.round(baseSeed * 0.75),
                              ],
                              effectiveVcbRate
                            )
                          );
                        }}
                        className="px-3 py-1.5 rounded bg-[#00552B] text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('Khởi tạo bảng giá 5 mức kg', 'Enable 5-Tier Kg Pricing')}
                      </button>
                    ) : (
                      category !== 'roasted_beans' && (
                        <button
                          type="button"
                          onClick={() => setPricingTiers([])}
                          className="px-2.5 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                        >
                          {t('Tắt bảng giá kg', 'Remove Tier Pricing')}
                        </button>
                      )
                    )}
                  </div>

                  {pricingTiers.length > 0 && (
                    <div className="border border-emerald-200 rounded-xl overflow-x-auto bg-emerald-50/30">
                      <table className="w-full text-xs">
                        <thead className="bg-emerald-50 border-b border-emerald-200 text-[#003D25]">
                          <tr>
                            <th className="p-2.5 text-left">{t('Mức số lượng', 'Quantity Tier')}</th>
                            <th className="p-2.5 text-left">{t('Khoảng kg', 'Kg Range')}</th>
                            <th className="p-2.5 text-right">{t('Đơn giá / kg (VND)', 'Price / kg (VND)')}</th>
                            <th className="p-2.5 text-right">{t('Đơn giá / kg (USD · VCB)', 'Price / kg (USD · VCB)')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100 bg-white">
                          {pricingTiers.map((tier, idx) => (
                            <tr key={`${tier.minKg}-${idx}`}>
                              <td className="p-2.5 font-semibold text-slate-900">
                                {lang === 'en' ? tier.labelEn : tier.labelVi}
                              </td>
                              <td className="p-2.5 font-mono text-slate-500">
                                {tier.maxKg === null ? `≥ ${tier.minKg} kg` : `${tier.minKg} – ${tier.maxKg} kg`}
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  value={tier.priceVnd}
                                  onChange={(e) => {
                                    const vnd = Math.max(0, Number(e.target.value));
                                    updatePricingTierRow(idx, {
                                      priceVnd: vnd,
                                      priceUsd: calcUsdByVcb(vnd, effectiveVcbRate),
                                    });
                                  }}
                                  className="w-32 text-right border border-slate-200 rounded px-2.5 py-1.5 font-mono tabular-nums font-semibold"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={tier.priceUsd}
                                  onChange={(e) =>
                                    updatePricingTierRow(idx, { priceUsd: Math.max(0, Number(e.target.value)) })
                                  }
                                  className="w-24 text-right border border-slate-200 rounded px-2.5 py-1.5 font-mono tabular-nums"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: IMAGES & DETAIL GALLERY (DIRECT UPLOAD & REPLACE) */}
            {tab === 'media' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
                {/* Main Featured Image (Slide #1) */}
                <div className="md:col-span-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {t('Ảnh đại diện chính (Slide #1)', 'Featured Image (Slide #1)')}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t('Hiển thị ở cửa hàng & ảnh đầu trang chi tiết (4:5).', 'Shown in catalog & first detail slide (4:5).')}
                    </p>
                  </div>
                  <div className="max-w-[240px] aspect-[4/5] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                    <img
                      src={resolveMediaUrl(imageKey)}
                      alt={nameVi || 'Featured product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-w-[240px]">
                    <label className="py-2 px-2.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer text-[11px]">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingSlot === 'main' ? t('Đang tải...', 'Uploading...') : t('Tải ảnh từ máy', 'Upload File')}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        disabled={uploadingSlot !== null}
                        onChange={(e) => {
                          handleDirectUploadMain(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPickerTarget('main')}
                      className="py-2 px-2.5 border border-slate-200 hover:border-[#00552B] bg-white text-slate-800 font-semibold rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer text-[11px]"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      {t('Thư viện', 'Library')}
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]">{imageKey}</p>
                </div>

                {/* All Product Detail Slides */}
                <div className="md:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>
                          {t('Hình ảnh trong Chi tiết Sản phẩm', 'Product Detail Carousel Slides')} ({displayedGallery.length})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            galleryCustomized
                              ? 'bg-emerald-50 text-[#00552B] border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {galleryCustomized ? t('Đã tùy biến riêng', 'Customized') : t('Bộ mặc định theo dòng SP', 'Category Default')}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t(
                          'Tải lên, thay thế hoặc sắp xếp lại từng hình chi tiết hiển thị ở trang sản phẩm.',
                          'Upload, replace, reorder, or caption every detail slide shown on the product page.'
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {galleryCustomized && (
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryCustomized(false);
                            setCustomGallery([]);
                            showToast(t('Đã khôi phục bộ ảnh mặc định theo dòng sản phẩm', 'Restored default gallery slides'));
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 font-semibold inline-flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {t('Mặc định', 'Reset')}
                        </button>
                      )}
                      <label className="px-2.5 py-1.5 bg-[#00552B] hover:bg-[#003D25] text-white rounded-lg font-semibold inline-flex items-center gap-1 text-[11px] cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingSlot === 'add_multi' ? t('Đang tải...', 'Uploading...') : t('Tải ảnh lên', 'Upload Images')}
                        <input
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          disabled={uploadingSlot !== null}
                          onChange={(e) => {
                            handleDirectUploadMultipleGallery(e.target.files);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setPickerTarget('add_gallery')}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg font-semibold inline-flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('Từ thư viện', 'From Library')}
                      </button>
                    </div>
                  </div>

                  {displayedGallery.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                      {t('Chưa có ảnh phụ nào. Hãy bấm "Tải ảnh lên" hoặc "Từ thư viện" để thêm ảnh chi tiết.', 'No detail slides yet. Click Upload Images or From Library to add.')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {displayedGallery.map((slide, idx) => (
                        <div key={`${slide.imageKey}-${idx}`} className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
                          <div className="aspect-[4/5] bg-slate-100 relative group">
                            <img src={resolveMediaUrl(slide.imageKey)} alt={slide.captionVi} className="w-full h-full object-cover" />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-white font-mono text-[10px]">
                              #{idx + 2}
                            </span>
                            {uploadingSlot === `slide-${idx}` && (
                              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[11px] font-semibold">
                                {t('Đang tải lên...', 'Uploading...')}
                              </div>
                            )}
                          </div>

                          {/* Upload / Replace actions directly on each slide */}
                          <div className="p-2 space-y-1.5 border-t border-slate-100 bg-slate-50/70">
                            <div className="grid grid-cols-2 gap-1">
                              <label className="px-1.5 py-1 rounded bg-[#00552B]/10 hover:bg-[#00552B]/20 text-[#00552B] font-semibold text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer">
                                <Upload className="w-3 h-3" />
                                {t('Tải thay', 'Upload')}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/gif"
                                  disabled={uploadingSlot !== null}
                                  onChange={(e) => {
                                    handleDirectUploadSlide(idx, e.target.files?.[0]);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setPickerTarget(idx)}
                                className="px-1.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ImagePlus className="w-3 h-3" />
                                {t('Đổi ảnh', 'Library')}
                              </button>
                            </div>

                            <input
                              type="text"
                              value={slide.captionVi}
                              onChange={(e) => updateSlideCaption(idx, 'captionVi', e.target.value)}
                              placeholder={t('Chú thích ảnh (VI)...', 'Caption (VI)...')}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] bg-white"
                            />
                            <input
                              type="text"
                              value={slide.captionEn}
                              onChange={(e) => updateSlideCaption(idx, 'captionEn', e.target.value)}
                              placeholder={t('Chú thích (EN - tự dịch)', 'Caption (EN - auto)')}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] bg-white text-slate-600"
                            />

                            <div className="flex items-center justify-between pt-0.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveGalleryItem(idx, -1)}
                                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                                  aria-label={t('Chuyển sang trái', 'Move left')}
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === displayedGallery.length - 1}
                                  onClick={() => moveGalleryItem(idx, 1)}
                                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                                  aria-label={t('Chuyển sang phải', 'Move right')}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeGalleryItem(idx)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                aria-label={t('Xóa ảnh này', 'Remove slide')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: COFFEE SPECS & COA */}
            {tab === 'specs' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Loại hạt / Dòng cà phê', 'Coffee Type')}</label>
                    <input type="text" value={coffeeType} onChange={(e) => setCoffeeType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Vùng nguyên liệu', 'Origin Region')}</label>
                    <input type="text" value={originRegion} onChange={(e) => setOriginRegion(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Cỡ sàng', 'Screen Size')}</label>
                    <input type="text" value={screenSize} onChange={(e) => setScreenSize(e.target.value)} placeholder="S14 / S16 / S18" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Phương pháp sơ chế', 'Processing Method')}</label>
                    <input type="text" value={processingMethod} onChange={(e) => setProcessingMethod(e.target.value)} placeholder="Natural / Honey / CBU" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Niên vụ thu hoạch', 'Harvest Year')}</label>
                    <input type="text" value={harvestYear} onChange={(e) => setHarvestYear(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Độ ẩm (COA)', 'Moisture Content')}</label>
                    <input type="text" value={moistureContent} onChange={(e) => setMoistureContent(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Tỷ trọng hạt', 'Density')}</label>
                    <input type="text" value={density} onChange={(e) => setDensity(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Thông số lỗi hạt', 'Defect Spec')}</label>
                    <input type="text" value={defectInfo} onChange={(e) => setDefectInfo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu chuẩn phân loại', 'Grading Spec')}</label>
                    <input type="text" value={gradingSpec} onChange={(e) => setGradingSpec(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Hồ sơ rang (Tiếng Việt)', 'Roast Profile (VI)')}</label>
                    <input
                      type="text"
                      value={roastProfileVi}
                      onChange={(e) => {
                        setRoastProfileVi(e.target.value);
                        markViDirty('roastProfileEn');
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="flex flex-wrap items-center font-semibold text-slate-700 mb-1">
                      <span>{t('Hồ sơ rang (Tiếng Anh)', 'Roast Profile (EN)')}</span>
                      {renderEnBadgeAndSync('roastProfileEn', roastProfileVi)}
                    </label>
                    <input
                      type="text"
                      value={roastProfileEn}
                      onChange={(e) => {
                        setRoastProfileEn(e.target.value);
                        setManualEnOverrides((p) => ({ ...p, roastProfileEn: true }));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Ghi chú thử nếm (Tiếng Việt)', 'Tasting Notes (VI)')}</label>
                    <input
                      type="text"
                      value={tastingNotesVi}
                      onChange={(e) => {
                        setTastingNotesVi(e.target.value);
                        markViDirty('tastingNotesEn');
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="flex flex-wrap items-center font-semibold text-slate-700 mb-1">
                      <span>{t('Ghi chú thử nếm (Tiếng Anh)', 'Tasting Notes (EN)')}</span>
                      {renderEnBadgeAndSync('tastingNotesEn', tastingNotesVi)}
                    </label>
                    <input
                      type="text"
                      value={tastingNotesEn}
                      onChange={(e) => {
                        setTastingNotesEn(e.target.value);
                        setManualEnOverrides((p) => ({ ...p, tastingNotesEn: true }));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Tóm tắt phối trộn (VI)', 'Blend Summary (VI)')}</label>
                    <input
                      type="text"
                      value={blendSummaryVi}
                      onChange={(e) => {
                        setBlendSummaryVi(e.target.value);
                        markViDirty('blendSummaryEn');
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="flex flex-wrap items-center font-semibold text-slate-700 mb-1">
                      <span>{t('Tóm tắt phối trộn (EN)', 'Blend Summary (EN)')}</span>
                      {renderEnBadgeAndSync('blendSummaryEn', blendSummaryVi)}
                    </label>
                    <input
                      type="text"
                      value={blendSummaryEn}
                      onChange={(e) => {
                        setBlendSummaryEn(e.target.value);
                        setManualEnOverrides((p) => ({ ...p, blendSummaryEn: true }));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blendPublic}
                      onChange={(e) => setBlendPublic(e.target.checked)}
                      className="w-4 h-4 accent-[#00552B]"
                    />
                    {t('Công khai tỷ lệ phối trộn trên cửa hàng', 'Publicly display blend formula on storefront')}
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    {t('Phương pháp pha chế gợi ý', 'Recommended Brewing Methods')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_BREW_METHODS.map((m) => {
                      const checked = brewingMethods.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => toggleBrewMethod(m)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                            checked
                              ? 'bg-[#00552B] text-white border-[#00552B]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {localizeBrewingMethod(m, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {t('Hủy bỏ', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || translating}
              className="px-5 py-2 text-xs font-semibold bg-[#00552B] hover:bg-[#003D25] text-white rounded-lg cursor-pointer disabled:opacity-50"
            >
              {saving
                ? t('Đang lưu...', 'Saving...')
                : translating
                  ? t('Đang dịch & chuẩn bị...', 'Translating...')
                  : product
                    ? t('Cập nhật sản phẩm', 'Update Product')
                    : t('Đăng sản phẩm', 'Publish Product')}
            </button>
          </div>
        </form>
      </div>

      <MediaPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        mediaAssets={mediaAssets}
        onMediaUploaded={onMediaUploaded}
        title={
          pickerTarget === 'main'
            ? t('Chọn ảnh đại diện sản phẩm (4:5)', 'Select Main Product Image (4:5)')
            : typeof pickerTarget === 'number'
              ? t(`Thay đổi ảnh chi tiết #${pickerTarget + 2}`, `Replace Detail Slide #${pickerTarget + 2}`)
              : t('Thêm ảnh vào thư viện chi tiết sản phẩm', 'Add Image to Product Detail Gallery')
        }
        onSelect={(val) => {
          if (pickerTarget === 'main') {
            setImageKey(val);
          } else if (pickerTarget === 'add_gallery') {
            const base = ensureEditableGallery();
            base.push({
              imageKey: val,
              captionVi: nameVi ? `${nameVi} — Góc ảnh ${base.length + 1}` : `Hình chi tiết #${base.length + 1}`,
              captionEn: nameEn ? `${nameEn} — View ${base.length + 1}` : `Product detail #${base.length + 1}`,
            });
            setCustomGallery(base);
            setGalleryCustomized(true);
          } else if (typeof pickerTarget === 'number') {
            const base = ensureEditableGallery();
            base[pickerTarget] = {
              ...(base[pickerTarget] || { captionVi: 'Hình chi tiết', captionEn: 'Product detail' }),
              imageKey: val,
            };
            setCustomGallery(base);
            setGalleryCustomized(true);
          }
          setPickerTarget(null);
        }}
      />
    </>
  );
};
