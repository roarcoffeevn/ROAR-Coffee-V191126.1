import React, { useMemo, useState } from 'react';
import { Check, ImagePlus, Search, Upload, X } from 'lucide-react';
import { BUILTIN_MEDIA_ITEMS, resolveMediaUrl } from '../../lib/media';
import { useStore } from '../../context/StoreContext';
import { useI18n } from '../../i18n/I18nContext';

export interface MediaAssetRecord {
  id: number;
  filename: string;
  url: string;
  title: string;
  alt_text: string;
  mime_type: string;
  size_bytes: number;
  source_type: string;
  created_at: string;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (keyOrUrl: string) => void;
  mediaAssets: MediaAssetRecord[];
  onMediaUploaded: () => Promise<void> | void;
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  mediaAssets,
  onMediaUploaded,
  title,
}) => {
  const { t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [mode, setMode] = useState<'library' | 'upload'>('library');
  const [filter, setFilter] = useState<'all' | 'uploaded' | 'builtin'>('all');
  const [search, setSearch] = useState('');
  const [selectedVal, setSelectedVal] = useState('');

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);

  const combinedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const uploaded = mediaAssets.map((a) => ({
      value: a.url,
      previewUrl: a.url,
      label: a.title || a.filename,
      sub: t('Ảnh tải lên', 'Uploaded'),
      kind: 'uploaded' as const,
    }));
    const builtin = BUILTIN_MEDIA_ITEMS.map((b) => ({
      value: b.key,
      previewUrl: b.url,
      label: t(b.labelVi, b.labelEn),
      sub: b.category,
      kind: 'builtin' as const,
    }));

    let list = [...uploaded, ...builtin];
    if (filter === 'uploaded') list = uploaded;
    if (filter === 'builtin') list = builtin;
    if (q) {
      list = list.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.sub.toLowerCase().includes(q) ||
          item.value.toLowerCase().includes(q)
      );
    }
    return list;
  }, [mediaAssets, filter, search, t]);

  if (!open) return null;

  const processFileUpload = async (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError(t('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP, GIF).', 'Please select an image file (PNG, JPG, WEBP, GIF).'));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setUploadError(t('Dung lượng ảnh tối đa là 6MB.', 'Maximum file size is 6MB.'));
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
        reader.readAsDataURL(file);
      });

      const res = await apiFetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl,
          title: uploadTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
          altText: uploadAlt.trim() || uploadTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || t('Tải ảnh lên thất bại.', 'Upload failed.'));
        return;
      }
      await onMediaUploaded();
      showToast(t('Đã tải ảnh mới lên thư viện', 'Image uploaded to media library'));
      setUploadTitle('');
      setUploadAlt('');
      onSelect(data.asset.url);
      onClose();
    } catch {
      setUploadError(t('Lỗi đọc tệp hoặc kết nối máy chủ.', 'Error reading file or connecting to server.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ImagePlus className="w-5 h-5 text-[#00552B]" />
            <h3 className="text-base font-bold text-slate-900">
              {title || t('Chọn hoặc tải hình ảnh mới', 'Select or Upload Media')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label={t('Đóng', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode('library')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                mode === 'library'
                  ? 'border-[#00552B] text-[#00552B] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Thư viện hình ảnh', 'Media Library')} ({mediaAssets.length + BUILTIN_MEDIA_ITEMS.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                mode === 'upload'
                  ? 'border-[#00552B] text-[#00552B] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {t('Tải ảnh mới lên', 'Upload New Image')}
            </button>
          </div>

          {mode === 'library' && (
            <div className="flex items-center gap-2 py-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Tìm tên ảnh...', 'Search media...')}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white w-44 focus:outline-none focus:border-[#00552B]"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="all">{t('Tất cả nguồn', 'All Sources')}</option>
                <option value="uploaded">{t('Ảnh đã tải lên', 'Uploaded Only')}</option>
                <option value="builtin">{t('Ảnh hệ thống', 'Built-in Assets')}</option>
              </select>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'library' ? (
            combinedItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                {t('Không tìm thấy hình ảnh phù hợp. Hãy chuyển sang tab Tải ảnh mới lên.', 'No matching media found. Switch to Upload New Image tab.')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {combinedItems.map((item) => {
                  const active = selectedVal === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedVal(item.value)}
                      onDoubleClick={() => {
                        onSelect(item.value);
                        onClose();
                      }}
                      className={`group text-left rounded-lg border overflow-hidden transition-all cursor-pointer ${
                        active
                          ? 'border-[#00552B] ring-2 ring-[#00552B]/25 bg-emerald-50/40'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="aspect-[4/5] relative bg-slate-100 overflow-hidden">
                        <img
                          src={resolveMediaUrl(item.previewUrl)}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                        {active && (
                          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#00552B] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{item.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="max-w-xl mx-auto py-4 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {t('Tiêu đề ảnh (tùy chọn)', 'Image Title (optional)')}
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder={t('VD: Bao cà phê Espresso 500g', 'e.g. Espresso 500g Bag')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {t('Văn bản thay thế Alt (SEO)', 'Alt Text (SEO)')}
                  </label>
                  <input
                    type="text"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder={t('Mô tả ngắn nội dung ảnh', 'Short description of image')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) processFileUpload(f);
                }}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-[#00552B] bg-emerald-50'
                    : 'border-slate-300 hover:border-[#00552B] bg-slate-50/70'
                }`}
              >
                <Upload className="w-8 h-8 text-[#00552B] mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  {uploading
                    ? t('Đang tải ảnh lên máy chủ...', 'Uploading image...')
                    : t('Kéo thả ảnh vào đây hoặc nhấn để chọn tệp', 'Drag & drop image here or click to browse')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {t('Hỗ trợ PNG, JPG, WEBP, GIF — tối đa 6MB', 'Supports PNG, JPG, WEBP, GIF — max 6MB')}
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processFileUpload(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            {mode === 'library'
              ? selectedVal
                ? `${t('Đang chọn:', 'Selected:')} ${selectedVal}`
                : t('Nhấn chọn ảnh hoặc nhấp đúp để chèn ngay', 'Click an image or double-click to insert immediately')
              : t('Ảnh tải lên sẽ được lưu vĩnh viễn vào Thư viện ảnh', 'Uploaded images are saved permanently in Media Library')}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {t('Hủy', 'Cancel')}
            </button>
            {mode === 'library' && (
              <button
                type="button"
                disabled={!selectedVal}
                onClick={() => {
                  if (!selectedVal) return;
                  onSelect(selectedVal);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#00552B] text-white rounded-lg hover:bg-[#003D25] disabled:opacity-40 cursor-pointer"
              >
                {t('Sử dụng ảnh này', 'Use Selected Image')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
