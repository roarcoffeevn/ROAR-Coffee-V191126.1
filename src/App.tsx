import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AdaptiveLogo } from './components/AdaptiveLogo';
import { Breadcrumb } from './components/Breadcrumb';
import { CartDrawer } from './components/CartDrawer';
import { FloatingAssistDock } from './components/FloatingAssistDock';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StoreProvider } from './context/StoreContext';
import { I18nProvider, stripLocalePrefix, useI18n } from './i18n/I18nContext';
import { AccountPage } from './pages/AccountPage';
import { AdminCmsPage } from './pages/AdminCmsPage';
import { ContactPage, LegalPage, OemExportPage, PartnersPage } from './pages/B2BPages';
import { CartPage, CheckoutPage, OrderTrackPage } from './pages/CartCheckoutPage';
import { GreenCoffeePage } from './pages/GreenCoffeePage';
import { HomePage } from './pages/HomePage';
import { JournalArticlePage, JournalPage, PromotionsPage } from './pages/JournalPromotionsPages';
import { PersonalitiesPage } from './pages/PersonalitiesPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import {
  AboutPage,
  BrewingGuidePage,
  FarmMembershipPage,
  FarmToCupPage,
  OriginsPage,
  SignatureReservePage,
} from './pages/StoryPages';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#F8F5EF] text-[#202020] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-xl border border-[#202020]/15 p-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00552B]">ROAR COFFEE®</p>
            <h1 className="text-xl font-bold">Unable to render view</h1>
            <p className="text-xs font-mono text-red-700 break-words">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#00552B] text-white text-xs font-medium rounded cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  const prevRouteRef = useRef(stripLocalePrefix(pathname));

  useEffect(() => {
    const nextRoute = stripLocalePrefix(pathname);
    if (prevRouteRef.current !== nextRoute) {
      prevRouteRef.current = nextRoute;
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname]);

  return null;
}

function RoarPreloader() {
  const { t } = useI18n();
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDismissed(true);
      return;
    }
    const fadeTimer = window.setTimeout(() => setFading(true), 680);
    const removeTimer = window.setTimeout(() => setDismissed(true), 1080);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (dismissed) return null;

  return (
    <div
      aria-live="polite"
      aria-label={t('Đang khởi tạo không gian ROAR COFFEE', 'Loading ROAR COFFEE experience')}
      className={`fixed inset-0 z-[100] bg-[#002D1B] text-[#F8F5EF] flex flex-col items-center justify-center px-6 transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-6 max-w-xs w-full text-center">
        <AdaptiveLogo variant="horizontal" surface="dark" size="lg" />
        <div className="w-full h-0.5 bg-white/15 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-transparent via-[#C6A667] to-transparent animate-loader-sweep" />
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#C6A667]">
          {t('Khơi Bản Lĩnh · Đậm Chất Riêng', 'Igniting Courage · Defining Character')}
        </p>
      </div>
    </div>
  );
}

function renderPublicRoutes() {
  return (
    <>
    <Route index element={<HomePage />} />
    <Route path="shop" element={<ShopPage />} />
    <Route path="coffee/roasted" element={<ShopPage defaultCategory="roasted" />} />
    <Route path="coffee/roasted-beans" element={<ShopPage defaultCategory="roasted_beans" />} />
    <Route path="coffee/instant" element={<ShopPage defaultCategory="instant" />} />
    <Route path="coffee/green-beans" element={<GreenCoffeePage />} />
    <Route path="product/:slug" element={<ProductDetailPage />} />
    <Route path="personalities" element={<PersonalitiesPage />} />
    <Route path="personalities/:slug" element={<PersonalitiesPage />} />
    <Route path="origins" element={<OriginsPage />} />
    <Route path="farm-to-cup" element={<FarmToCupPage />} />
    <Route path="brewing" element={<BrewingGuidePage />} />
    <Route path="about" element={<AboutPage />} />
    <Route path="signature-reserve" element={<SignatureReservePage />} />
    <Route path="farm-membership" element={<FarmMembershipPage />} />
    <Route path="promotions" element={<PromotionsPage />} />
    <Route path="partners" element={<PartnersPage />} />
    <Route path="oem-export" element={<OemExportPage />} />
    <Route path="journal" element={<JournalPage />} />
    <Route path="journal/:slug" element={<JournalArticlePage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="checkout" element={<CheckoutPage />} />
    <Route path="orders/track" element={<OrderTrackPage />} />
    <Route path="account" element={<AccountPage />} />
    <Route path="contact" element={<ContactPage />} />
    <Route path="privacy" element={<LegalPage doc="privacy" />} />
    <Route path="terms" element={<LegalPage doc="terms" />} />
    <Route path="shipping" element={<LegalPage doc="shipping" />} />
    </>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminCmsPage />} />
        <Route path="/admin/*" element={<AdminCmsPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#202020] dark:bg-[#0E1512] dark:text-[#F1EFEA] transition-colors duration-200">
      <RoarPreloader />
      <Header />
      <Breadcrumb />
      <main className="flex-1">
        <Routes>
          <Route path="/">{renderPublicRoutes()}</Route>
          <Route path="/vi">{renderPublicRoutes()}</Route>
          <Route path="/en">{renderPublicRoutes()}</Route>
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingAssistDock />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <I18nProvider>
          <StoreProvider>
            <AppLayout />
          </StoreProvider>
        </I18nProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
