import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { hasAdminPermission } from '../lib/rbac';

export const AdminPageEditLink: React.FC<{ slug: string; dark?: boolean }> = ({ slug, dark = false }) => {
  const { t } = useI18n();
  const { user } = useStore();

  if (!hasAdminPermission(user, 'pages')) return null;

  return (
    <Link
      to={`/admin?section=pages&page=${encodeURIComponent(slug)}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
        dark
          ? 'bg-[#C6A667]/15 border-[#C6A667]/40 text-[#C6A667] hover:bg-[#C6A667] hover:text-[#111111]'
          : 'bg-[#00552B]/10 dark:bg-[#C6A667]/15 border-[#00552B]/25 dark:border-[#C6A667]/35 text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white dark:hover:bg-[#C6A667] dark:hover:text-[#111111]'
      }`}
    >
      <Edit3 className="w-3.5 h-3.5" />
      <span>{t('Chỉnh sửa trang này trong CMS', 'Edit Page in CMS')}</span>
    </Link>
  );
};
