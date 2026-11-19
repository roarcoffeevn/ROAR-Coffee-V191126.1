import React, { useEffect, useState } from 'react';
import { Coins, PlusCircle, RefreshCw, Wallet } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const AdminWalletPointsPanel: React.FC<{ onGoProducts?: () => void }> = ({ onGoProducts }) => {
  const { t } = useI18n();
  const { apiFetch, showToast } = useStore();
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [amountVnd, setAmountVnd] = useState<string>('500000');
  const [pointsDelta, setPointsDelta] = useState<string>('0');
  const [applyBonus, setApplyBonus] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/wallets');
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d.members) ? d.members : [];
        setMembers(list);
        setTransactions(Array.isArray(d.transactions) ? d.transactions : []);
        if (!selectedUserId && list.length > 0) {
          setSelectedUserId(list[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/admin/wallets/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          amountVnd: Number(amountVnd || 0),
          pointsDelta: Number(pointsDelta || 0),
          applyBonus,
          note,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(t('Đã cập nhật Ví & Điểm thành viên thành công!', 'Updated member wallet & points!'));
        setNote('');
        setPointsDelta('0');
        await loadWallets();
      } else {
        showToast(d.error || t('Không thể cập nhật Ví', 'Failed to update wallet'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#00552B]" />
            <span>{t('Quản lý Ví Thành Viên, Nạp Tiền (+10%–30%) & Điểm Thưởng', 'Member Wallet, Top-up (+10%–30%) & Points Manager')}</span>
          </h3>
          <p className="text-slate-500 mt-0.5">
            {t(
              'Nạp tiền vào Ví ROAR cho khách hàng, cộng/trừ điểm thưởng quy đổi mua hàng và theo dõi toàn bộ giao dịch Ví.',
              'Top up ROAR member wallets, adjust redeemable reward points, and audit all wallet transactions.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onGoProducts && (
            <button
              type="button"
              onClick={onGoProducts}
              className="px-3 py-1.5 rounded-lg bg-[#C6A667]/20 text-[#00552B] font-semibold hover:bg-[#C6A667]/30 cursor-pointer"
            >
              {t('Sửa 4 sản phẩm Gift Voucher (50k–1tr)', 'Edit Gift Voucher Products')}
            </button>
          )}
          <button
            type="button"
            onClick={loadWallets}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Làm mới', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Quick Admin Top-up / Points Adjust Form */}
      <form onSubmit={handleAdjust} className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">{t('Chọn thành viên', 'Select Member')}</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.email}) — Ví: {Number(m.wallet_balance_vnd || 0).toLocaleString('vi-VN')}₫ · {m.points?.available || 0} điểm
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">{t('Nạp / Trừ Ví (VNĐ)', 'Wallet Amount (VND)')}</label>
          <input
            type="number"
            step={50000}
            value={amountVnd}
            onChange={(e) => setAmountVnd(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">{t('Cộng / Trừ Điểm', 'Points Delta')}</label>
          <input
            type="number"
            value={pointsDelta}
            onChange={(e) => setPointsDelta(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-mono"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={submitting || !selectedUserId}
            className="w-full py-2 px-3 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{submitting ? t('Đang lưu...', 'Saving...') : t('Nạp Ví / Cộng Điểm', 'Apply Adjustment')}</span>
          </button>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Ghi chú giao dịch (vd: Nạp gói Gold +20% tại quầy / Chuyển khoản)', 'Transaction note (e.g. Gold pack top-up)')}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
          />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={applyBonus}
            onChange={(e) => setApplyBonus(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span>{t('Tự động cộng thưởng +10% đến +30% & tích điểm theo gói nạp', 'Auto-apply +10% to +30% bonus & points')}</span>
        </label>
      </form>

      {/* Members Balance Table + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#00552B]" />
            <span>{t(`Số dư Ví & Điểm (${members.length} thành viên)`, `Member Balances (${members.length})`)}</span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id} className="px-3.5 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{m.full_name} <span className="font-mono text-[10px] text-slate-400">({m.member_code})</span></p>
                  <p className="text-[11px] text-slate-500 truncate">{m.email} · {m.tier}</p>
                </div>
                <div className="text-right font-mono shrink-0">
                  <p className="font-bold text-[#00552B]">{Number(m.wallet_balance_vnd || 0).toLocaleString('vi-VN')}₫</p>
                  <p className="text-[10px] text-amber-600 font-semibold">{(m.points?.available || 0).toLocaleString('vi-VN')} {t('điểm', 'pts')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
            {t(`Lịch sử Nạp tiền & Giao dịch Ví (${transactions.length})`, `Wallet Transaction Log (${transactions.length})`)}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <p className="p-4 text-slate-400 text-center">{t('Chưa có giao dịch Ví nào.', 'No wallet transactions yet.')}</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="px-3.5 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{tx.full_name} — {tx.note}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.reference_code} · {tx.created_at}</p>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <p className={`font-bold ${tx.tx_type === 'spend' ? 'text-rose-600' : 'text-[#00552B]'}`}>
                      {tx.tx_type === 'spend'
                        ? `-${Math.abs(Number(tx.amount_vnd || 0)).toLocaleString('vi-VN')}₫`
                        : `+${(Number(tx.amount_vnd || 0) + Number(tx.bonus_vnd || 0)).toLocaleString('vi-VN')}₫`}
                    </p>
                    {tx.points_delta > 0 && <p className="text-[10px] text-amber-600">+{tx.points_delta} {t('điểm', 'pts')}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
