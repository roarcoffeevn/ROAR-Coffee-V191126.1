import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  FileEdit,
  ImagePlus,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore, type CmsPageData, type CmsPageSectionItem } from '../../context/StoreContext';
import { resolveMediaUrl } from '../../lib/media';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';

interface PagesManagerSectionProps {
  pages: CmsPageData[];
  initialSlug?: string | null;
  mediaAssets: MediaAssetRecord[];
  onMediaUploaded: () => Promise<void>;
  onSaved: () => Promise<void>;
}

const GROUP_LABELS: Record<string, { vi: string; en: string }> = {
  story: { vi: 'Thương hiệu & Trải nghiệm', en: 'Brand & Craftsmanship' },
  b2b: { vi: 'B2B, OEM & Liên hệ', en: 'B2B, OEM & Contact' },
  legal: { vi: 'Chính sách Pháp lý', en: 'Legal & Policies' },
};

export const PagesManagerSection: React.FC<PagesManagerSectionProps> = ({
  pages,
  initialSlug,
  mediaAssets,
  onMediaUploaded,
  onSaved,
}) => {
  const { lang, t } = useI18n();
  const { apiFetch, refreshBootstrap, showToast } = useStore();

  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug || pages[0]?.slug || 'about');
  const [draft, setDraft] = useState<CmsPageData | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (initialSlug && pages.some((p) => p.slug === initialSlug)) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug, pages]);

  useEffect(() => {
    const found = pages.find((p) => p.slug === selectedSlug) || pages[0];
    if (found) {
      setDraft({
        ...found,
        sections: Array.isArray(found.sections) ? found.sections.map((s) => ({ ...s })) : [],
      });
    }
  }, [selectedSlug, pages]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/pages/${draft.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        await refreshBootstrap();
        await onSaved();
        showToast(t('Đã lưu nội dung trang con và cập nhật trực tiếp lên Website.', 'Subpage saved and published live.'));
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể lưu trang con.', 'Failed to update page.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const addSectionItem = () => {
    if (!draft) return;
    const next: CmsPageSectionItem = {
      tag_vi: '',
      tag_en: '',
      title_vi: 'Mục nội dung mới',
      title_en: 'New Section Item',
      body_vi: '',
      body_en: '',
    };
    setDraft({ ...draft, sections: [...(draft.sections || []), next] });
  };

  const updateSectionItem = (idx: number, patch: Partial<CmsPageSectionItem>) => {
    if (!draft) return;
    const next = [...(draft.sections || [])];
    next[idx] = { ...next[idx], ...patch };
    setDraft({ ...draft, sections: next });
  };

  const removeSectionItem = (idx: number) => {
    if (!draft) return;
    setDraft({ ...draft, sections: draft.sections.filter((_, i) => i !== idx) });
  };

  const moveSectionItem = (idx: number, dir: -1 | 1) => {
    if (!draft) return;
    const target = idx + dir;
    if (target < 0 || target >= draft.sections.length) return;
    const next = [...draft.sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft({ ...draft, sections: next });
  };

  if (!pages.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        {t('Đang tải danh sách trang con website...', 'Loading storefront subpages...')}
      </div>
    );
  }

  const groups = ['story', 'b2b', 'legal'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
      {/* Compact Mobile Subpage Picker */}
      <div className="lg:hidden bg-white rounded-xl border border-slate-200 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="mobile-subpage-select" className="font-bold text-slate-900">
            {t('Chọn Trang con cần sửa (12 trang)', 'Select Storefront Subpage (12)')}
          </label>
          <span className="font-mono text-[11px] text-[#00552B]">{draft?.route_path}</span>
        </div>
        <select
          id="mobile-subpage-select"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold text-slate-900"
        >
          {groups.map((grp) => {
            const grpPages = pages.filter((p) => p.group_name === grp);
            if (!grpPages.length) return null;
            return (
              <optgroup key={grp} label={lang === 'vi' ? GROUP_LABELS[grp]?.vi : GROUP_LABELS[grp]?.en}>
                {grpPages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {lang === 'vi' ? p.title_vi : p.title_en} ({p.route_path})
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {/* Left Directory of Subpages (Desktop) */}
      <div className="hidden lg:block lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('Danh sách Trang con (12 trang)', 'Storefront Subpages (12)')}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t('Chọn trang để chỉnh sửa tiêu đề, nội dung song ngữ, ảnh đại diện và các thẻ mục.', 'Select a subpage to edit bilingual copy, imagery, and content blocks.')}
          </p>
        </div>

        <div className="space-y-4">
          {groups.map((grp) => {
            const grpPages = pages.filter((p) => p.group_name === grp);
            if (!grpPages.length) return null;
            return (
              <div key={grp} className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                  {lang === 'vi' ? GROUP_LABELS[grp]?.vi : GROUP_LABELS[grp]?.en}
                </p>
                <div className="space-y-1">
                  {grpPages.map((p) => {
                    const active = p.slug === selectedSlug;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setSelectedSlug(p.slug)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#00552B] text-white border-[#00552B]'
                            : 'bg-slate-50/70 text-slate-800 border-slate-200/70 hover:border-[#00552B]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">{lang === 'vi' ? p.title_vi : p.title_en}</span>
                          <FileEdit className="w-3.5 h-3.5 shrink-0 opacity-75" />
                        </div>
                        <span className={`block text-[10px] font-mono mt-0.5 ${active ? 'text-white/75' : 'text-slate-500'}`}>
                          {p.route_path}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Bilingual Page Editor */}
      {draft && (
        <form onSubmit={handleSave} className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-200">
            <div className="min-w-0">
              <span className="font-mono text-[11px] text-[#00552B] font-semibold">{draft.route_path}</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{lang === 'vi' ? draft.title_vi : draft.title_en}</h3>
              {draft.updated_at && (
                <p className="text-[11px] text-slate-400">
                  {t('Cập nhật:', 'Updated:')} {draft.updated_at}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to={draft.route_path}
                className="flex-1 sm:flex-none justify-center px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-[#00552B] font-semibold inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('Xem trang', 'Live Page')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none justify-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? t('Đang lưu...', 'Saving...') : t('Lưu & Xuất bản', 'Save & Publish')}
              </button>
            </div>
          </div>

          {/* Bilingual Headline & Eyebrow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nhãn mở đầu / Kicker (VI)', 'Eyebrow / Kicker (VI)')}</label>
              <input
                type="text"
                value={draft.eyebrow_vi}
                onChange={(e) => setDraft({ ...draft, eyebrow_vi: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nhãn mở đầu / Kicker (EN)', 'Eyebrow / Kicker (EN)')}</label>
              <input
                type="text"
                value={draft.eyebrow_en}
                onChange={(e) => setDraft({ ...draft, eyebrow_en: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề chính H1 (VI) *', 'Main Heading H1 (VI) *')}</label>
              <input
                type="text"
                required
                value={draft.title_vi}
                onChange={(e) => setDraft({ ...draft, title_vi: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề chính H1 (EN) *', 'Main Heading H1 (EN) *')}</label>
              <input
                type="text"
                required
                value={draft.title_en}
                onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Mô tả phụ (VI)', 'Subtitle (VI)')}</label>
              <input
                type="text"
                value={draft.subtitle_vi}
                onChange={(e) => setDraft({ ...draft, subtitle_vi: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Mô tả phụ (EN)', 'Subtitle (EN)')}</label>
              <input
                type="text"
                value={draft.subtitle_en}
                onChange={(e) => setDraft({ ...draft, subtitle_en: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Body Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('Nội dung giới thiệu / Đoạn văn (VI)', 'Lead Copy / Paragraphs (VI)')}
              </label>
              <textarea
                rows={5}
                value={draft.body_vi}
                onChange={(e) => setDraft({ ...draft, body_vi: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 leading-relaxed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('Nội dung giới thiệu / Đoạn văn (EN)', 'Lead Copy / Paragraphs (EN)')}
              </label>
              <textarea
                rows={5}
                value={draft.body_en}
                onChange={(e) => setDraft({ ...draft, body_en: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 leading-relaxed"
              />
            </div>
          </div>

          {/* Hero Image + CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2 border-t border-slate-200">
            <div className="sm:col-span-5 space-y-2">
              <label className="block font-semibold text-slate-700">{t('Hình ảnh đại diện trang', 'Page Hero Image')}</label>
              <div className="flex items-center gap-3">
                <div className="w-20 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  {draft.hero_image_key ? (
                    <img
                      src={resolveMediaUrl(draft.hero_image_key)}
                      alt={draft.title_vi}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">—</div>
                  )}
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#00552B]" />
                    {t('Chọn từ Thư viện ảnh', 'Select Image')}
                  </button>
                  <input
                    type="text"
                    value={draft.hero_image_key}
                    onChange={(e) => setDraft({ ...draft, hero_image_key: e.target.value })}
                    placeholder="media_key or /uploads/..."
                    className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] font-mono text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Nhãn nút CTA (VI)', 'CTA Label (VI)')}</label>
                <input
                  type="text"
                  value={draft.cta_label_vi}
                  onChange={(e) => setDraft({ ...draft, cta_label_vi: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Nhãn nút CTA (EN)', 'CTA Label (EN)')}</label>
                <input
                  type="text"
                  value={draft.cta_label_en}
                  onChange={(e) => setDraft({ ...draft, cta_label_en: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Đường dẫn CTA', 'CTA URL')}</label>
                <input
                  type="text"
                  value={draft.cta_url}
                  onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })}
                  placeholder="/shop"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Structured Section Cards / Stages / Slides */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900">
                  {t('Các khối nội dung / Thẻ mục / Slide trên trang', 'Page Cards, Stages & Booklet Slides')} ({draft.sections.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  {t(
                    'Chỉnh sửa từng thẻ giá trị, giai đoạn nông trại, slide Signature Reserve hoặc hành trình hợp tác.',
                    'Edit structured pillars, 8 farm-to-cup stages, Reserve slides, or partner pathways.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={addSectionItem}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Thêm mục mới', 'Add Block')}
              </button>
            </div>

            {draft.sections.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 text-center">
                {t('Trang này hiện chưa có thẻ mục bổ sung. Nhấn "Thêm mục mới" nếu muốn hiển thị thêm khối thông tin.', 'No extra structured blocks on this page yet.')}
              </div>
            ) : (
              <div className="space-y-3">
                {draft.sections.map((sec, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#00552B]">#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSectionItem(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded border border-slate-200 bg-white disabled:opacity-30 cursor-pointer"
                          title={t('Đưa lên', 'Move up')}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionItem(idx, 1)}
                          disabled={idx === draft.sections.length - 1}
                          className="p-1 rounded border border-slate-200 bg-white disabled:opacity-30 cursor-pointer"
                          title={t('Đưa xuống', 'Move down')}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSectionItem(idx)}
                          className="p-1 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer"
                          title={t('Xóa mục', 'Delete block')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">{t('Tiêu đề mục (VI)', 'Block Title (VI)')}</label>
                        <input
                          type="text"
                          value={sec.title_vi}
                          onChange={(e) => updateSectionItem(idx, { title_vi: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">{t('Tiêu đề mục (EN)', 'Block Title (EN)')}</label>
                        <input
                          type="text"
                          value={sec.title_en}
                          onChange={(e) => updateSectionItem(idx, { title_en: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">{t('Nội dung (VI)', 'Block Body (VI)')}</label>
                        <textarea
                          rows={2}
                          value={sec.body_vi}
                          onChange={(e) => updateSectionItem(idx, { body_vi: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">{t('Nội dung (EN)', 'Block Body (EN)')}</label>
                        <textarea
                          rows={2}
                          value={sec.body_en}
                          onChange={(e) => updateSectionItem(idx, { body_en: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      {(sec.tag_vi || sec.tag_en || draft.slug === 'partners' || draft.slug === 'farm-membership') && (
                        <>
                          <div>
                            <label className="block font-medium text-slate-600 mb-1">
                              {t('Nhãn phụ / Gạch đầu dòng (VI)', 'Tag / Checklist Lines (VI)')}
                            </label>
                            <textarea
                              rows={2}
                              value={sec.tag_vi || ''}
                              onChange={(e) => updateSectionItem(idx, { tag_vi: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                            />
                          </div>
                          <div>
                            <label className="block font-medium text-slate-600 mb-1">
                              {t('Nhãn phụ / Gạch đầu dòng (EN)', 'Tag / Checklist Lines (EN)')}
                            </label>
                            <textarea
                              rows={2}
                              value={sec.tag_en || ''}
                              onChange={(e) => updateSectionItem(idx, { tag_en: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        mediaAssets={mediaAssets}
        onMediaUploaded={onMediaUploaded}
        title={t('Chọn hình ảnh đại diện trang con', 'Select Page Hero Image')}
        onSelect={(val) => {
          if (draft) setDraft({ ...draft, hero_image_key: val });
          setPickerOpen(false);
        }}
      />
    </div>
  );
};
