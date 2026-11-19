import React, { useState } from 'react';
import {
  Check,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';
import {
  ADMIN_PERMISSION_META,
  ADMIN_ROLE_PRESETS,
  ALL_ADMIN_PERMISSIONS,
  getRolePreset,
  type AdminPermission,
  type AdminRoleKey,
} from '../../lib/rbac';

export interface AdminTeamMember {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  adminRole: string;
  adminPermissions: string[];
  memberCode: string;
  tier: string;
  createdAt: string;
}

export interface NonAdminCandidate {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  member_code: string;
}

interface TeamRbacSectionProps {
  admins: AdminTeamMember[];
  nonAdmins: NonAdminCandidate[];
  auditLogs: any[];
  onRefresh: () => Promise<void>;
}

export const TeamRbacSection: React.FC<TeamRbacSectionProps> = ({
  admins,
  nonAdmins,
  auditLogs,
  onRefresh,
}) => {
  const { lang, t } = useI18n();
  const { user, apiFetch, refreshUser, showToast } = useStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [mode, setMode] = useState<'new' | 'promote'>('new');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [promoteEmail, setPromoteEmail] = useState(nonAdmins[0]?.email || '');
  const [newRole, setNewRole] = useState<AdminRoleKey>('content_editor');
  const [newPerms, setNewPerms] = useState<string[]>(getRolePreset('content_editor').permissions);
  const [submitting, setSubmitting] = useState(false);

  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<AdminRoleKey>('custom_staff');
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const handleRolePresetChange = (roleKey: AdminRoleKey, setterRole: (r: AdminRoleKey) => void, setterPerms: (p: string[]) => void) => {
    setterRole(roleKey);
    if (roleKey !== 'custom_staff') {
      setterPerms([...getRolePreset(roleKey).permissions]);
    }
  };

  const togglePerm = (perm: AdminPermission, list: string[], setter: (p: string[]) => void, setterRole: (r: AdminRoleKey) => void) => {
    const next = list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm];
    setter(next);
    setterRole('custom_staff');
  };

  const handleCreateOrPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload =
        mode === 'promote'
          ? {
              email: promoteEmail,
              adminRole: newRole,
              permissions: newPerms,
            }
          : {
              email: newEmail.trim(),
              fullName: newFullName.trim(),
              phone: newPhone.trim(),
              password: newPassword,
              adminRole: newRole,
              permissions: newPerms,
            };

      const res = await apiFetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          d.promoted
            ? t('Đã cấp quyền Quản trị CMS cho tài khoản.', 'Promoted user to CMS administrator.')
            : t('Đã tạo tài khoản Quản trị viên mới.', 'Created new CMS administrator.')
        );
        setCreateOpen(false);
        setNewEmail('');
        setNewFullName('');
        setNewPhone('');
        setNewPassword('');
        await onRefresh();
      } else {
        showToast(d.error || t('Không thể thêm thành viên quản trị.', 'Failed to add staff member.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingMember = (m: AdminTeamMember) => {
    if (editingMemberId === m.id) {
      setEditingMemberId(null);
      return;
    }
    setEditingMemberId(m.id);
    setEditRole((m.adminRole as AdminRoleKey) || 'custom_staff');
    setEditPerms([...(m.adminPermissions || [])]);
    setEditName(m.fullName);
  };

  const saveMemberRbac = async (id: number) => {
    setSavingId(id);
    try {
      const res = await apiFetch(`/api/admin/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminRole: editRole,
          permissions: editRole === 'super_admin' ? [...ALL_ADMIN_PERMISSIONS] : editPerms,
          fullName: editName,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(t('Đã cập nhật phân quyền thành viên.', 'Updated member permissions.'));
        setEditingMemberId(null);
        await onRefresh();
        if (user?.id === id) {
          await refreshUser();
        }
      } else {
        showToast(d.error || t('Không thể cập nhật phân quyền.', 'Failed to update permissions.'));
      }
    } finally {
      setSavingId(null);
    }
  };

  const revokeMember = async (m: AdminTeamMember) => {
    setSavingId(m.id);
    try {
      const res = await apiFetch(`/api/admin/team/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAdmin: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(t('Đã thu hồi quyền quản trị của tài khoản.', 'Revoked administrator privileges.'));
        setEditingMemberId(null);
        await onRefresh();
      } else {
        showToast(d.error || t('Không thể thu hồi quyền.', 'Unable to revoke admin role.'));
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 text-xs">
      {/* Top Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5 sm:space-y-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00552B]" />
            {t('Phân quyền Thành viên (RBAC)', 'Team & Access Control (RBAC)')}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {t(
              'Kiểm soát chi tiết quyền truy cập từng phân hệ CMS trên máy chủ.',
              'Assign preset roles or granular module permissions enforced live across CMS APIs.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen((o) => !o)}
          className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          {createOpen ? t('Đóng biểu mẫu', 'Close Form') : t('+ Thêm / Cấp quyền Quản trị viên', '+ Add / Promote Admin Staff')}
        </button>
      </div>

      {/* Compact Collapsible Role Preset Guide on Mobile */}
      <details className="lg:hidden bg-white rounded-xl border border-slate-200 px-3.5 py-2.5">
        <summary className="font-bold text-slate-800 cursor-pointer select-none">
          {t('Xem 5 Nhóm vai trò mẫu (RBAC Presets)', 'View 5 Role Presets Guide')}
        </summary>
        <div className="mt-2.5 grid grid-cols-1 gap-2">
          {ADMIN_ROLE_PRESETS.filter((r) => r.key !== 'custom_staff').map((preset) => (
            <div key={preset.key} className="bg-slate-50 rounded-lg border border-slate-200/80 p-2.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block">{lang === 'vi' ? preset.labelVi : preset.labelEn}</span>
                <p className="text-[11px] text-slate-500">{lang === 'vi' ? preset.descVi : preset.descEn}</p>
              </div>
              <span className="font-mono text-[11px] text-[#00552B] font-semibold tabular-nums shrink-0">
                {preset.permissions.length}/12
              </span>
            </div>
          ))}
        </div>
      </details>

      {/* Desktop Role Preset Guide Strip */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-3">
        {ADMIN_ROLE_PRESETS.filter((r) => r.key !== 'custom_staff').map((preset) => (
          <div key={preset.key} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900">{lang === 'vi' ? preset.labelVi : preset.labelEn}</span>
              <span className="font-mono text-[11px] text-[#00552B] font-semibold tabular-nums">
                {preset.permissions.length}/12
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">{lang === 'vi' ? preset.descVi : preset.descEn}</p>
          </div>
        ))}
      </div>

      {/* Add / Promote Admin Form */}
      {createOpen && (
        <form onSubmit={handleCreateOrPromote} className="bg-white rounded-xl border border-[#00552B]/30 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  mode === 'new' ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                {t('Tạo tài khoản nhân sự mới', 'Create New Staff Account')}
              </button>
              <button
                type="button"
                onClick={() => setMode('promote')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  mode === 'promote' ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                {t('Nâng cấp từ tài khoản hiện có', 'Promote Existing Account')}
              </button>
            </div>
            <button type="button" onClick={() => setCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {mode === 'new' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Họ và tên *', 'Full Name *')}</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Hoàng Nam"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@roarcoffee.vn"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Số điện thoại', 'Phone')}</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0909..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Mật khẩu (≥8 ký tự) *', 'Password (≥8 chars) *')}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-md">
              <label className="block font-semibold text-slate-700 mb-1">{t('Chọn tài khoản cần cấp quyền CMS', 'Select User Account to Promote')}</label>
              <select
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              >
                {nonAdmins.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name} ({u.email}) — {u.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role + Permission Grid */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="max-w-sm">
              <label className="block font-semibold text-slate-700 mb-1">{t('Vai trò quản trị mẫu', 'Role Preset')}</label>
              <select
                value={newRole}
                onChange={(e) => handleRolePresetChange(e.target.value as AdminRoleKey, setNewRole, setNewPerms)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold"
              >
                {ADMIN_ROLE_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {lang === 'vi' ? p.labelVi : p.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-2">{t('Chi tiết quyền truy cập từng phân hệ CMS', 'Granular Module Permissions')}</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
                {ADMIN_PERMISSION_META.map((pm) => {
                  const checked = newRole === 'super_admin' || newPerms.includes(pm.key);
                  return (
                    <label
                      key={pm.key}
                      className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        checked ? 'bg-[#00552B]/8 border-[#00552B]/35 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={newRole === 'super_admin'}
                        onChange={() => togglePerm(pm.key, newPerms, setNewPerms, setNewRole)}
                        className="accent-[#00552B]"
                      />
                      <span className="font-medium">{lang === 'vi' ? pm.labelVi : pm.labelEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer">
              {t('Hủy', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold cursor-pointer disabled:opacity-50"
            >
              {submitting ? t('Đang lưu...', 'Saving...') : t('Xác nhận Cấp quyền CMS', 'Confirm Admin Access')}
            </button>
          </div>
        </form>
      )}

      {/* Active Admin Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            {t('Danh sách Thành viên Quản trị CMS', 'Active CMS Administrators')} ({admins.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {admins.map((m) => {
            const preset = getRolePreset(m.adminRole);
            const isEditing = editingMemberId === m.id;
            const isSelf = user?.id === m.id;

            return (
              <div key={m.id} className="p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{m.fullName}</span>
                      {isSelf && (
                        <span className="text-[11px] font-semibold text-[#00552B]">
                          · {t('Đang đăng nhập', 'Current Session')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-mono">
                      {m.email} · {m.memberCode} {m.phone ? `· ${m.phone}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <span className="block font-semibold text-slate-800">{lang === 'vi' ? preset.labelVi : preset.labelEn}</span>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {m.adminRole === 'super_admin'
                          ? t('Toàn quyền 12/12 phân hệ', 'All 12/12 modules')
                          : `${m.adminPermissions.length}/12 ${t('phân hệ', 'modules')}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditingMember(m)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#00552B]" />
                      {isEditing ? t('Thu gọn', 'Close') : t('Chỉnh quyền', 'Edit Permissions')}
                    </button>
                  </div>
                </div>

                {/* Permission summary line (zero-pill unboxed metadata) */}
                {!isEditing && (
                  <p className="text-[11px] text-slate-500">
                    {m.adminRole === 'super_admin'
                      ? ADMIN_PERMISSION_META.map((p) => (lang === 'vi' ? p.labelVi : p.labelEn)).join(' · ')
                      : m.adminPermissions
                          .map((pk) => {
                            const meta = ADMIN_PERMISSION_META.find((pm) => pm.key === pk);
                            return meta ? (lang === 'vi' ? meta.labelVi : meta.labelEn) : pk;
                          })
                          .join(' · ') || t('Chưa có quyền nào', 'No permissions')}
                  </p>
                )}

                {/* Inline RBAC Editor */}
                {isEditing && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">{t('Họ tên hiển thị', 'Display Name')}</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">{t('Vai trò quản trị', 'Admin Role')}</label>
                        <select
                          value={editRole}
                          onChange={(e) => handleRolePresetChange(e.target.value as AdminRoleKey, setEditRole, setEditPerms)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                        >
                          {ADMIN_ROLE_PRESETS.map((p) => (
                            <option key={p.key} value={p.key}>
                              {lang === 'vi' ? p.labelVi : p.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
                      {ADMIN_PERMISSION_META.map((pm) => {
                        const checked = editRole === 'super_admin' || editPerms.includes(pm.key);
                        return (
                          <label
                            key={pm.key}
                            className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg border cursor-pointer ${
                              checked ? 'bg-white border-[#00552B] text-slate-900' : 'bg-slate-100/70 border-slate-200 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={editRole === 'super_admin'}
                              onChange={() => togglePerm(pm.key, editPerms, setEditPerms, setEditRole)}
                              className="accent-[#00552B]"
                            />
                            <span className="font-medium">{lang === 'vi' ? pm.labelVi : pm.labelEn}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={isSelf || savingId === m.id}
                        onClick={() => revokeMember(m)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('Thu hồi quyền Quản trị', 'Revoke Admin Role')}
                      </button>

                      <button
                        type="button"
                        disabled={savingId === m.id}
                        onClick={() => saveMemberRbac(m.id)}
                        className="px-4 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {savingId === m.id ? t('Đang lưu...', 'Saving...') : t('Lưu phân quyền', 'Save RBAC')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RBAC Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">
            {t('Nhật ký Hoạt động Quản trị viên (Audit Trail)', 'Administrator Action Audit Log')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3 text-left">{t('Thời gian', 'Timestamp')}</th>
                <th className="p-3 text-left">{t('Tài khoản thực hiện', 'Actor')}</th>
                <th className="p-3 text-left">{t('Hành động', 'Action')}</th>
                <th className="p-3 text-left">{t('Đối tượng', 'Target')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 20).map((log) => (
                <tr key={log.id}>
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">{log.created_at}</td>
                  <td className="p-3 font-medium text-slate-900">{log.actor_email}</td>
                  <td className="p-3 font-mono text-[#00552B] font-semibold">{log.action}</td>
                  <td className="p-3 text-slate-600 font-mono">
                    {log.entity_type} #{log.entity_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
