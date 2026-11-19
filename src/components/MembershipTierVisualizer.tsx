import React from 'react';
import { Award, CheckCircle2, Crown, Lock, Shield, Sparkles, Star } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export interface TierDefinition {
  key: string;
  dbName: string;
  labelVi: string;
  labelEn: string;
  minSpendVnd: number;
  minPoints: number;
  multiplier: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  benefitsVi: string[];
  benefitsEn: string[];
}

const ROAR_TIERS: TierDefinition[] = [
  {
    key: 'bronze',
    dbName: 'ROAR Member',
    labelVi: 'ROAR Đồng (Member)',
    labelEn: 'ROAR Bronze (Member)',
    minSpendVnd: 0,
    minPoints: 0,
    multiplier: '1.0x',
    accentBg: 'bg-amber-900/10 dark:bg-amber-700/20',
    accentText: 'text-amber-800 dark:text-amber-300',
    accentBorder: 'border-amber-700/30',
    benefitsVi: [
      'Tích 1.0x điểm cho mọi đơn hàng hợp lệ',
      'Nạp Ví ROAR tặng thưởng +10% đến +30%',
      'Nhận mã ưu đãi chào mừng & bản tin mùa vụ',
    ],
    benefitsEn: [
      'Earn 1.0x points on every eligible order',
      'ROAR Wallet top-up bonuses from +10% to +30%',
      'Welcome voucher & seasonal harvest dispatches',
    ],
  },
  {
    key: 'silver',
    dbName: 'ROAR Silver',
    labelVi: 'ROAR Bạc (Silver)',
    labelEn: 'ROAR Silver',
    minSpendVnd: 2000000,
    minPoints: 200,
    multiplier: '1.25x',
    accentBg: 'bg-slate-200/70 dark:bg-slate-700/35',
    accentText: 'text-slate-700 dark:text-slate-200',
    accentBorder: 'border-slate-400/40',
    benefitsVi: [
      'Nhân 1.25x tốc độ tích điểm thưởng',
      'Ưu đãi sinh nhật giảm 15% toàn giỏ hàng',
      'Freeship cho đơn hàng từ 400.000₫',
    ],
    benefitsEn: [
      '1.25x accelerated reward points multiplier',
      '15% birthday month discount storewide',
      'Complimentary shipping on orders from 400,000 VND',
    ],
  },
  {
    key: 'gold',
    dbName: 'ROAR Gold',
    labelVi: 'ROAR Vàng (Gold)',
    labelEn: 'ROAR Gold',
    minSpendVnd: 5000000,
    minPoints: 500,
    multiplier: '1.5x',
    accentBg: 'bg-[#C6A667]/20 dark:bg-[#C6A667]/20',
    accentText: 'text-[#8C6D2E] dark:text-[#C6A667]',
    accentBorder: 'border-[#C6A667]/60',
    benefitsVi: [
      'Nhân 1.5x điểm thưởng mọi giao dịch',
      'Freeship mọi đơn hàng toàn quốc không giới hạn',
      'Quyền mua sớm các mẻ rang giới hạn Cầu Đất',
    ],
    benefitsEn: [
      '1.5x reward points on all purchases',
      'Unlimited complimentary nationwide shipping',
      'Early access to limited Cầu Đất micro-lots',
    ],
  },
  {
    key: 'reserve',
    dbName: 'ROAR Reserve',
    labelVi: 'ROAR Thượng Hạng (Reserve)',
    labelEn: 'ROAR Reserve (VIP)',
    minSpendVnd: 12000000,
    minPoints: 1200,
    multiplier: '2.0x',
    accentBg: 'bg-[#111111] dark:bg-black',
    accentText: 'text-[#C6A667]',
    accentBorder: 'border-[#C6A667]',
    benefitsVi: [
      'Nhân 2.0x điểm thưởng cao nhất hệ thống',
      'Đặc quyền Signature Reserve & quà tặng VIP cuối năm',
      'Chuyên viên Barista & Quà tặng doanh nghiệp riêng',
    ],
    benefitsEn: [
      'Maximum 2.0x reward points multiplier',
      'Signature Reserve privileges & annual VIP gift box',
      'Dedicated Barista & executive gifting concierge',
    ],
  },
];

interface MembershipTierVisualizerProps {
  currentTierName?: string;
  lifetimeSpendVnd: number;
  lifetimePoints: number;
}

export const MembershipTierVisualizer: React.FC<MembershipTierVisualizerProps> = ({
  currentTierName,
  lifetimeSpendVnd,
  lifetimePoints,
}) => {
  const { lang, t } = useI18n();
  const { formatPrice } = useStore();

  // Resolve current tier index from either explicit tier name or lifetime spend/points
  const byNameIdx = ROAR_TIERS.findIndex(
    (tr) => tr.dbName.toLowerCase() === String(currentTierName || '').toLowerCase()
  );
  let computedIdx = 0;
  for (let i = ROAR_TIERS.length - 1; i >= 0; i--) {
    if (lifetimeSpendVnd >= ROAR_TIERS[i].minSpendVnd || lifetimePoints >= ROAR_TIERS[i].minPoints) {
      computedIdx = i;
      break;
    }
  }
  const activeIdx = Math.max(byNameIdx >= 0 ? byNameIdx : 0, computedIdx);
  const currentTier = ROAR_TIERS[activeIdx];
  const nextTier = activeIdx < ROAR_TIERS.length - 1 ? ROAR_TIERS[activeIdx + 1] : null;

  // Calculate progress toward next tier (best of spend or points progress)
  let progressPct = 100;
  let remainingSpendVnd = 0;
  let remainingPoints = 0;
  if (nextTier) {
    const spendSpan = Math.max(1, nextTier.minSpendVnd - currentTier.minSpendVnd);
    const spendProg = Math.min(100, Math.max(0, ((lifetimeSpendVnd - currentTier.minSpendVnd) / spendSpan) * 100));
    const ptsSpan = Math.max(1, nextTier.minPoints - currentTier.minPoints);
    const ptsProg = Math.min(100, Math.max(0, ((lifetimePoints - currentTier.minPoints) / ptsSpan) * 100));
    progressPct = Math.round(Math.max(spendProg, ptsProg));
    remainingSpendVnd = Math.max(0, nextTier.minSpendVnd - lifetimeSpendVnd);
    remainingPoints = Math.max(0, nextTier.minPoints - lifetimePoints);
  }

  return (
    <div className="space-y-5">
      {/* Current Tier Progress Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#003D25] via-[#00552B] to-[#0E1512] text-white p-5 sm:p-6 border border-[#C6A667]/35 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A667] font-semibold inline-flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>{t('HÀNH TRÌNH THĂNG HẠNG THÀNH VIÊN', 'MEMBERSHIP TIER JOURNEY')}</span>
            </p>
            <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
              <span>{lang === 'en' ? currentTier.labelEn : currentTier.labelVi}</span>
              <span className="px-2 py-0.5 rounded bg-[#C6A667] text-[#111111] font-mono text-xs font-extrabold">
                {currentTier.multiplier} {t('Điểm', 'Pts')}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div>
              <p className="text-[#F8F5EF]/65">{t('Tổng chi tiêu tích lũy', 'Lifetime Spend')}</p>
              <p className="text-base font-mono font-bold text-white tabular-nums">{formatPrice(lifetimeSpendVnd)}</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-[#F8F5EF]/65">{t('Điểm tích lũy', 'Lifetime Points')}</p>
              <p className="text-base font-mono font-bold text-[#C6A667] tabular-nums">
                {lifetimePoints.toLocaleString('vi-VN')} {t('điểm', 'pts')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar toward Next Tier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F8F5EF]/90">
              {nextTier
                ? t(
                    `Tiến độ lên hạng ${nextTier.labelVi}`,
                    `Progress to ${nextTier.labelEn}`
                  )
                : t('Bạn đã đạt hạng thành viên cao nhất tại ROAR COFFEE®!', 'You have reached the highest ROAR COFFEE® VIP tier!')}
            </span>
            <span className="font-mono font-bold text-[#C6A667] tabular-nums">{progressPct}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/35 border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C6A667] via-[#e5ca8e] to-[#C6A667] transition-all duration-700"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>

          {nextTier && (
            <p className="text-[11px] text-[#F8F5EF]/75">
              {t(
                `Cần thêm ${formatPrice(remainingSpendVnd)} chi tiêu hoặc ${remainingPoints.toLocaleString('vi-VN')} điểm để mở khóa hạng ${nextTier.labelVi} (${nextTier.multiplier} điểm).`,
                `Spend ${formatPrice(remainingSpendVnd)} more or earn ${remainingPoints.toLocaleString('vi-VN')} more points to unlock ${nextTier.labelEn} (${nextTier.multiplier} pts).`
              )}
            </p>
          )}
        </div>

        {/* 4-Stage Milestone Stepper */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/15">
          {ROAR_TIERS.map((tr, idx) => {
            const unlocked = idx <= activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={tr.key}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-[#C6A667]/20 border-[#C6A667] text-white'
                    : unlocked
                    ? 'bg-white/8 border-white/20 text-[#F8F5EF]/90'
                    : 'bg-black/20 border-white/10 text-[#F8F5EF]/45'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                  {unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A667] shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 opacity-60 shrink-0" />
                  )}
                  <span className="truncate">{lang === 'en' ? tr.labelEn.split(' ')[1] : tr.labelVi.split(' ')[1]}</span>
                </div>
                <p className="text-[10px] font-mono mt-0.5 tabular-nums opacity-80">
                  {tr.minSpendVnd === 0 ? t('Khởi đầu', 'Start') : formatPrice(tr.minSpendVnd)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exclusive Tier Benefits Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ROAR_TIERS.map((tr, idx) => {
          const isCurrent = idx === activeIdx;
          const unlocked = idx <= activeIdx;
          const Icon = idx === 3 ? Crown : idx === 2 ? Award : idx === 1 ? Star : Shield;
          return (
            <div
              key={tr.key}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                isCurrent
                  ? 'border-[#00552B] dark:border-[#C6A667] ring-1 ring-[#00552B] dark:ring-[#C6A667] bg-white dark:bg-[#16221C] shadow-md'
                  : 'border-[#202020]/10 dark:border-white/10 bg-white/80 dark:bg-[#16221C]/70'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${tr.accentBg} ${tr.accentText} ${tr.accentBorder}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tr.multiplier}</span>
                  </span>
                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#00552B] text-white text-[10px] font-bold">
                      {t('Hạng hiện tại', 'Current')}
                    </span>
                  ) : unlocked ? (
                    <span className="text-[10px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('Đã mở khóa', 'Unlocked')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#202020]/45 dark:text-[#F1EFEA]/45 font-mono">
                      {formatPrice(tr.minSpendVnd)}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
                    {lang === 'en' ? tr.labelEn : tr.labelVi}
                  </h4>
                  <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 font-mono mt-0.5">
                    {tr.minSpendVnd === 0
                      ? t('Miễn phí đăng ký', 'Free to join')
                      : t(
                          `Từ ${formatPrice(tr.minSpendVnd)} hoặc ${tr.minPoints} điểm`,
                          `From ${formatPrice(tr.minSpendVnd)} or ${tr.minPoints} pts`
                        )}
                  </p>
                </div>

                <ul className="space-y-1.5 pt-1 border-t border-[#202020]/10 dark:border-white/10 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80">
                  {(lang === 'en' ? tr.benefitsEn : tr.benefitsVi).map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-1.5 leading-snug">
                      <Sparkles className="w-3 h-3 text-[#C6A667] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
