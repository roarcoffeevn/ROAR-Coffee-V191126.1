import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, FileText, Package } from 'lucide-react';
import { B2BInquiryModal } from '../components/B2BInquiryModal';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { localizeCoffeeType } from '../lib/i18nHelpers';
import { fetchProductsWithFallback } from '../lib/staticFallback';

export const GreenCoffeePage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { formatPrice, currency, setCurrency } = useStore();
  const [searchParams] = useSearchParams();

  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [screenFilter, setScreenFilter] = useState(searchParams.get('screen') || 'all');
  const [procFilter, setProcFilter] = useState(searchParams.get('proc') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sample_request' | 'green_quotation'>('sample_request');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ category: 'green_bean' });
    if (typeFilter !== 'all') params.set('coffee_type', typeFilter);
    if (screenFilter !== 'all') params.set('screen', screenFilter);
    if (procFilter !== 'all') params.set('processing', procFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());

    fetchProductsWithFallback(params)
      .then((list) => setProducts(list))
      .finally(() => setLoading(false));
  }, [typeFilter, screenFilter, procFilter, statusFilter, search]);

  const openModal = (p: Product | null, type: 'sample_request' | 'green_quotation') => {
    setSelectedProduct(p);
    setModalType(type);
    setModalOpen(true);
  };

  const downloadSpecSheet = (p: Product) => {
    const content = [
      `ROAR COFFEE — GREEN COFFEE TECHNICAL SPECIFICATION`,
      `SKU: ${p.sku}`,
      `Product: ${p.name_en} / ${p.name_vi}`,
      `Classification: ${p.coffee_type}`,
      `Screen Size: ${p.screen_size}`,
      `Processing Method: ${p.processing_method} (${p.processing_method === 'CBU' ? 'Washed Process / Chế biến ướt' : p.processing_method === 'HON' ? 'Honey Process' : 'Natural Process'})`,
      `Origin Region: ${p.origin_region}`,
      `Harvest Year: ${p.harvest_year}`,
      `Moisture Content: ${p.moisture_content}`,
      `Density: ${p.density}`,
      `Defect Information: ${p.defect_info}`,
      `Grading Spec: ${p.grading_spec}`,
      `Configurable Packaging: ${p.packaging_options.join(', ')}`,
      `Minimum Order Quantity: ${p.moq}`,
      `Note: Moisture, density, defect counts, and harvest year are published strictly upon verified lot COA.`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.sku}-spec.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#F8F5EF] dark:bg-[#0E1512]">
      {/* B2B Green Coffee Banner */}
      <section className="bg-[#003D25] text-white py-14">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A667]">
              {t('Cà phê Nhân xanh B2B & Xuất khẩu', 'Green Coffee Beans · B2B Commercial Matrix')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-balance">
              {t('Cà Phê Nhân Xanh Việt Nam — 27 Cấu Hình Tiêu Chuẩn', 'Vietnamese Green Coffee Beans — 27 Configurable SKUs')}
            </h1>
            <p className="text-sm text-[#F8F5EF]/80 leading-relaxed max-w-2xl">
              {t(
                'Kiến trúc 3 dòng hạt (Robusta, Arabica, Culi/Peaberry) × 3 cỡ sàng (S14, S16, S18) × 3 phương pháp (Natural, Honey, Washed CBU). Lưu ý: Culi là phân loại hình thái học hạt tròn, không phải loài thực vật riêng; CBU là ký hiệu thương mại chính thức cho chế biến ướt.',
                'Structured across 3 bean classifications (Robusta, Arabica, Culi/Peaberry) × 3 screen sizes (S14, S16, S18) × 3 processing methods (Natural, Honey, Washed CBU). Culi denotes single-seed bean morphology; CBU is ROAR COFFEE’s official designation for Washed Process.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => openModal(null, 'sample_request')}
                className="px-5 py-2.5 bg-[#C6A667] text-[#111111] text-xs font-semibold rounded hover:bg-[#d4b67a] cursor-pointer"
              >
                {t('YÊU CẦU MẪU THỬ', 'REQUEST A SAMPLE')}
              </button>
              <button
                type="button"
                onClick={() => openModal(null, 'green_quotation')}
                className="px-5 py-2.5 border border-white/30 text-white text-xs font-medium rounded hover:bg-white/10 cursor-pointer"
              >
                {t('YÊU CẦU BÁO GIÁ', 'REQUEST A QUOTATION')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 aspect-[4/3] rounded-xl overflow-hidden border border-white/15">
            <MediaImage
              imageKey="product_green_coffee_beans"
              alt="Green Coffee Beans Natural Honey Washed CBU"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-8">
        {/* Terminology & Accuracy Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 text-xs">
          <div>
            <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] block">NAT · Natural Process</span>
            <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Chế biến khô nguyên quả', 'Dry sun-dried whole cherry')}</span>
          </div>
          <div>
            <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] block">HON · Honey Process</span>
            <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Chế biến giữ lớp nhớt mật ong', 'Controlled mucilage drying')}</span>
          </div>
          <div>
            <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] block">CBU · Washed Process</span>
            <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Ký hiệu chính thức chế biến ướt', 'Official Washed Process designation')}</span>
          </div>
          <div>
            <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] block">30kg · 60kg · 69kg · 1,000kg</span>
            <span className="text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Đóng gói cấu hình theo hợp đồng', 'Configurable commercial packaging')}</span>
          </div>
        </div>

        {/* Multi-Facet Filter Bar */}
        <div className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Bộ lọc Ma trận Nhân xanh (27 tổ hợp)', 'Filter the 27-SKU Green Coffee Matrix')}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCurrency(currency === 'VND' ? 'USD' : 'VND')}
                className="px-2.5 py-1 border border-[#202020]/15 dark:border-white/15 rounded font-mono cursor-pointer"
              >
                {currency}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('all');
                  setScreenFilter('all');
                  setProcFilter('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer"
              >
                {t('Đặt lại', 'Reset')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">{t('Loại cà phê', 'Coffee Type')}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 bg-[#F8F5EF]/50 dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]"
              >
                <option value="all">{t('Tất cả (Robusta / Arabica / Culi)', 'All Types')}</option>
                <option value="Robusta">Robusta (RO)</option>
                <option value="Arabica">Arabica (AR)</option>
                <option value="Culi">{t('Culi / Hạt tròn (CU)', 'Culi / Peaberry (CU)')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">{t('Kích thước sàng', 'Screen Size')}</label>
              <select
                value={screenFilter}
                onChange={(e) => setScreenFilter(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 bg-[#F8F5EF]/50 dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]"
              >
                <option value="all">{t('Tất cả cỡ sàng', 'All Screens')}</option>
                <option value="S14">S14</option>
                <option value="S16">S16</option>
                <option value="S18">S18</option>
              </select>
            </div>

            <div>
              <label className="block text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">{t('Chế biến', 'Processing')}</label>
              <select
                value={procFilter}
                onChange={(e) => setProcFilter(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 bg-[#F8F5EF]/50 dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]"
              >
                <option value="all">{t('Tất cả phương pháp', 'All Methods')}</option>
                <option value="NAT">{t('Sơ chế Khô · Natural (NAT)', 'Natural (NAT)')}</option>
                <option value="HON">{t('Sơ chế Mật ong · Honey (HON)', 'Honey (HON)')}</option>
                <option value="CBU">{t('Chế biến ướt · CBU', 'Washed / CBU (CBU)')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">{t('Tình trạng nguồn cung', 'Availability')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 bg-[#F8F5EF]/50 dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]"
              >
                <option value="all">{t('Tất cả trạng thái', 'All Statuses')}</option>
                <option value="active">{t('Sẵn sàng báo giá tham chiếu', 'Active Reference Lot')}</option>
                <option value="configurable_on_request">{t('Cấu hình theo đơn đặt hàng', 'Configurable on Request')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">{t('Tìm mã SKU / Vùng', 'Search SKU / Origin')}</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('vd: RO-S18-HON', 'e.g. RO-S18-HON')}
                className="w-full border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 bg-white dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]"
              />
            </div>
          </div>
        </div>

        {/* 27-SKU Catalog Grid */}
        {loading ? (
          <div className="py-12 text-center text-sm text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Đang tải dữ liệu ma trận...', 'Loading green coffee matrix...')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#00552B] dark:text-[#C6A667]">{p.sku}</span>
                    <span className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                      {p.status === 'active'
                        ? t('Lô tham chiếu hoạt động', 'Active Lot')
                        : t('Đặt hàng cấu hình', 'Configurable')}
                    </span>
                  </div>

                  <Link to={localePath(`/product/${p.slug}`)} className="block text-base font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                    {lang === 'vi' ? p.name_vi : p.name_en}
                  </Link>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-[#202020]/75 dark:text-[#F1EFEA]/75 border-t border-[#202020]/8 dark:border-white/10">
                    <div>
                      <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50 block">{t('Phân loại', 'Type')}</span>
                      <span className="font-medium">{localizeCoffeeType(p.coffee_type, lang)}</span>
                    </div>
                    <div>
                      <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50 block">{t('Sàng & Chế biến', 'Screen & Process')}</span>
                      <span className="font-medium">{p.screen_size} · {p.processing_method}</span>
                    </div>
                    <div>
                      <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50 block">{t('Độ ẩm / Tỷ trọng', 'Moisture / Density')}</span>
                      <span className="font-medium text-[11px]">{p.moisture_content}</span>
                    </div>
                    <div>
                      <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50 block">{t('Đóng gói', 'Packaging')}</span>
                      <span className="font-medium text-[11px] flex items-center gap-1">
                        <Package className="w-3 h-3" /> 30 / 60 / 69 / 1,000kg
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#202020]/8 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Giá tham chiếu / kg', 'Ref. Price / kg')}</span>
                    <span className="font-mono font-bold text-sm text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                      {formatPrice(p.price_vnd, p.price_usd)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openModal(p, 'sample_request')}
                      className="py-2 px-3 bg-[#00552B] text-white text-xs font-semibold rounded hover:bg-[#003D25] cursor-pointer"
                    >
                      {t('Yêu cầu mẫu', 'Request Sample')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal(p, 'green_quotation')}
                      className="py-2 px-3 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-xs font-semibold rounded hover:bg-[#00552B]/5 cursor-pointer"
                    >
                      {t('Yêu cầu báo giá', 'Get Quotation')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <Link to={localePath(`/product/${p.slug}`)} className="inline-flex items-center gap-1 text-[#00552B] dark:text-[#C6A667] hover:underline">
                      <FileText className="w-3.5 h-3.5" /> {t('Chi tiết kỹ thuật', 'Full Spec')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => downloadSpecSheet(p)}
                      className="inline-flex items-center gap-1 text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#202020] dark:hover:text-white cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> {t('Tải Spec (.txt)', 'Download Spec')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <B2BInquiryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        productSku={selectedProduct?.sku || 'GREEN-COFFEE-GENERAL'}
        productTitle={selectedProduct ? (lang === 'vi' ? selectedProduct.name_vi : selectedProduct.name_en) : 'Green Coffee Beans'}
      />
    </div>
  );
};
