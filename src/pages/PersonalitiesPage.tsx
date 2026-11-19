import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const PersonalitiesPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { lang, t, localePath } = useI18n();
  const { personalities, setCustomBreadcrumb } = useStore();

  const selected = slug ? personalities.find((p) => p.slug === slug) : null;

  useEffect(() => {
    if (!selected) {
      setCustomBreadcrumb(null);
      return;
    }
    setCustomBreadcrumb([
      { labelVi: '7 Cá Tính Thương Hiệu', labelEn: 'Seven Personalities', to: '/personalities' },
      { labelVi: selected.animal_vi, labelEn: selected.animal_en },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [selected, setCustomBreadcrumb]);

  if (slug && selected) {
    const isPanther = selected.slug === 'black-panther';
    return (
      <div className={isPanther ? 'bg-[#0B0B0B] text-[#F8F5EF]' : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]'}>
        <div className="max-w-[1100px] mx-auto px-6 py-14 space-y-10">
          <Link
            to={localePath('/personalities')}
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              isPanther ? 'text-[#C6A667] hover:underline' : 'text-[#00552B] dark:text-[#C6A667] hover:underline'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Tất cả 7 Cá Tính ROAR', 'All Seven Personalities')}</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div
                className={`aspect-square rounded-2xl overflow-hidden border ${
                  isPanther ? 'border-[#C6A667]/40 bg-[#141414]' : 'border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C]'
                }`}
              >
                <MediaImage
                  imageKey={selected.custom_image_url || selected.image_key}
                  alt={`${selected.animal_en} — ${selected.animal_vi}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                {t('7 Cá Tính – 7 Dấu Ấn Riêng', 'Seven Personalities. Seven Distinct Characters.')}
              </p>
              <h1 className="text-4xl font-bold">
                {lang === 'vi' ? selected.animal_vi : `${selected.animal_en} — ${selected.animal_vi}`}
              </h1>
              <p className={`text-sm font-medium ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                {lang === 'vi' ? selected.traits_vi : selected.traits_en}
              </p>
              <p className={`text-base leading-relaxed whitespace-pre-line ${isPanther ? 'text-[#F8F5EF]/85' : 'text-[#202020]/80 dark:text-[#F1EFEA]/80'}`}>
                {lang === 'vi' ? selected.story_vi : selected.story_en}
              </p>

              <div className={`p-5 rounded-xl border ${isPanther ? 'bg-[#141414] border-[#C6A667]/30' : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10'}`}>
                <span className="text-xs opacity-60 block mb-1">{t('Dòng sản phẩm liên kết', 'Product Association')}</span>
                <p className="text-base font-bold">
                  {lang === 'vi' ? selected.product_association_vi : selected.product_association_en}
                </p>
                {selected.is_future_collection === 1 ? (
                  <p className="text-xs opacity-70 mt-2">
                    {t(
                      'Thuộc bộ sưu tập tương lai. ROAR COFFEE chỉ công bố sản phẩm thương mại sau khi hoàn tất phê duyệt công thức.',
                      'Reserved for a future ROAR COFFEE release. No commercial SKU is launched prior to final formulation approval.'
                    )}
                  </p>
                ) : (
                  <Link
                    to={localePath(selected.slug === 'black-panther' ? '/signature-reserve' : `/product/${selected.associated_product_slug}`)}
                    className={`inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded text-xs font-semibold ${
                      isPanther ? 'bg-[#C6A667] text-[#111111]' : 'bg-[#00552B] text-white'
                    }`}
                  >
                    <span>{t('Khám phá sản phẩm gắn kết', 'Explore Associated Coffee')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-14 space-y-12">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
          {t('7 CÁ TÍNH – 7 DẤU ẤN RIÊNG', 'SEVEN PERSONALITIES. SEVEN DISTINCT CHARACTERS.')}
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance">
          {t('Bảy Biểu Tượng Cá Tính Của ROAR COFFEE', 'The Seven Archetypes of ROAR COFFEE')}
        </h1>
        <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
          {t(
            'Mỗi tách cà phê phản chiếu một bản lĩnh riêng: từ sự quyết đoán của Hổ, khí chất Sư Tử, nét linh hoạt của Cáo, tầm nhìn Đại Bàng, sự kiên định của Sói, chiều sâu trí tuệ của Cú Mèo đến vẻ quý hiếm của Báo Đen.',
            'Every cup reflects a distinct character — uniting the boldness of the Tiger, the authority of the Lion, the agility of the Fox, the vision of the Eagle, the resilience of the Wolf, the quiet wisdom of the Owl, and the exclusivity of the Black Panther.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {personalities.map((m) => {
          const isPanther = m.slug === 'black-panther';
          return (
            <div
              key={m.slug}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-1 ${
                isPanther
                  ? 'bg-[#111111] text-[#F8F5EF] border-[#C6A667]/40 md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-12'
                  : 'bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA] border-[#202020]/10 dark:border-white/10'
              }`}
            >
              <div className={isPanther ? 'lg:col-span-4 aspect-square' : 'aspect-square bg-[#F8F5EF] dark:bg-[#0E1512]'}>
                <MediaImage
                  imageKey={m.custom_image_url || m.image_key}
                  alt={`${m.animal_en} — ${m.animal_vi}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className={`${isPanther ? 'lg:col-span-8 p-8 flex flex-col justify-center' : 'p-6 flex-1 flex flex-col justify-between'} space-y-4`}>
                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                    {lang === 'vi' ? m.traits_vi : m.traits_en}
                  </p>
                  <h2 className="text-2xl font-bold">
                    {lang === 'vi' ? m.animal_vi : `${m.animal_en} · ${m.animal_vi}`}
                  </h2>
                  <p className={`text-sm leading-relaxed whitespace-pre-line line-clamp-6 ${isPanther ? 'text-[#F8F5EF]/80' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75'}`}>
                    {lang === 'vi' ? m.story_vi : m.story_en}
                  </p>
                </div>

                <div className="pt-3 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium opacity-80">
                    {t('Liên kết:', 'Association:')} <strong>{lang === 'vi' ? m.product_association_vi : m.product_association_en}</strong>
                  </span>
                  <Link
                    to={localePath(`/personalities/${m.slug}`)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${
                      isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                    }`}
                  >
                    <span>{t('Xem câu chuyện', 'Read Story')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
