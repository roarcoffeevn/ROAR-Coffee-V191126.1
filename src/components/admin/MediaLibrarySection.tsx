import React, { useMemo, useState } from 'react';
import { Copy, Image as ImageIcon, Search, Trash2, Upload } from 'lucide-react';
import { BUILTIN_MEDIA_ITEMS, resolveMediaUrl } from '../../lib/media';
import { useStore } from '../../context/StoreContext';
import { useI18n } from '../../i18n/I18nContext';
import type { MediaAssetRecord } from './MediaPickerModal';

interface MediaLibrarySectionProps {
  mediaAssets: MediaAssetRecord[];
  onRefresh: () => Promise<void> | void;
}

type ActiveSelection =
  | { kind: 'uploaded'; asset: MediaAssetRecord }
  | { kind: 'builtin'; key: string; label: string; category: string; url: string };

export const MediaLibrarySection: React.FC<MediaLibrarySectionProps> = ({ mediaAssets, onRefresh }) => {
  const { t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [filter, setFilter] = useState<'all' | 'uploaded' | 'builtin'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selected, setSelected] = useState<ActiveSelection | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const uploaded = mediaAssets.map((asset) => ({
      id: `up-${asset.id}`,
      kind: 'uploaded' as const,
      label: asset.title || asset.filename,
      category: t('Ảnh tải lên', 'Uploaded'),
      previewUrl: asset.url,
      copyValue: asset.url,
      asset,
    }));

    const builtin = BUILTIN_MEDIA_ITEMS.map((item) => ({
      id: `bi-${item.key}`,
      kind: 'builtin' as const,
      label: t(item.labelVi, item.labelEn),
      category: item.category,
      previewUrl: item.url,
      copyValue: item.key,
      builtinItem: item,
    }));

    let merged: Array<(typeof uploaded)[number] | (typeof builtin)[number]> = [...uploaded, ...builtin];
    if (filter === 'uploaded') merged = uploaded;
    if (filter === 'builtin') merged = builtin;
    if (q) {
      merged = merged.filter(
        (m) =>
          m.label.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.copyValue.toLowerCase().includes(q)
      );
    }
    return merged;
  }, [mediaAssets, filter, search, t]);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg('');
    setUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) {
          setErrorMsg(t('Một số tệp không phải hình ảnh và đã bị bỏ qua.', 'Some non-image files were skipped.'));
          continue;
        }
        if (file.size > 6 * 1024 * 1024) {
          setErrorMsg(t(`Tệp "${file.name}" vượt quá giới hạn 6MB.`, `File "${file.name}" exceeds 6MB.`));
          continue;
        }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('read error'));
          reader.readAsDataURL(file);
        });
        const cleanTitle = file.name.replace(/\.[^.]+$/, '');
        const res = await apiFetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            dataUrl,
            title: cleanTitle,
            altText: cleanTitle,
          }),
        });
        if (res.ok) {
          successCount += 1;
        } else {
          const d = await res.json().catch(() => ({}));
          setErrorMsg(d.error || t('Không thể tải tệp lên.', 'Failed to upload file.'));
        }
      }
      if (successCount > 0) {
        await onRefresh();
        showToast(t(`Đã tải lên ${successCount} hình ảnh mới`, `Uploaded ${successCount} image(s)`));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSelectItem = (item: (typeof items)[number]) => {
    setConfirmDeleteId(null);
    if (item.kind === 'uploaded') {
      setSelected({ kind: 'uploaded', asset: item.asset });
      setEditTitle(item.asset.title);
      setEditAlt(item.asset.alt_text);
    } else {
      setSelected({
        kind: 'builtin',
        key: item.builtinItem.key,
        label: t(item.builtinItem.labelVi, item.builtinItem.labelEn),
        category: item.builtinItem.category,
        url: item.builtinItem.url,
      });
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || selected.kind !== 'uploaded') return;
    setSavingMeta(true);
    try {
      const res = await apiFetch(`/api/admin/media/${selected.asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, altText: editAlt }),
      });
      if (res.ok) {
        showToast(t('Đã cập nhật thông tin hình ảnh', 'Updated media metadata'));
        await onRefresh();
        setSelected({
          kind: 'uploaded',
          asset: { ...selected.asset, title: editTitle, alt_text: editAlt },
        });
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    const res = await apiFetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(t('Đã xóa hình ảnh khỏi thư viện', 'Deleted image from library'));
      setSelected(null);
      setConfirmDeleteId(null);
      await onRefresh();
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || t('Không thể xóa hình ảnh', 'Unable to delete image'));
    }
  };

  const handleCopy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      showToast(t('Đã sao chép đường dẫn ảnh', 'Copied image path'));
    } catch {
      showToast(val);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Upload Dropzone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleUploadFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-dashed rounded-xl p-3.5 sm:p-5 cursor-pointer transition-colors ${
          dragging ? 'border-[#00552B] bg-emerald-50/70' : 'border-slate-300 bg-white hover:border-[#00552B]'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#00552B]/10 text-[#00552B] flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {uploading
                ? t('Đang tải ảnh lên Thư viện...', 'Uploading images...')
                : t('Tải ảnh mới lên Thư viện', 'Upload New Images')}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate sm:whitespace-normal">
              {t('Hỗ trợ PNG, JPG, WEBP, GIF (tối đa 6MB)', 'PNG, JPG, WEBP, GIF up to 6MB')}
            </p>
          </div>
        </div>
        <span className="text-center px-3.5 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold whitespace-nowrap shrink-0">
          {t('+ Chọn tệp tải lên', '+ Select Files')}
        </span>
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => handleUploadFiles(e.target.files)}
          className="hidden"
        />
      </label>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{errorMsg}</div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          {[
            { id: 'all', label: `${t('Tất cả', 'All')} (${mediaAssets.length + BUILTIN_MEDIA_ITEMS.length})` },
            { id: 'uploaded', label: `${t('Đã tải lên', 'Uploaded')} (${mediaAssets.length})` },
            { id: 'builtin', label: `${t('Hệ thống', 'System')} (${BUILTIN_MEDIA_ITEMS.length})` },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id as any)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                filter === btn.id ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Tìm theo tiêu đề hoặc đường dẫn...', 'Search media title or path...')}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-60"
          />
        </div>
      </div>

      {/* Grid + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        <div className="lg:col-span-8 bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
          {items.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {t('Chưa có hình ảnh nào phù hợp với bộ lọc hiện tại.', 'No images match the current filter.')}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {items.map((item) => {
                const isSelected =
                  (selected?.kind === 'uploaded' && item.kind === 'uploaded' && selected.asset.id === item.asset.id) ||
                  (selected?.kind === 'builtin' && item.kind === 'builtin' && selected.key === item.builtinItem.key);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`text-left rounded-lg border overflow-hidden transition-colors cursor-pointer ${
                      isSelected ? 'border-[#00552B] ring-2 ring-[#00552B]/25' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      <img src={resolveMediaUrl(item.previewUrl)} alt={item.label} className="w-full h-full object-cover" />
                      <span
                        className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.kind === 'uploaded'
                            ? 'bg-[#00552B] text-white'
                            : 'bg-slate-900/75 text-white'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-slate-800 truncate">{item.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          {!selected ? (
            <div className="py-10 text-center space-y-2 text-slate-500">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">
                {t('Nhấn vào một hình ảnh bất kỳ để xem chi tiết, sao chép đường dẫn hoặc chỉnh sửa.', 'Select an image to inspect details, copy URL, or edit metadata.')}
              </p>
            </div>
          ) : selected.kind === 'uploaded' ? (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                <img src={selected.asset.url} alt={selected.asset.alt_text} className="w-full h-full object-contain" />
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">{t('Tên tệp:', 'File:')}</span> {selected.asset.filename}
                </p>
                <p className="tabular-nums">
                  <span className="font-semibold text-slate-800">{t('Dung lượng:', 'Size:')}</span>{' '}
                  {Math.max(1, Math.round(selected.asset.size_bytes / 1024)).toLocaleString()} KB · {selected.asset.mime_type}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t('Đường dẫn tệp (URL)', 'File URL')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={selected.asset.url}
                    className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(selected.asset.url)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t('Chép', 'Copy')}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveMeta} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề ảnh', 'Image Title')}</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Văn bản thay thế (Alt)', 'Alt Text')}</label>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingMeta}
                  className="w-full py-2 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg cursor-pointer"
                >
                  {savingMeta ? t('Đang lưu...', 'Saving...') : t('Cập nhật thông tin ảnh', 'Save Media Details')}
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100">
                {confirmDeleteId === selected.asset.id ? (
                  <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs">
                    <span className="text-red-800 font-medium">{t('Xóa vĩnh viễn ảnh này?', 'Delete permanently?')}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(selected.asset.id)}
                        className="px-2.5 py-1 bg-red-600 text-white rounded font-semibold cursor-pointer"
                      >
                        {t('Xác nhận', 'Delete')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded cursor-pointer"
                      >
                        {t('Hủy', 'Cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(selected.asset.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('Xóa ảnh khỏi thư viện', 'Delete from Library')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                <img src={selected.url} alt={selected.label} className="w-full h-full object-contain" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900">{selected.label}</p>
                <p className="text-slate-500">
                  {t('Phân loại:', 'Category:')} {selected.category} · {t('Tài nguyên mặc định của hệ thống', 'Built-in system asset')}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t('Mã định danh ảnh (Media Key)', 'Media Key')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={selected.key}
                    className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(selected.key)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t('Chép', 'Copy')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
