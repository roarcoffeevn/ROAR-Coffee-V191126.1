import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit3, ExternalLink, FileText, ImagePlus, Plus, Search, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/media';
import { localizeJournalCategory } from '../../lib/i18nHelpers';
import { useStore } from '../../context/StoreContext';
import { useI18n } from '../../i18n/I18nContext';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';

export interface JournalAdminArticle {
  id: number;
  slug: string;
  category: string;
  tags: string[];
  title_vi: string;
  title_en: string;
  excerpt_vi: string;
  excerpt_en: string;
  content_vi: string;
  content_en: string;
  author: string;
  read_minutes: number;
  image_key: string;
  published: number;
  published_at: string;
}

interface JournalManagerSectionProps {
  articles: JournalAdminArticle[];
  mediaAssets: MediaAssetRecord[];
  onRefresh: () => Promise<void> | void;
  onMediaUploaded: () => Promise<void> | void;
}

const JOURNAL_CATEGORIES = [
  'Coffee knowledge',
  'Coffee processing',
  'Coffee varieties',
  'Brewing techniques',
  'Coffee origins',
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

export const JournalManagerSection: React.FC<JournalManagerSectionProps> = ({
  articles,
  mediaAssets,
  onRefresh,
  onMediaUploaded,
}) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);

  // List filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Editor form states
  const [titleVi, setTitleVi] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerptVi, setExcerptVi] = useState('');
  const [contentVi, setContentVi] = useState('');
  const [showEnFields, setShowEnFields] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState('Coffee knowledge');
  const [author, setAuthor] = useState('Ban Biên Tập ROAR COFFEE');
  const [readMinutes, setReadMinutes] = useState(4);
  const [tagsText, setTagsText] = useState('');
  const [imageKey, setImageKey] = useState('hero_roar_coffee');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (statusFilter === 'published' && !a.published) return false;
      if (statusFilter === 'draft' && a.published) return false;
      if (catFilter !== 'all' && a.category !== catFilter) return false;
      if (q) {
        return (
          a.title_vi.toLowerCase().includes(q) ||
          a.title_en.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, statusFilter, catFilter, search]);

  const openCreateEditor = () => {
    setEditingId(null);
    setTitleVi('');
    setSlug('');
    setSlugTouched(false);
    setExcerptVi('');
    setContentVi('');
    setTitleEn('');
    setExcerptEn('');
    setContentEn('');
    setShowEnFields(false);
    setCategory('Coffee knowledge');
    setAuthor('Ban Biên Tập ROAR COFFEE');
    setReadMinutes(4);
    setTagsText('');
    setImageKey('hero_roar_coffee');
    setPublished(true);
    setMode('edit');
  };

  const openEditEditor = (a: JournalAdminArticle) => {
    setEditingId(a.id);
    setTitleVi(a.title_vi || '');
    setSlug(a.slug || '');
    setSlugTouched(true);
    setExcerptVi(a.excerpt_vi || '');
    setContentVi(a.content_vi || '');
    setTitleEn(a.title_en || '');
    setExcerptEn(a.excerpt_en || '');
    setContentEn(a.content_en || '');
    setShowEnFields(false);
    setCategory(a.category || 'Coffee knowledge');
    setAuthor(a.author || 'Ban Biên Tập ROAR COFFEE');
    setReadMinutes(Number(a.read_minutes || 4));
    setTagsText(Array.isArray(a.tags) ? a.tags.join(', ') : '');
    setImageKey(a.image_key || 'hero_roar_coffee');
    setPublished(Boolean(a.published));
    setMode('edit');
  };

  const handleSavePost = async (publishState: boolean) => {
    if (!titleVi.trim()) {
      showToast(t('Vui lòng nhập tiêu đề bài viết.', 'Article title is required.'));
      return;
    }
    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        slug: slug.trim() || toSafeSlugClient(titleVi),
        category,
        tags,
        title_vi: titleVi.trim(),
        title_en: titleEn.trim() || titleVi.trim(),
        excerpt_vi: excerptVi.trim() || contentVi.trim().slice(0, 160),
        excerpt_en: excerptEn.trim() || contentEn.trim().slice(0, 160) || excerptVi.trim(),
        content_vi: contentVi.trim(),
        content_en: contentEn.trim() || contentVi.trim(),
        author: author.trim() || 'Ban Biên Tập ROAR COFFEE',
        read_minutes: Number(readMinutes || 4),
        image_key: imageKey,
        published: publishState,
      };

      const url = editingId ? `/api/admin/journal/${editingId}` : '/api/admin/journal';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể lưu bài viết.', 'Unable to save post.'));
        return;
      }
      showToast(
        publishState
          ? editingId
            ? t('Đã cập nhật & xuất bản bài viết', 'Updated and published post')
            : t('Đã đăng bài viết mới', 'Published new post')
          : t('Đã lưu bản nháp bài viết', 'Saved post as draft')
      );
      await onRefresh();
      setMode('list');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (a: JournalAdminArticle) => {
    const res = await apiFetch(`/api/admin/journal/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !a.published }),
    });
    if (res.ok) {
      showToast(a.published ? t('Đã chuyển về bản nháp', 'Moved to draft') : t('Đã xuất bản bài viết', 'Published post'));
      await onRefresh();
    }
  };

  const handleDeletePost = async (id: number) => {
    const res = await apiFetch(`/api/admin/journal/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(t('Đã xóa bài viết', 'Deleted post'));
      setConfirmDeleteId(null);
      await onRefresh();
    }
  };

  if (mode === 'edit') {
    return (
      <>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#00552B] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('Quay lại danh sách bài viết', 'Back to All Posts')}
            </button>
            <span className="text-xs font-mono text-slate-500">
              {editingId ? `${t('Chỉnh sửa bài viết #', 'Editing Post #')}${editingId}` : t('Soạn bài viết mới (WordPress Editor)', 'New Post (WordPress Editor)')}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Main Editor Column */}
            <div className="lg:col-span-8 bg-white p-3.5 sm:p-6 rounded-xl border border-slate-200 space-y-3.5 sm:space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('Tiêu đề bài viết (Tiếng Việt) *', 'Post Title (VI) *')}
                </label>
                <input
                  type="text"
                  value={titleVi}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTitleVi(val);
                    if (!slugTouched) setSlug(toSafeSlugClient(val));
                  }}
                  placeholder={t('Nhập tiêu đề bài viết...', 'Enter post title...')}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('Đường dẫn tĩnh (Slug SEO)', 'Permalink Slug')}
                </label>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <span className="px-3 py-2 text-slate-500 font-mono border-r border-slate-200">/journal/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    placeholder="duong-dan-bai-viet"
                    className="flex-1 px-3 py-2 bg-white font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('Tóm tắt ngắn (Hiển thị trên thẻ bài viết)', 'Excerpt (Summary)')}
                </label>
                <textarea
                  rows={2}
                  value={excerptVi}
                  onChange={(e) => setExcerptVi(e.target.value)}
                  placeholder={t('Đoạn mô tả súc tích thu hút người đọc...', 'Short concise excerpt...')}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('Nội dung chi tiết bài viết (Tiếng Việt)', 'Article Body Content (VI)')}
                </label>
                <textarea
                  rows={12}
                  value={contentVi}
                  onChange={(e) => setContentVi(e.target.value)}
                  placeholder={t('Viết nội dung bài viết, phân đoạn rõ ràng bằng xuống dòng...', 'Write post content separated by paragraphs...')}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 leading-relaxed"
                />
              </div>

              {/* Collapsible English Version */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnFields(!showEnFields)}
                  className="text-xs font-semibold text-[#00552B] hover:underline cursor-pointer"
                >
                  {showEnFields
                    ? t('▾ Ẩn nội dung bản dịch Tiếng Anh (tùy chọn)', '▾ Hide English Translation (optional)')
                    : t('▸ Mở rộng nhập bản dịch Tiếng Anh (song ngữ)', '▸ Expand English Translation Fields (bilingual)')}
                </button>
                {showEnFields && (
                  <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">English Title</label>
                      <input
                        type="text"
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">English Excerpt</label>
                      <textarea
                        rows={2}
                        value={excerptEn}
                        onChange={(e) => setExcerptEn(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">English Content</label>
                      <textarea
                        rows={7}
                        value={contentEn}
                        onChange={(e) => setContentEn(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right WordPress Publish Sidebar */}
            <div className="lg:col-span-4 space-y-4 text-xs">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  {t('Xuất bản & Phân loại', 'Publish & Taxonomy')}
                </h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Trạng thái bài viết', 'Post Status')}</label>
                  <select
                    value={published ? '1' : '0'}
                    onChange={(e) => setPublished(e.target.value === '1')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="1">{t('Đã xuất bản (Công khai)', 'Published (Live)')}</option>
                    <option value="0">{t('Bản nháp (Ẩn khỏi trang web)', 'Draft (Hidden)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Chuyên mục', 'Category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    {JOURNAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {localizeJournalCategory(cat, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Tác giả', 'Author')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Thời gian đọc (phút)', 'Read Time (min)')}</label>
                    <input
                      type="number"
                      min={1}
                      value={readMinutes}
                      onChange={(e) => setReadMinutes(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Thẻ bài viết (cách nhau dấu phẩy)', 'Tags (comma-separated)')}
                  </label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="Robusta, Phin, Rang Xay"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSavePost(published)}
                    className="w-full py-2.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {saving
                      ? t('Đang lưu...', 'Saving...')
                      : editingId
                        ? t('Cập nhật bài viết', 'Update Post')
                        : published
                          ? t('Đăng bài viết ngay', 'Publish Post')
                          : t('Lưu bản nháp', 'Save Draft')}
                  </button>
                  {published && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSavePost(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                    >
                      {t('Lưu dưới dạng Bản nháp', 'Save as Draft')}
                    </button>
                  )}
                </div>
              </div>

              {/* Featured Image Box */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">{t('Ảnh đại diện bài viết', 'Featured Image')}</h4>
                <div className="max-w-[260px] mx-auto aspect-[4/5] rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                  <img
                    src={resolveMediaUrl(imageKey)}
                    alt={titleVi || 'Featured article'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full py-2 px-3 border border-slate-200 hover:border-[#00552B] hover:bg-slate-50 rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 text-[#00552B]" />
                  {t('Chọn / Tải ảnh đại diện', 'Select / Upload Image')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <MediaPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          mediaAssets={mediaAssets}
          onMediaUploaded={onMediaUploaded}
          title={t('Chọn ảnh đại diện cho bài viết', 'Select Post Featured Image')}
          onSelect={(val) => setImageKey(val)}
        />
      </>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Action & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: `${t('Tất cả', 'All')} (${articles.length})` },
            { id: 'published', label: `${t('Xuất bản', 'Published')} (${articles.filter((a) => a.published).length})` },
            { id: 'draft', label: `${t('Nháp', 'Drafts')} (${articles.filter((a) => !a.published).length})` },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === st.id ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 shrink-0"
          >
            <option value="all">{t('Tất cả mục', 'All Topics')}</option>
            {JOURNAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {localizeJournalCategory(c, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm bài viết...', 'Search posts...')}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={openCreateEditor}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('Viết bài mới', 'Add Post')}
          </button>
        </div>
      </div>

      {/* Posts List: Compact Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-10 text-center space-y-2 text-slate-500">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium">{t('Chưa có bài viết nào phù hợp.', 'No posts match your filter.')}</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100 text-xs">
              {filteredArticles.map((a) => (
                <div key={a.id} className="p-3 flex items-start gap-2.5">
                  <img
                    src={resolveMediaUrl(a.image_key)}
                    alt={a.title_vi}
                    className="w-11 aspect-[4/5] rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => openEditEditor(a)}
                      className="font-bold text-slate-900 hover:text-[#00552B] text-left line-clamp-2 cursor-pointer"
                    >
                      {lang === 'en' ? a.title_en : a.title_vi}
                    </button>
                    <p className="text-[11px] text-slate-500 truncate">
                      {localizeJournalCategory(a.category, lang)} · {a.read_minutes} {t('phút', 'min')}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(a)}
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] cursor-pointer ${
                          a.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.published ? t('Đã xuất bản', 'Published') : t('Bản nháp', 'Draft')}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditEditor(a)}
                          className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 font-semibold cursor-pointer"
                        >
                          {t('Sửa', 'Edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            confirmDeleteId === a.id ? handleDeletePost(a.id) : setConfirmDeleteId(a.id)
                          }
                          className={`px-2 py-1 rounded border cursor-pointer ${
                            confirmDeleteId === a.id
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-slate-200 text-red-600'
                          }`}
                        >
                          {confirmDeleteId === a.id ? t('Xác nhận', 'Confirm') : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3 text-left">{t('Bài viết', 'Post')}</th>
                <th className="p-3 text-left">{t('Chuyên mục', 'Category')}</th>
                <th className="p-3 text-left">{t('Tác giả & Thời lượng', 'Author')}</th>
                <th className="p-3 text-left">{t('Trạng thái', 'Status')}</th>
                <th className="p-3 text-right">{t('Thao tác', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveMediaUrl(a.image_key)}
                        alt={a.title_vi}
                        className="w-10 aspect-[4/5] rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openEditEditor(a)}
                          className="font-bold text-slate-900 hover:text-[#00552B] text-left cursor-pointer"
                        >
                          {lang === 'en' ? a.title_en : a.title_vi}
                        </button>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">/journal/{a.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                    {localizeJournalCategory(a.category, lang)}
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    <div>{a.author}</div>
                    <div className="text-[11px] text-slate-400 tabular-nums">{a.read_minutes} {t('phút đọc', 'min read')}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(a)}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        a.published
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {a.published ? t('Đã xuất bản', 'Published') : t('Bản nháp', 'Draft')}
                    </button>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {confirmDeleteId === a.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeletePost(a.id)}
                          className="px-2.5 py-1 bg-red-600 text-white rounded font-semibold cursor-pointer"
                        >
                          {t('Xác nhận xóa', 'Confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 border border-slate-200 rounded bg-white cursor-pointer"
                        >
                          {t('Hủy', 'Cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditEditor(a)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {t('Sửa', 'Edit')}
                        </button>
                        {a.published === 1 && (
                          <Link
                            to={`/journal/${a.slug}`}
                            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 inline-flex items-center"
                            title={t('Xem bài viết', 'View Post')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="p-1.5 border border-slate-200 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"
                          title={t('Xóa bài viết', 'Delete Post')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
