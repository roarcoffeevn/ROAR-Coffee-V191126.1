import React, { useEffect, useState } from 'react';
import { CalendarCheck2, CheckCircle2, Flame, Gift, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

const DEFAULT_SCHEDULE = [
  { day: 1, points: 10, bonusVi: '', bonusEn: '' },
  { day: 2, points: 15, bonusVi: '', bonusEn: '' },
  { day: 3, points: 40, bonusVi: 'Bonus 3 ngày!', bonusEn: '3-Day Bonus!' },
  { day: 4, points: 20, bonusVi: '', bonusEn: '' },
  { day: 5, points: 25, bonusVi: '', bonusEn: '' },
  { day: 6, points: 30, bonusVi: '', bonusEn: '' },
  { day: 7, points: 100, bonusVi: 'Quà VIP 7 ngày!', bonusEn: '7-Day VIP Gift!' },
];

export const DailyCheckinGame: React.FC<{ onRewardClaimed?: () => void }> = ({ onRewardClaimed }) => {
  const { lang, t } = useI18n();
  const { apiFetch, refreshUser, showToast } = useStore();

  const [status, setStatus] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [celebration, setCelebration] = useState<string>('');

  const loadStatus = async () => {
    const res = await apiFetch('/api/checkin/status');
    if (res.ok) {
      setStatus(await res.json());
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCheckin = async () => {
    if (claiming || status?.checkedInToday) return;
    setClaiming(true);
    try {
      const res = await apiFetch('/api/checkin', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        const msg =
          lang === 'en'
            ? `Check-in Day ${d.streakDay} complete! +${d.pointsAwarded} pts${d.bonusEn ? ` · ${d.bonusEn}` : ''}`
            : `Điểm danh ngày ${d.streakDay} thành công! Nhận +${d.pointsAwarded} điểm${d.bonusVi ? ` · ${d.bonusVi}` : ''}`;
        setCelebration(msg);
        showToast(msg);
        await Promise.all([loadStatus(), refreshUser()]);
        onRewardClaimed?.();
      } else {
        showToast(d.error || t('Bạn đã điểm danh hôm nay rồi!', 'Already checked in today!'));
      }
    } finally {
      setClaiming(false);
    }
  };

  const schedule = status?.schedule || DEFAULT_SCHEDULE;
  const currentStreak = Number(status?.currentStreak || 0);
  const checkedInToday = Boolean(status?.checkedInToday);
  const completedInCycle = checkedInToday
    ? ((currentStreak - 1) % 7) + 1
    : currentStreak % 7;
  const activeDay = checkedInToday ? completedInCycle : (currentStreak % 7) + 1;
  const todayReward = schedule[activeDay - 1] || schedule[0];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#16221C] border border-[#00552B]/20 dark:border-[#C6A667]/30 p-5 sm:p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00552B] dark:text-[#C6A667]">
            <CalendarCheck2 className="w-4 h-4" />
            <span>{t('GAME ĐIỂM DANH HÀNG NGÀY · NHẬN ĐIỂM & QUÀ ROAR', 'DAILY CHECK-IN GAME · EARN POINTS & GIFTS')}</span>
          </div>
          <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">
            {t(
              'Điểm danh mỗi ngày để tích điểm đổi cà phê. Chuỗi 3 ngày tặng Bonus +40 điểm, chuỗi 7 ngày nhận Quà VIP +100 điểm & Voucher -15%!',
              'Check in daily to earn points. Hit a 3-day streak for +40 bonus pts and 7 days for +100 VIP pts & a 15% OFF voucher!'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>
              {t(`Chuỗi ${currentStreak} ngày`, `${currentStreak}-Day Streak`)}
            </span>
          </div>
          <button
            type="button"
            disabled={claiming || checkedInToday}
            onClick={handleCheckin}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              checkedInToday
                ? 'bg-[#00552B]/15 text-[#00552B] dark:text-[#C6A667] cursor-default'
                : 'bg-[#00552B] hover:bg-[#003D25] text-white shadow-md hover:scale-[1.02]'
            }`}
          >
            {checkedInToday ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('Đã điểm danh hôm nay', 'Checked In Today')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C6A667]" />
                <span>
                  {claiming
                    ? t('Đang nhận quà...', 'Claiming...')
                    : t(`Điểm danh (+${todayReward.points} điểm)`, `Check In (+${todayReward.points} pts)`)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {celebration && (
        <div className="p-3 rounded-xl bg-[#00552B] text-white text-xs font-semibold flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#C6A667] shrink-0" />
          <span>{celebration}</span>
        </div>
      )}

      {/* 7-Day Interactive Streak Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {schedule.map((s: any) => {
          const isDone = s.day <= completedInCycle;
          const isToday = !checkedInToday && s.day === activeDay;
          const isMilestone = s.day === 3 || s.day === 7;
          return (
            <button
              key={s.day}
              type="button"
              disabled={!isToday || claiming}
              onClick={() => isToday && handleCheckin()}
              className={`relative rounded-xl p-3 border text-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                isDone
                  ? 'bg-[#00552B]/10 dark:bg-[#00552B]/30 border-[#00552B] dark:border-[#C6A667]'
                  : isToday
                  ? 'bg-[#C6A667]/20 border-[#C6A667] ring-2 ring-[#C6A667]/50 cursor-pointer hover:scale-[1.02]'
                  : isMilestone
                  ? 'bg-[#F8F5EF] dark:bg-[#0E1512] border-[#C6A667]/45'
                  : 'bg-[#F8F5EF]/70 dark:bg-[#0E1512]/70 border-[#202020]/10 dark:border-white/10'
              }`}
            >
              {isMilestone && (
                <span className="absolute -top-2 right-1.5 px-1.5 py-0.5 rounded-full bg-[#C6A667] text-[#111111] text-[9px] font-extrabold uppercase">
                  {s.day === 7 ? 'VIP' : 'BONUS'}
                </span>
              )}
              <span className="text-[11px] font-semibold text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t(`Ngày ${s.day}`, `Day ${s.day}`)}
              </span>
              <div className="my-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00552B] dark:text-[#C6A667] mx-auto" />
                ) : isMilestone ? (
                  <Gift className="w-5 h-5 text-[#C6A667] mx-auto" />
                ) : (
                  <Sparkles className={`w-5 h-5 mx-auto ${isToday ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020]/35 dark:text-white/30'}`} />
                )}
              </div>
              <span className="font-mono text-xs font-extrabold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                +{s.points} {t('điểm', 'pts')}
              </span>
              {s.day === 7 && (
                <span className="text-[9px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65 leading-tight">
                  + Voucher -15%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
