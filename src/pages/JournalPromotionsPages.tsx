import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, Search, Tag } from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { localizeJournalCategory } from '../lib/i18nHelpers';
import { fetchArticleBySlugWithFallback, fetchJournalWithFallback, fetchPromotionsWithFallback } from '../lib/staticFallback';

export const PromotionsPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { showToast } = useStore();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionsWithFallback()
      .then((list) => setPromotions(list))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(t(`Đã sao chép mã ${code}`, `Copied voucher code ${code}`));
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-14 space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
          {t('Ưu đãi & Voucher Đang Hoạt Động', 'Active Promotions & Vouchers')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA]">
          {t('Chương Trình Ưu Đãi ROAR COFFEE', 'ROAR COFFEE Offers')}
        </h1>
        <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75">
          {t(
            'Chỉ hiển thị các chiến dịch còn hiệu lực theo ngày hệ thống. Nhập mã tại trang Thanh toán.',
            'Only currently valid campaigns are displayed. Apply voucher codes directly during checkout.'
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Đang tải ưu đãi...', 'Loading promotions...')}</p>
      ) : promotions.length === 0 ? (
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-10 text-center text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
          {t('Hiện chưa có chương trình khuyến mãi đang mở.', 'No active promotions are currently running.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((p) => (
            <div key={p.id} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                    <Tag className="w-3.5 h-3.5" /> {p.code}
                  </span>
                  <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55">{t('Hạn:', 'Ends')} {p.end_date}</span>
                </div>
                <h2 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? p.title_vi : p.title_en}</h2>
                <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">{lang === 'vi' ? p.description_vi : p.description_en}</p>
                <div className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 pt-2 border-t border-[#202020]/8 dark:border-white/10 space-y-1">
                  <p>{t('Điều kiện:', 'Terms:')} {lang === 'vi' ? p.terms_vi : p.terms_en}</p>
                  {p.min_order_value > 0 && (
                    <p className="tabular-nums">{t('Đơn tối thiểu:', 'Min order:')} {p.min_order_value.toLocaleString()} ₫</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => copyCode(p.code)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-xs font-semibold rounded hover:bg-[#00552B]/5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {t('Sao chép mã', 'Copy Code')}
                </button>
                <Link
                  to={localePath('/shop')}
                  className="flex-1 text-center py-2 bg-[#00552B] text-white text-xs font-semibold rounded hover:bg-[#003D25]"
                >
                  {t('Mua ngay', 'Shop Now')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const JournalPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<any[]>([]);
  const [category, setCategory] = useState(() => searchParams.get('category') || 'all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const qCat = searchParams.get('category');
    if (qCat) setCategory(qCat);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    fetchJournalWithFallback(params).then((list) => setArticles(list));
  }, [category, search]);

  const categories = ['all', 'Coffee processing', 'Coffee varieties', 'Brewing techniques', 'Coffee knowledge', 'Coffee origins'];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {t('Tạp chí Cà phê Song ngữ', 'Bilingual Editorial Platform')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Tạp Chí Cà Phê ROAR', 'ROAR Coffee Journal')}
          </h1>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#202020]/45 dark:text-[#F1EFEA]/45 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Tìm bài viết...', 'Search articles...')}
            className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg pl-9 pr-3 py-2 text-xs text-[#202020] dark:text-[#F1EFEA]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              category === c ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 text-[#202020]/80 dark:text-[#F1EFEA]/80'
            }`}
          >
            {c === 'all' ? t('Tất cả chuyên mục', 'All Topics') : localizeJournalCategory(c, lang)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((a) => (
          <Link
            key={a.id}
            to={localePath(`/journal/${a.slug}`)}
            className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
          >
            <div className="aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden">
              <MediaImage imageKey={a.image_key} alt={lang === 'vi' ? a.title_vi : a.title_en} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs text-[#202020]/55 dark:text-[#F1EFEA]/55 flex items-center gap-2">
                  <span>{localizeJournalCategory(a.category, lang)}</span>
                  <span>·</span>
                  <span>{a.read_minutes} {t('phút đọc', 'min read')}</span>
                </div>
                <h2 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? a.title_vi : a.title_en}</h2>
                <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-3">{lang === 'vi' ? a.excerpt_vi : a.excerpt_en}</p>
              </div>
              <span className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] pt-2">{t('Đọc tiếp →', 'Read More →')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const JournalArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t, localePath } = useI18n();
  const { setCustomBreadcrumb } = useStore();
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetchArticleBySlugWithFallback(slug).then((d) => {
      if (d) {
        setArticle(d.article);
        setRelated(d.related || []);
        document.title = `${lang === 'vi' ? d.article.title_vi : d.article.title_en} | ROAR COFFEE®`;
      }
    });
  }, [slug, lang]);

  useEffect(() => {
    if (!article) return;
    setCustomBreadcrumb([
      { labelVi: 'Tạp chí Cà phê', labelEn: 'Coffee Journal', to: '/journal' },
      {
        labelVi: localizeJournalCategory(article.category, 'vi'),
        labelEn: localizeJournalCategory(article.category, 'en'),
        to: `/journal?category=${encodeURIComponent(article.category)}`,
      },
      { labelVi: article.title_vi, labelEn: article.title_en },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [article, setCustomBreadcrumb]);

  if (!article) {
    return <div className="max-w-[820px] mx-auto px-6 py-20 text-center text-sm">{t('Đang tải bài viết...', 'Loading article...')}</div>;
  }

  return (
    <article className="max-w-[880px] mx-auto px-6 py-14 space-y-8">
      <Link to={localePath('/journal')} className="inline-flex items-center gap-1.5 text-xs text-[#00552B] dark:text-[#C6A667] hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> {t('Quay lại Tạp Chí Cà Phê', 'Back to Coffee Journal')}
      </Link>

      <header className="space-y-3">
        <div className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#00552B] dark:text-[#C6A667]">{localizeJournalCategory(article.category, lang)}</span>
          <span>·</span>
          <span>{article.author}</span>
          <span>·</span>
          <span>{article.read_minutes} {t('phút đọc', 'min read')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] leading-tight">
          {lang === 'vi' ? article.title_vi : article.title_en}
        </h1>
        <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75">{lang === 'vi' ? article.excerpt_vi : article.excerpt_en}</p>
      </header>

      <div className="max-w-lg mx-auto aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10">
        <MediaImage imageKey={article.image_key} alt={lang === 'vi' ? article.title_vi : article.title_en} className="w-full h-full object-cover" />
      </div>

      <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-10 space-y-5 text-base text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed whitespace-pre-line">
        {lang === 'vi' ? article.content_vi : article.content_en}
      </div>

      {related.length > 0 && (
        <section className="pt-6 border-t border-[#202020]/10 dark:border-white/10 space-y-4">
          <h2 className="text-xl font-bold dark:text-[#F1EFEA]">{t('Bài viết liên quan', 'Related Articles')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <Link key={r.id} to={localePath(`/journal/${r.slug}`)} className="bg-white dark:bg-[#16221C] p-4 rounded-xl border border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40">
                <span className="text-[11px] text-[#00552B] dark:text-[#C6A667]">{localizeJournalCategory(r.category, lang)}</span>
                <h3 className="text-sm font-bold mt-1 dark:text-[#F1EFEA]">{lang === 'vi' ? r.title_vi : r.title_en}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
