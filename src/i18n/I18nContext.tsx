import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type Lang = 'vi' | 'en';

interface I18nContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (vi: string, en: string) => string;
  localePath: (path: string) => string;
  stripLocale: (pathname: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en' || pathname === '/vi') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3);
  if (pathname.startsWith('/vi/')) return pathname.slice(3);
  return pathname || '/';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const lang: Lang = useMemo(() => {
    if (location.pathname === '/en' || location.pathname.startsWith('/en/')) return 'en';
    return 'vi';
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.lang = lang;
    const baseTitle =
      lang === 'vi'
        ? 'ROAR COFFEE® — Khơi Bản Lĩnh. Đậm Chất Riêng.'
        : 'ROAR COFFEE® — Igniting Courage. Defining Character.';
    if (!location.pathname.includes('/product/') && !location.pathname.includes('/journal/')) {
      document.title = baseTitle;
    }
  }, [lang, location.pathname]);

  const setLang = (next: Lang) => {
    if (next === lang) return;
    const savedY = typeof window !== 'undefined' ? window.scrollY : 0;
    const clean = stripLocalePrefix(location.pathname);
    const targetPath = next === 'en' ? (clean === '/' ? '/en' : `/en${clean}`) : clean;
    navigate(`${targetPath}${location.search}${location.hash}`, { replace: true });
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior });
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior });
        });
      });
    }
  };

  const localePath = (targetPath: string) => {
    const normalized = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    if (normalized === '/admin' || normalized.startsWith('/admin/')) return normalized;
    if (lang === 'en') {
      return normalized === '/' ? '/en' : `/en${normalized}`;
    }
    return normalized;
  };

  const t = (vi: string, en: string) => (lang === 'vi' ? vi : en);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, localePath, stripLocale: stripLocalePrefix }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
