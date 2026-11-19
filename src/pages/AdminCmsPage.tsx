import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminWalletPointsPanel } from '../components/AdminWalletPointsPanel';
import {
  Archive,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileEdit,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  Upload,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { AdaptiveLogo } from '../components/AdaptiveLogo';
import { useI18n } from '../i18n/I18nContext';
import { useStore, type CmsPageData } from '../context/StoreContext';
import { resolveMediaUrl } from '../lib/media';
import {
  localizeB2BType,
  localizeCoffeeType,
  localizeOrderStatus,
  localizePaymentStatus,
  localizeVariantLabel,
} from '../lib/i18nHelpers';
import { getRolePreset, hasAdminPermission, type AdminPermission } from '../lib/rbac';
import { DEFAULT_SHIPPING_RULES, parseShippingRules, type ShippingRuleTier } from '../lib/pricing';
import { MediaLibrarySection } from '../components/admin/MediaLibrarySection';
import { MediaPickerModal, type MediaAssetRecord } from '../components/admin/MediaPickerModal';
import { ProductEditorModal } from '../components/admin/ProductEditorModal';
import { JournalManagerSection, type JournalAdminArticle } from '../components/admin/JournalManagerSection';
import { PagesManagerSection } from '../components/admin/PagesManagerSection';
import { TeamRbacSection, type AdminTeamMember, type NonAdminCandidate } from '../components/admin/TeamRbacSection';

type CmsSection = AdminPermission;

const CATEGORY_LABELS_VI: Record<string, string> = {
  roasted: 'Cà phê Rang xay',
  roasted_beans: 'Cà phê Hạt rang (kg)',
  instant: 'Cà phê Hòa tan',
  green_bean: 'Nhân xanh B2B',
};

const PRODUCT_STATUS_VI: Record<string, string> = {
  active: 'Đang bán',
  configurable_on_request: 'Đặt theo cấu hình',
  out_of_stock: 'Tạm hết hàng',
  draft: 'Bản nháp / Lưu trữ',
};

const B2B_STATUS_VI: Record<string, string> = {
  new: 'Mới tiếp nhận',
  reviewing: 'Đang thẩm định',
  quoted: 'Đã gửi báo giá',
  closed: 'Đã hoàn tất',
};

const ORDER_STATUS_LIST = ['Pending', 'Confirmed', 'Processing', 'Shipping', 'Completed', 'Cancelled', 'Returned'];
const PAYMENT_STATUS_LIST = ['awaiting_payment', 'pending_verification', 'paid', 'refunded'];

export const AdminCmsPage: React.FC = () => {
  const { lang, setLang, t } = useI18n();
  const {
    user,
    setAuthSession,
    clearAuthSession,
    apiFetch,
    personalities,
    origins,
    refreshBootstrap,
    showToast,
    vcbRate,
    vcbRateInfo,
    refreshVcbRate,
  } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const requestedSectionParam = searchParams.get('section') as CmsSection | null;
  const requestedPageSlug = searchParams.get('page');
  const [section, setSection] = useState<CmsSection>(requestedSectionParam || 'overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Admin Datasets
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [articles, setArticles] = useState<JournalAdminArticle[]>([]);
  const [cmsPagesList, setCmsPagesList] = useState<CmsPageData[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [b2bSubTab, setB2bSubTab] = useState<'inquiries' | 'newsletter'>('inquiries');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [shippingRules, setShippingRules] = useState<ShippingRuleTier[]>(DEFAULT_SHIPPING_RULES);
  const [teamAdmins, setTeamAdmins] = useState<AdminTeamMember[]>([]);
  const [teamNonAdmins, setTeamNonAdmins] = useState<NonAdminCandidate[]>([]);
  const [teamAuditLogs, setTeamAuditLogs] = useState<any[]>([]);

  // Products filters & modals
  const [prodCatFilter, setProdCatFilter] = useState<'all' | 'roasted' | 'roasted_beans' | 'instant' | 'green_bean'>('all');
  const [prodSearch, setProdSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<number | null>(null);
  const [archiveOfferProdId, setArchiveOfferProdId] = useState<number | null>(null);

  // Orders UI states (Shopee Seller Center)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, string>>({});
  const [resolvingOrder, setResolvingOrder] = useState<any | null>(null);
  const [resStatus, setResStatus] = useState('Pending');
  const [resPayment, setResPayment] = useState('awaiting_payment');
  const [resCarrier, setResCarrier] = useState('Giao Hàng Nhanh (GHN)');
  const [resTracking, setResTracking] = useState('');
  const [resNote, setResNote] = useState('');
  const [savingOrderResolution, setSavingOrderResolution] = useState(false);

  // Customer Notification Modal states
  const [notifyModalTarget, setNotifyModalTarget] = useState<{ id: number | 'all'; name: string; email?: string } | null>(null);
  const [notifyTitleVi, setNotifyTitleVi] = useState('');
  const [notifyTitleEn, setNotifyTitleEn] = useState('');
  const [notifyMessageVi, setNotifyMessageVi] = useState('');
  const [notifyMessageEn, setNotifyMessageEn] = useState('');
  const [notifyCategory, setNotifyCategory] = useState<'promo' | 'loyalty' | 'order' | 'system'>('promo');
  const [sendingNotify, setSendingNotify] = useState(false);

  // Promotions Form
  const [promoCode, setPromoCode] = useState('');
  const [promoTitleVi, setPromoTitleVi] = useState('');
  const [promoTitleEn, setPromoTitleEn] = useState('');
  const [promoValue, setPromoValue] = useState(10);
  const [promoStart, setPromoStart] = useState('2026-01-01');
  const [promoEnd, setPromoEnd] = useState('2027-12-31');
  const [promoNotifyCustomers, setPromoNotifyCustomers] = useState(true);

  // Brand Personality Media Picker & Site Settings + Portable Snapshot
  const [mascotPickerId, setMascotPickerId] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingSnapshot, setSyncingSnapshot] = useState(false);
  const [restoringSnapshot, setRestoringSnapshot] = useState(false);
  const [syncingVcbCatalog, setSyncingVcbCatalog] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState<{ exportedAt?: string; counts?: Record<string, number> } | null>(
    null
  );

  const handleSyncCatalogVcbRates = async () => {
    setSyncingVcbCatalog(true);
    try {
      const res = await apiFetch('/api/admin/exchange-rate/vietcombank/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyToAllProducts: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        await refreshVcbRate(false);
        await loadAll();
        showToast(
          t(
            `Đã cập nhật giá USD cho ${d.updatedProducts || products.length} sản phẩm theo tỉ giá Vietcombank (1 USD = ${(d.rate?.activeRate || vcbRate).toLocaleString('vi-VN')} ₫)`,
            `Updated USD pricing for ${d.updatedProducts || products.length} products via Vietcombank rate`
          )
        );
      } else {
        showToast(d.error || t('Không thể đồng bộ tỉ giá Vietcombank', 'VCB rate sync failed'));
      }
    } finally {
      setSyncingVcbCatalog(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const canMedia =
    isAdmin &&
    (['media', 'posts', 'products', 'pages', 'brand'] as AdminPermission[]).some((p) => hasAdminPermission(user, p));

  const loadMedia = async () => {
    if (!canMedia) return;
    const res = await apiFetch('/api/admin/media');
    if (res.ok) {
      const d = await res.json();
      setMediaAssets(d.assets || []);
    }
  };

  const loadAll = async () => {
    if (!isAdmin) return;
    try {
      const [ov, pg, pr, ar, md, or, cu, pm, b2, nl, st, tm] = await Promise.all([
        hasAdminPermission(user, 'overview') ? apiFetch('/api/admin/overview').then((r) => (r.ok ? r.json() : null)) : Promise.resolve(null),
        hasAdminPermission(user, 'pages') ? apiFetch('/api/admin/pages').then((r) => (r.ok ? r.json() : { pages: [] })) : Promise.resolve({ pages: [] }),
        hasAdminPermission(user, 'products') ? apiFetch('/api/admin/products').then((r) => (r.ok ? r.json() : { products: [] })) : Promise.resolve({ products: [] }),
        hasAdminPermission(user, 'posts') ? apiFetch('/api/admin/journal').then((r) => (r.ok ? r.json() : { articles: [] })) : Promise.resolve({ articles: [] }),
        canMedia ? apiFetch('/api/admin/media').then((r) => (r.ok ? r.json() : { assets: [] })) : Promise.resolve({ assets: [] }),
        hasAdminPermission(user, 'orders') ? apiFetch('/api/admin/orders').then((r) => (r.ok ? r.json() : { orders: [] })) : Promise.resolve({ orders: [] }),
        hasAdminPermission(user, 'customers') ? apiFetch('/api/admin/customers').then((r) => (r.ok ? r.json() : { customers: [] })) : Promise.resolve({ customers: [] }),
        hasAdminPermission(user, 'promotions') ? apiFetch('/api/admin/promotions').then((r) => (r.ok ? r.json() : { promotions: [] })) : Promise.resolve({ promotions: [] }),
        hasAdminPermission(user, 'b2b') ? apiFetch('/api/admin/b2b').then((r) => (r.ok ? r.json() : { inquiries: [] })) : Promise.resolve({ inquiries: [] }),
        hasAdminPermission(user, 'b2b') ? apiFetch('/api/admin/newsletter').then((r) => (r.ok ? r.json() : { subscribers: [] })) : Promise.resolve({ subscribers: [] }),
        hasAdminPermission(user, 'settings') ? apiFetch('/api/admin/settings').then((r) => (r.ok ? r.json() : { settings: {} })) : Promise.resolve({ settings: {} }),
        hasAdminPermission(user, 'team')
          ? apiFetch('/api/admin/team').then((r) => (r.ok ? r.json() : { admins: [], nonAdmins: [], auditLogs: [] }))
          : Promise.resolve({ admins: [], nonAdmins: [], auditLogs: [] }),
      ]);
      if (ov) setOverview(ov);
      setCmsPagesList(pg.pages || []);
      setProducts(pr.products || []);
      setArticles(ar.articles || []);
      setMediaAssets(md.assets || []);
      setOrders(or.orders || []);
      setCustomers(cu.customers || []);
      setLoyaltySettings(cu.loyaltySettings || null);
      setPromotions(pm.promotions || []);
      setInquiries(b2.inquiries || []);
      setNewsletterSubscribers(nl.subscribers || []);
      const loadedSettings = st.settings || {};
      setSiteSettings(loadedSettings);
      setShippingRules(parseShippingRules(loadedSettings.shipping_rules_json));
      setTeamAdmins(tm.admins || []);
      setTeamNonAdmins(tm.nonAdmins || []);
      setTeamAuditLogs(tm.auditLogs || []);
    } catch {
      showToast(t('Không thể tải dữ liệu quản trị.', 'Unable to load CMS data.'));
    }
  };

  useEffect(() => {
    loadAll();
  }, [isAdmin, user?.id, user?.adminRole, JSON.stringify(user?.adminPermissions || [])]);

  useEffect(() => {
    if (requestedSectionParam && hasAdminPermission(user, requestedSectionParam)) {
      setSection(requestedSectionParam);
    }
  }, [requestedSectionParam, user?.adminRole, JSON.stringify(user?.adminPermissions || [])]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.user) {
        setAuthSession(d.user, d.token);
        if (d.user.role !== 'admin') {
          const msg = t(
            'Tài khoản này không có quyền Quản trị viên CMS.',
            'This account lacks CMS administrator privileges.'
          );
          setLoginError(msg);
          showToast(msg);
        } else {
          showToast(t('Đăng nhập hệ thống quản trị thành công', 'Signed in to ROAR CMS'));
        }
      } else {
        const msg = d.error || t('Sai email hoặc mật khẩu quản trị.', 'Invalid email or password.');
        setLoginError(msg);
        showToast(msg);
      }
    } catch {
      setLoginError(t('Lỗi kết nối máy chủ.', 'Network error connecting to server.'));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearAuthSession();
  };

  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (prodCatFilter !== 'all' && p.category !== prodCatFilter) return false;
      if (q) {
        return (
          (p.name_vi || '').toLowerCase().includes(q) ||
          (p.name_en || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q) ||
          (p.sub_category || '').toLowerCase().includes(q) ||
          (p.grading_spec || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, prodCatFilter, prodSearch]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '').replace(/^84/, '0');
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.order_status !== orderStatusFilter) return false;
      if (orderPaymentFilter !== 'all' && o.payment_status !== orderPaymentFilter) return false;
      if (q) {
        const phoneDigits = String(o.customer_phone || '').replace(/\D/g, '').replace(/^84/, '0');
        const hitPhone = qDigits.length >= 4 && phoneDigits.includes(qDigits);
        const hitOrder =
          (o.order_number || '').toLowerCase().includes(q) ||
          (o.customer_name || '').toLowerCase().includes(q) ||
          (o.customer_email || '').toLowerCase().includes(q) ||
          (o.customer_phone || '').toLowerCase().includes(q) ||
          hitPhone ||
          (o.tracking_code || '').toLowerCase().includes(q);
        const hitItem = (o.items || []).some(
          (it: any) =>
            (it.sku || '').toLowerCase().includes(q) ||
            (it.product_name_vi || '').toLowerCase().includes(q) ||
            (it.product_name_en || '').toLowerCase().includes(q)
        );
        if (!hitOrder && !hitItem) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderPaymentFilter, orderSearch]);

  const updateProductField = async (id: number, patch: Record<string, any>) => {
    const res = await apiFetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      showToast(t('Đã cập nhật sản phẩm', 'Updated product'));
      loadAll();
    }
  };

  const handleDeleteProduct = async (id: number, archive = false) => {
    const url = archive ? `/api/admin/products/${id}?archive=true` : `/api/admin/products/${id}`;
    const res = await apiFetch(url, { method: 'DELETE' });
    const d = await res.json().catch(() => ({}));
    if (res.status === 409 && d.canArchive) {
      setConfirmDeleteProdId(null);
      setArchiveOfferProdId(id);
      showToast(d.error);
      return;
    }
    if (res.ok) {
      setConfirmDeleteProdId(null);
      setArchiveOfferProdId(null);
      showToast(
        d.archived
          ? t('Đã lưu trữ sản phẩm (ẩn khỏi cửa hàng)', 'Product archived (moved to draft)')
          : t('Đã xóa sản phẩm', 'Deleted product')
      );
      loadAll();
    } else {
      showToast(d.error || t('Không thể xóa sản phẩm', 'Unable to delete product'));
    }
  };

  const updateOrderRecord = async (
    id: number,
    patch: { orderStatus?: string; paymentStatus?: string; trackingCode?: string; resolutionNote?: string }
  ) => {
    const res = await apiFetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      showToast(t('Đã cập nhật đơn hàng & gửi thông báo cho khách', 'Order updated & customer notified'));
      loadAll();
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || t('Không thể cập nhật đơn hàng', 'Failed to update order'));
    }
    return res.ok;
  };

  const openResolutionModal = (o: any, preferredNextStatus?: string) => {
    setResolvingOrder(o);
    setResStatus(preferredNextStatus || o.order_status || 'Pending');
    setResPayment(o.payment_status || 'awaiting_payment');
    setResCarrier('Giao Hàng Nhanh (GHN)');
    setResTracking(o.tracking_code || '');
    setResNote('');
  };

  const handleSaveOrderResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingOrder) return;
    setSavingOrderResolution(true);
    try {
      const combinedTracking =
        resTracking.trim() && resStatus === 'Shipping' && !resTracking.includes('(')
          ? `${resCarrier.split('(')[1]?.replace(')', '') || resCarrier}: ${resTracking.trim()}`
          : resTracking.trim();
      const ok = await updateOrderRecord(resolvingOrder.id, {
        orderStatus: resStatus,
        paymentStatus: resPayment,
        trackingCode: combinedTracking || resTracking.trim(),
        resolutionNote: resNote.trim() || undefined,
      });
      if (ok) {
        setResolvingOrder(null);
      }
    } finally {
      setSavingOrderResolution(false);
    }
  };

  const handleSendCustomerNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyModalTarget || !notifyTitleVi.trim() || !notifyMessageVi.trim()) return;
    setSendingNotify(true);
    try {
      const res = await apiFetch(`/api/admin/customers/${notifyModalTarget.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: notifyCategory,
          titleVi: notifyTitleVi.trim(),
          titleEn: notifyTitleEn.trim() || notifyTitleVi.trim(),
          messageVi: notifyMessageVi.trim(),
          messageEn: notifyMessageEn.trim() || notifyMessageVi.trim(),
          linkUrl: notifyCategory === 'promo' ? '/promotions' : notifyCategory === 'order' ? '/account?tab=orders' : '/account',
        }),
      });
      if (res.ok) {
        const d = await res.json();
        showToast(
          t(
            `Đã gửi thông báo đến ${d.sentCount || 1} tài khoản thành viên`,
            `Notification delivered to ${d.sentCount || 1} account(s)`
          )
        );
        setNotifyModalTarget(null);
        setNotifyTitleVi('');
        setNotifyTitleEn('');
        setNotifyMessageVi('');
        setNotifyMessageEn('');
        loadAll();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể gửi thông báo', 'Failed to send notification'));
      }
    } finally {
      setSendingNotify(false);
    }
  };

  const adjustCustomer = async (id: number, tier: string, pointsDelta = 0) => {
    const res = await apiFetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, pointsDelta }),
    });
    if (res.ok) {
      showToast(t('Đã cập nhật hồ sơ thành viên', 'Customer record updated'));
      loadAll();
    }
  };

  const saveLoyaltyPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltySettings) return;
    const res = await apiFetch('/api/admin/loyalty-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pointsPer10kVnd: loyaltySettings.points_per_10k_vnd,
        vndPerPoint: loyaltySettings.vnd_per_point,
        expirationDays: loyaltySettings.expiration_days,
        maxRedeemPercent: loyaltySettings.max_redeem_percent,
      }),
    });
    if (res.ok) showToast(t('Đã lưu chính sách tích điểm', 'Loyalty policy updated'));
  };

  const createPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: promoCode,
        title_vi: promoTitleVi,
        title_en: promoTitleEn || promoTitleVi,
        discount_type: 'percent',
        discount_value: promoValue,
        start_date: promoStart,
        end_date: promoEnd,
        notifyCustomers: promoNotifyCustomers,
      }),
    });
    if (res.ok) {
      setPromoCode('');
      setPromoTitleVi('');
      setPromoTitleEn('');
      showToast(
        promoNotifyCustomers
          ? t('Đã tạo mã khuyến mãi & gửi thông báo đến thành viên', 'Promotion created & members notified')
          : t('Đã tạo mã khuyến mãi mới', 'Promotion created')
      );
      loadAll();
    }
  };

  const updateB2b = async (id: number, status: string, quotedPrice: string) => {
    const res = await apiFetch(`/api/admin/b2b/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, quotedPrice }),
    });
    if (res.ok) {
      showToast(t('Đã cập nhật yêu cầu B2B', 'B2B inquiry updated'));
      loadAll();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      });
      if (res.ok) {
        await refreshBootstrap();
        showToast(t('Đã lưu cài đặt website', 'Saved site settings'));
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSyncSnapshot = async () => {
    setSyncingSnapshot(true);
    try {
      const res = await apiFetch('/api/admin/snapshot/sync', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setSnapshotSummary({ exportedAt: d.exportedAt, counts: d.counts });
        showToast(
          t(
            'Đã đồng bộ SQLite + Snapshot JSON vào source (sẵn sàng đẩy GitHub)',
            'Synced SQLite + JSON snapshots to workspace'
          )
        );
      } else {
        showToast(d.error || t('Không thể đồng bộ snapshot', 'Snapshot sync failed'));
      }
    } finally {
      setSyncingSnapshot(false);
    }
  };

  const handleDownloadSnapshot = async () => {
    const res = await apiFetch('/api/admin/snapshot/download');
    if (!res.ok) {
      showToast(t('Không thể tải bản sao lưu', 'Download failed'));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roar-coffee-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('Đã tải tệp sao lưu CMS (.json)', 'Downloaded CMS JSON backup'));
  };

  const handleUploadRestoreSnapshot = async (file: File | undefined) => {
    if (!file) return;
    setRestoringSnapshot(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.tables) {
        showToast(t('Tệp JSON không đúng định dạng snapshot ROAR.', 'Invalid ROAR snapshot JSON format.'));
        return;
      }
      const res = await apiFetch('/api/admin/snapshot/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotData: parsed }),
      });
      if (res.ok) {
        await refreshBootstrap();
        await loadAll();
        showToast(t('Đã khôi phục 100% dữ liệu từ bản sao lưu!', 'Restored 100% data from backup snapshot!'));
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Khôi phục thất bại', 'Restore failed'));
      }
    } catch {
      showToast(t('Không đọc được tệp JSON sao lưu.', 'Failed to parse backup JSON file.'));
    } finally {
      setRestoringSnapshot(false);
    }
  };

  // ---------- LOGIN SCREEN ----------
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0D1B14] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#16271F] border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <AdaptiveLogo variant="horizontal" surface="dark" size="xs" />
            <Lock className="w-5 h-5 text-[#C6A667]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{t('Hệ thống Quản trị ROAR COFFEE', 'ROAR COFFEE Admin CMS')}</h1>
            <p className="text-xs text-slate-300">
              {user && !isAdmin
                ? t(
                    'Tài khoản khách hàng không có quyền truy cập khu vực quản trị (403 Forbidden).',
                    'Customer accounts cannot access administrator CMS.'
                  )
                : t(
                    'Quản trị Bài viết, Thư viện Ảnh, Sản phẩm & Đơn hàng theo mô hình WordPress + WooCommerce.',
                    'Manage Posts, Media Library, Products & Orders in WordPress + WooCommerce workspace.'
                  )}
            </p>
          </div>

          {user && !isAdmin ? (
            <div className="p-4 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('Không có quyền truy cập', 'Access Denied')}</p>
                <p className="mt-1">
                  {t('Đang đăng nhập với tài khoản:', 'Signed in as')} {user.email}
                </p>
                <button type="button" onClick={handleLogout} className="mt-2 underline text-white cursor-pointer">
                  {t('Đăng xuất để chuyển tài khoản', 'Sign out to switch account')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4 text-sm">
              {loginError && (
                <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/40 text-xs text-red-200">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-300 mb-1">{t('Email Quản trị viên', 'Admin Email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@roarcoffee.vn"
                  className="w-full bg-[#0D1B14] border border-white/15 rounded-lg px-3.5 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">{t('Mật khẩu', 'Password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0D1B14] border border-white/15 rounded-lg px-3.5 py-2.5 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-2.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-60"
              >
                {loggingIn ? t('Đang đăng nhập...', 'Signing In...') : t('Đăng nhập Quản trị CMS', 'Sign In to CMS')}
              </button>
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-300">
                <Link to="/" className="hover:text-white">
                  ← {t('Về trang chủ', 'Back to Storefront')}
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('editor@roarcoffee.vn');
                      setPassword('RoarEditor!2026');
                      setLoginError('');
                    }}
                    className="text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    {t('Biên tập viên', 'Demo Editor')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@roarcoffee.vn');
                      setPassword('RoarAdmin!2026');
                      setLoginError('');
                    }}
                    className="text-[#C6A667] hover:underline cursor-pointer"
                  >
                    {t('Super Admin mẫu', 'Demo Super Admin')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Sidebar Menu Definition (WordPress + WooCommerce grouped & RBAC filtered)
  const rawNavGroups: Array<{
    groupLabel: string;
    items: Array<{ id: CmsSection; label: string; icon: React.ReactNode; count?: number }>;
  }> = [
    {
      groupLabel: t('Bảng tin', 'Workspace'),
      items: [{ id: 'overview', label: t('Tổng quan', 'Dashboard'), icon: <LayoutDashboard className="w-4 h-4" /> }],
    },
    {
      groupLabel: t('Nội dung (WordPress)', 'Content (WordPress)'),
      items: [
        {
          id: 'pages',
          label: t('Trang con Website', 'Storefront Pages'),
          icon: <FileEdit className="w-4 h-4" />,
          count: cmsPagesList.length,
        },
        { id: 'posts', label: t('Bài viết', 'Posts'), icon: <FileText className="w-4 h-4" />, count: articles.length },
        {
          id: 'media',
          label: t('Thư viện ảnh', 'Media Library'),
          icon: <ImageIcon className="w-4 h-4" />,
          count: mediaAssets.length,
        },
      ],
    },
    {
      groupLabel: t('Cửa hàng (WooCommerce)', 'Store (WooCommerce)'),
      items: [
        { id: 'products', label: t('Sản phẩm', 'Products'), icon: <Package className="w-4 h-4" />, count: products.length },
        { id: 'orders', label: t('Đơn hàng', 'Orders'), icon: <ShoppingCart className="w-4 h-4" />, count: orders.length },
        {
          id: 'customers',
          label: t('Khách hàng & Điểm', 'Customers & Points'),
          icon: <Users className="w-4 h-4" />,
          count: customers.length,
        },
        { id: 'promotions', label: t('Khuyến mãi', 'Promotions'), icon: <Tag className="w-4 h-4" />, count: promotions.length },
      ],
    },
    {
      groupLabel: t('Đối tác & Hệ thống', 'Partners & System'),
      items: [
        {
          id: 'b2b',
          label: t('Yêu cầu B2B & Newsletter', 'B2B & Newsletter'),
          icon: <Briefcase className="w-4 h-4" />,
          count: inquiries.length + newsletterSubscribers.length,
        },
        { id: 'brand', label: t('Linh vật & Vùng trồng', 'Mascots & Origins'), icon: <Compass className="w-4 h-4" /> },
        { id: 'settings', label: t('Cài đặt Website', 'Site Settings'), icon: <Settings className="w-4 h-4" /> },
        {
          id: 'team',
          label: t('Phân quyền thành viên', 'Team & RBAC'),
          icon: <Shield className="w-4 h-4" />,
          count: teamAdmins.length || undefined,
        },
      ],
    },
  ];

  const navGroups = rawNavGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => hasAdminPermission(user, item.id)),
    }))
    .filter((grp) => grp.items.length > 0);

  const permittedSectionIds = navGroups.flatMap((g) => g.items.map((i) => i.id));
  const resolvedSection: CmsSection = permittedSectionIds.includes(section)
    ? section
    : permittedSectionIds[0] || 'overview';

  const activeNavItem = navGroups.flatMap((g) => g.items).find((i) => i.id === resolvedSection);
  const currentRolePreset = getRolePreset(user.adminRole);

  const selectSection = (nextSection: CmsSection) => {
    setSection(nextSection);
    setMobileMenuOpen(false);
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set('section', nextSection);
      if (nextSection !== 'pages') sp.delete('page');
      return sp;
    }, { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#1D2327] text-slate-200 select-none">
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <AdaptiveLogo variant="horizontal" surface="dark" size="xs" />
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 rounded text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {navGroups.map((grp) => (
          <div key={grp.groupLabel} className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{grp.groupLabel}</p>
            <div className="space-y-0.5">
              {grp.items.map((item) => {
                const active = resolvedSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSection(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      active ? 'bg-[#00552B] text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                          active ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/10 text-xs space-y-2 bg-[#161B1E]">
        <div className="px-1 space-y-1">
          <p className="font-semibold text-white truncate">{user.fullName || 'Quản trị viên'}</p>
          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          <span className="inline-block px-2 py-0.5 rounded bg-[#00552B]/40 border border-[#C6A667]/30 text-[#C6A667] text-[10px] font-semibold">
            {lang === 'en' ? currentRolePreset.labelEn : currentRolePreset.labelVi}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t('Đăng xuất', 'Sign Out')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F7F7] text-[#1D2327] flex">
      {/* Desktop WordPress Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 h-full">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top WordPress Admin Header */}
        <header className="h-12 sm:h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer shrink-0"
              aria-label={t('Mở menu quản trị', 'Open CMS menu')}
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">{activeNavItem?.label}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => setLang('vi')}
                className={`px-2 sm:px-2.5 py-1 font-semibold cursor-pointer ${
                  lang === 'vi' ? 'bg-[#00552B] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 sm:px-2.5 py-1 font-semibold cursor-pointer ${
                  lang === 'en' ? 'bg-[#00552B] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                EN
              </button>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] text-[11px] sm:text-xs font-semibold text-[#00552B] bg-white whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t('Xem cửa hàng', 'Visit Store')}</span>
              <span className="sm:hidden">{t('Web', 'Site')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Compact Mobile Quick Module Strip */}
        <nav
          aria-label={t('Điều hướng nhanh CMS', 'Quick CMS navigation')}
          className="lg:hidden bg-white border-b border-slate-200 px-2.5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar sticky top-12 z-20"
        >
          {navGroups.flatMap((g) => g.items).map((item) => {
            const active = resolvedSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSection(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Section Body */}
        <main className="flex-1 p-2.5 sm:p-6 max-w-[1440px] w-full mx-auto space-y-3 sm:space-y-6">
          {/* 1. OVERVIEW DASHBOARD */}
          {resolvedSection === 'overview' && hasAdminPermission(user, 'overview') && (
            <div className="space-y-3.5 sm:space-y-6">
              {/* Quick Actions */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('Hệ thống Quản trị ROAR COFFEE', 'ROAR COFFEE CMS Workspace')}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    {t(
                      'Quản lý trang con, bài viết, hình ảnh, sản phẩm và đơn hàng trực tuyến.',
                      'Manage subpages, posts, media library, catalog, and orders.'
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs">
                  {hasAdminPermission(user, 'pages') && (
                    <button
                      type="button"
                      onClick={() => selectSection('pages')}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-[#00552B]" />
                      {t('Sửa Trang con', 'Subpages')}
                    </button>
                  )}
                  {hasAdminPermission(user, 'posts') && (
                    <button
                      type="button"
                      onClick={() => selectSection('posts')}
                      className="px-3 py-2 rounded-lg bg-[#00552B] text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('Bài viết', 'Posts')}
                    </button>
                  )}
                  {hasAdminPermission(user, 'media') && (
                    <button
                      type="button"
                      onClick={() => selectSection('media')}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      {t('Thư viện ảnh', 'Media')}
                    </button>
                  )}
                  {hasAdminPermission(user, 'products') && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        selectSection('products');
                        setProductModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('Thêm Sản phẩm', 'New Product')}
                    </button>
                  )}
                </div>
              </div>

              {overview && (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500">{t('Tổng doanh thu', 'Total Revenue')}</span>
                      <p className="text-lg sm:text-2xl font-bold font-mono tabular-nums mt-0.5 sm:mt-1 text-slate-900 truncate">
                        {overview.metrics.revenue.toLocaleString()} ₫
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 tabular-nums truncate">
                        {t('TB đơn:', 'Avg:')} {overview.metrics.avgOrderValue.toLocaleString()} ₫
                      </p>
                    </div>
                    <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500">{t('Đơn hàng & TV', 'Orders & Users')}</span>
                      <p className="text-lg sm:text-2xl font-bold font-mono tabular-nums mt-0.5 sm:mt-1 text-slate-900">
                        {overview.metrics.totalOrders} {t('đơn', 'orders')}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 tabular-nums truncate">
                        {overview.metrics.members} {t('TV', 'mbr')} · {overview.metrics.pointsIssued} {t('điểm', 'pts')}
                      </p>
                    </div>
                    <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500">{t('Sản phẩm & Bài', 'Catalog & Posts')}</span>
                      <p className="text-lg sm:text-2xl font-bold font-mono tabular-nums mt-0.5 sm:mt-1 text-slate-900">
                        {overview.metrics.products} SP · {overview.metrics.articles} {t('bài', 'posts')}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 tabular-nums truncate">
                        {overview.metrics.mediaAssets} {t('ảnh tải lên', 'media')}
                      </p>
                    </div>
                    <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500">{t('Yêu cầu B2B', 'B2B Leads')}</span>
                      <p className="text-lg sm:text-2xl font-bold font-mono tabular-nums mt-0.5 sm:mt-1 text-slate-900">
                        {overview.metrics.b2bInquiries}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">
                        {t('OEM, Xuất khẩu & Sỉ', 'OEM & Export')}
                      </p>
                    </div>
                  </div>

                  {/* Performance + Audit Logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 sm:space-y-3 overflow-x-auto">
                      <h2 className="text-sm font-bold text-slate-900">
                        {t('Sản phẩm bán chạy theo doanh số', 'Top Selling Products')}
                      </h2>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-100">
                            <th className="py-2 pr-2">{t('SKU', 'SKU')}</th>
                            <th className="py-2 pr-2">{t('Sản phẩm', 'Product')}</th>
                            <th className="py-2 text-right">{t('SL', 'Qty')}</th>
                            <th className="py-2 text-right">{t('Doanh thu', 'Revenue')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(overview.productPerformance || []).map((row: any) => (
                            <tr key={row.sku}>
                              <td className="py-2 pr-2 font-mono text-[#00552B] font-semibold">{row.sku}</td>
                              <td className="py-2 pr-2 truncate max-w-[140px] sm:max-w-none">{lang === 'en' ? row.product_name_en : row.product_name_vi || row.product_name_en}</td>
                              <td className="py-2 text-right tabular-nums">{row.units_sold}</td>
                              <td className="py-2 text-right font-mono tabular-nums whitespace-nowrap">{row.revenue.toLocaleString()} ₫</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 sm:space-y-3">
                      <h2 className="text-sm font-bold text-slate-900">{t('Nhật ký thao tác quản trị', 'System Activity Log')}</h2>
                      <div className="max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {(overview.auditLogs || []).map((log: any) => (
                          <div key={log.id} className="py-2 flex justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-mono font-semibold text-[#00552B]">{log.action}</span> · {log.entity_type} #{log.entity_id}
                              <p className="text-slate-500 truncate">{log.actor_email}</p>
                            </div>
                            <span className="text-slate-400 font-mono text-[10px] sm:text-[11px] shrink-0 tabular-nums">{String(log.created_at || '').slice(5, 16)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 1B. STOREFRONT SUBPAGES EDITOR (TRANG CON WEBSITE) */}
          {resolvedSection === 'pages' && hasAdminPermission(user, 'pages') && (
            <PagesManagerSection
              pages={cmsPagesList}
              initialSlug={requestedPageSlug}
              mediaAssets={mediaAssets}
              onMediaUploaded={loadMedia}
              onSaved={loadAll}
            />
          )}

          {/* 2. WORDPRESS POSTS (BÀI VIẾT) */}
          {resolvedSection === 'posts' && hasAdminPermission(user, 'posts') && (
            <JournalManagerSection
              articles={articles}
              mediaAssets={mediaAssets}
              onRefresh={loadAll}
              onMediaUploaded={loadMedia}
            />
          )}

          {/* 3. WORDPRESS MEDIA LIBRARY (THƯ VIỆN ẢNH) */}
          {resolvedSection === 'media' && hasAdminPermission(user, 'media') && (
            <MediaLibrarySection mediaAssets={mediaAssets} onRefresh={loadMedia} />
          )}

          {/* 4. WOOCOMMERCE PRODUCTS (SẢN PHẨM) */}
          {resolvedSection === 'products' && hasAdminPermission(user, 'products') && (
            <div className="space-y-3 sm:space-y-4">
              {/* Filter & Add Product Bar */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar">
                  {[
                    { id: 'all', label: `${t('Tất cả', 'All')} (${products.length})` },
                    { id: 'roasted', label: `${t('Rang xay', 'Roasted')} (${products.filter((p) => p.category === 'roasted').length})` },
                    { id: 'roasted_beans', label: `${t('Hạt rang (kg)', 'Roasted Beans')} (${products.filter((p) => p.category === 'roasted_beans').length})` },
                    { id: 'instant', label: `${t('Hòa tan', 'Instant')} (${products.filter((p) => p.category === 'instant').length})` },
                    { id: 'green_bean', label: `${t('Nhân xanh', 'Green')} (${products.filter((p) => p.category === 'green_bean').length})` },
                  ].map((tb) => (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setProdCatFilter(tb.id as any)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        prodCatFilter === tb.id ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tb.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      placeholder={t('Tìm tên SP, SKU, Barcode...', 'Search name, SKU, Barcode...')}
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductModalOpen(true);
                    }}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('Thêm SP', 'Add New')}
                  </button>
                </div>
              </div>

              {/* Vietcombank Exchange Rate Sync Strip */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-[#003D25]">
                    {t('Tỉ giá Vietcombank (VCB):', 'Vietcombank Rate (VCB):')}
                  </span>{' '}
                  <span className="font-mono font-bold text-[#00552B] tabular-nums">
                    1 USD = {vcbRate.toLocaleString('vi-VN')} ₫
                  </span>
                  {vcbRateInfo?.bankDateTime && (
                    <span className="text-[11px] text-slate-500 ml-2">({vcbRateInfo.bankDateTime})</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={syncingVcbCatalog}
                  onClick={handleSyncCatalogVcbRates}
                  className="px-3 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[11px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingVcbCatalog ? 'animate-spin' : ''}`} />
                  {syncingVcbCatalog
                    ? t('Đang quy đổi USD...', 'Syncing VCB...')
                    : t('Đồng bộ giá USD toàn bộ SP theo VCB', 'Sync All Products USD via VCB')}
                </button>
              </div>

              {/* Mobile Compact Product Cards */}
              <div className="md:hidden bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-3 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={resolveMediaUrl(p.image_key)}
                        alt={p.name_vi}
                        className="w-11 aspect-[4/5] rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setProductModalOpen(true);
                          }}
                          className="font-bold text-slate-900 text-left line-clamp-1 cursor-pointer"
                        >
                          {lang === 'en' ? p.name_en : p.name_vi}
                        </button>
                        <p className="text-[11px] font-mono text-slate-500 truncate">
                          {p.sku}
                          {p.sub_category ? ` (${p.sub_category})` : ''} · {CATEGORY_LABELS_VI[p.category] || p.category}
                        </p>
                        {p.barcode && (
                          <p className="text-[10px] font-mono text-[#00552B] truncate">
                            EAN-13: {p.barcode}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setProductModalOpen(true);
                        }}
                        className="px-2.5 py-1 border border-slate-200 rounded-md font-semibold text-slate-700 shrink-0 cursor-pointer"
                      >
                        {t('Sửa', 'Edit')}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 items-center">
                      <div>
                        <span className="block text-[10px] text-slate-400">{t('Giá (₫)', 'Price')}</span>
                        <input
                          type="number"
                          defaultValue={p.price_vnd}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (next !== p.price_vnd) updateProductField(p.id, { price_vnd: next });
                          }}
                          className="w-full border border-slate-200 rounded px-2 py-1 font-mono tabular-nums text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400">{t('Kho', 'Stock')}</span>
                        <input
                          type="number"
                          defaultValue={p.inventory}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (next !== p.inventory) updateProductField(p.id, { inventory: next });
                          }}
                          className="w-full border border-slate-200 rounded px-2 py-1 font-mono tabular-nums text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400">{t('Trạng thái', 'Status')}</span>
                        <select
                          value={p.status}
                          onChange={(e) => updateProductField(p.id, { status: e.target.value })}
                          className="w-full border border-slate-200 rounded px-1.5 py-1 bg-white text-[11px]"
                        >
                          {Object.entries(PRODUCT_STATUS_VI).map(([val, labelVi]) => (
                            <option key={val} value={val}>
                              {lang === 'en' ? val : labelVi}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop WooCommerce Products Table */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3 text-left">{t('Sản phẩm & Mã SKU', 'Product & SKU')}</th>
                      <th className="p-3 text-left">{t('Danh mục & Loại hạt', 'Category')}</th>
                      <th className="p-3 text-right">{t('Giá bán (VND)', 'Price (VND)')}</th>
                      <th className="p-3 text-right">{t('Tồn kho', 'Inventory')}</th>
                      <th className="p-3 text-left">{t('Trạng thái', 'Status')}</th>
                      <th className="p-3 text-right">{t('Thao tác', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveMediaUrl(p.image_key)}
                              alt={p.name_vi}
                              className="w-10 aspect-[4/5] rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProductModalOpen(true);
                                }}
                                className="font-bold text-slate-900 hover:text-[#00552B] text-left cursor-pointer"
                              >
                                {lang === 'en' ? p.name_en : p.name_vi}
                              </button>
                              <p className="text-[11px] font-mono text-slate-500">
                                {p.sku}
                                {p.sub_category ? ` (${p.sub_category})` : ''}
                                {p.barcode ? ` · Barcode: ${p.barcode}` : ''}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {Array.isArray(p.pricing_tiers) && p.pricing_tiers.length > 0
                                  ? `${p.pricing_tiers.length} ${t('mức giá kg', 'kg tiers')}`
                                  : `${Array.isArray(p.variants) ? p.variants.length : 0} ${t('biến thể', 'variants')}`}{' '}
                                · {Array.isArray(p.gallery_images) ? p.gallery_images.length : 0} {t('ảnh phụ', 'gallery imgs')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{CATEGORY_LABELS_VI[p.category] || p.category}</div>
                          <div className="text-[11px] text-slate-500">{localizeCoffeeType(p.coffee_type, lang)}</div>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            defaultValue={p.price_vnd}
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              if (next !== p.price_vnd) updateProductField(p.id, { price_vnd: next });
                            }}
                            className="w-28 text-right border border-slate-200 rounded-md px-2 py-1 font-mono tabular-nums"
                          />
                          {Array.isArray(p.pricing_tiers) && p.pricing_tiers.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setProductModalOpen(true);
                              }}
                              className="block ml-auto mt-1 text-[10px] font-semibold text-[#00552B] hover:underline cursor-pointer"
                            >
                              {t('Sửa 5 mức giá kg', 'Edit 5 kg tiers')} →
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            defaultValue={p.inventory}
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              if (next !== p.inventory) updateProductField(p.id, { inventory: next });
                            }}
                            className="w-20 text-right border border-slate-200 rounded-md px-2 py-1 font-mono tabular-nums"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={p.status}
                            onChange={(e) => updateProductField(p.id, { status: e.target.value })}
                            className="border border-slate-200 rounded-md px-2 py-1 bg-white"
                          >
                            {Object.entries(PRODUCT_STATUS_VI).map(([val, labelVi]) => (
                              <option key={val} value={val}>
                                {lang === 'en' ? val : labelVi}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {archiveOfferProdId === p.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id, true)}
                                className="px-2.5 py-1 bg-amber-600 text-white rounded font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Archive className="w-3 h-3" />
                                {t('Lưu trữ (ẩn)', 'Archive')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setArchiveOfferProdId(null)}
                                className="px-2 py-1 border border-slate-200 rounded bg-white cursor-pointer"
                              >
                                {t('Hủy', 'Cancel')}
                              </button>
                            </div>
                          ) : confirmDeleteProdId === p.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id, false)}
                                className="px-2.5 py-1 bg-red-600 text-white rounded font-semibold cursor-pointer"
                              >
                                {t('Xác nhận xóa', 'Delete')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProdId(null)}
                                className="px-2 py-1 border border-slate-200 rounded bg-white cursor-pointer"
                              >
                                {t('Hủy', 'Cancel')}
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProductModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                {t('Sửa', 'Edit')}
                              </button>
                              <Link
                                to={`/product/${p.slug}`}
                                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 inline-flex items-center"
                                title={t('Xem trang sản phẩm', 'View Product')}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProdId(p.id)}
                                className="p-1.5 border border-slate-200 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"
                                title={t('Xóa hoặc Lưu trữ sản phẩm', 'Delete or Archive')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. SHOPEE SELLER CENTER STYLE ORDERS (ĐƠN HÀNG & GIẢI QUYẾT ĐƠN) */}
          {resolvedSection === 'orders' && hasAdminPermission(user, 'orders') && (
            <div className="space-y-3 sm:space-y-4">
              {/* Shopee-style Segmented Status Tabs (Single-row scroll on mobile) */}
              <div className="bg-white rounded-xl border border-slate-200 p-1.5 sm:p-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('all')}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    orderStatusFilter === 'all'
                      ? 'bg-[#00552B] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('Tất cả', 'All')} ({orders.length})
                </button>
                {[
                  { id: 'Pending', vi: 'Chờ duyệt' },
                  { id: 'Confirmed', vi: 'Đã duyệt' },
                  { id: 'Processing', vi: 'Đóng gói' },
                  { id: 'Shipping', vi: 'Đang giao' },
                  { id: 'Completed', vi: 'Hoàn thành' },
                  { id: 'Cancelled', vi: 'Đã hủy' },
                  { id: 'Returned', vi: 'Hoàn trả' },
                ].map((tab) => {
                  const count = orders.filter((o) => o.order_status === tab.id).length;
                  const active = orderStatusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderStatusFilter(tab.id)}
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                        active ? 'bg-[#00552B] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{lang === 'vi' ? tab.vi : localizeOrderStatus(tab.id, lang)}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                          active
                            ? 'bg-white/20 text-white'
                            : tab.id === 'Pending' && count > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Payment Filter Bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 text-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder={t(
                      'Tìm mã đơn hàng, SĐT, email, tên khách, vận đơn hoặc SKU...',
                      'Search order #, phone, email, customer, tracking, or SKU...'
                    )}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00552B]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">{t('Thanh toán:', 'Payment:')}</span>
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-medium"
                  >
                    <option value="all">{t('Tất cả trạng thái thanh toán', 'All Payment Statuses')}</option>
                    {PAYMENT_STATUS_LIST.map((pst) => (
                      <option key={pst} value={pst}>
                        {localizePaymentStatus(pst, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Cards Stream */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                  {t('Không có đơn hàng nào khớp bộ lọc hiện tại.', 'No orders matched your current filters.')}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredOrders.map((o) => {
                    const trackingVal = trackingDrafts[o.id] ?? (o.tracking_code || '');
                    const statusColor =
                      o.order_status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.order_status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : o.order_status === 'Confirmed'
                            ? 'bg-sky-100 text-sky-800'
                            : o.order_status === 'Processing'
                              ? 'bg-indigo-100 text-indigo-800'
                              : o.order_status === 'Shipping'
                                ? 'bg-blue-100 text-blue-800'
                                : o.order_status === 'Returned'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-700';

                    const payColor =
                      o.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : o.payment_status === 'pending_verification'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : o.payment_status === 'refunded'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <div key={o.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                        {/* Shopee Card Header */}
                        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-slate-900">{o.customer_name}</span>
                            <span className="text-slate-500">{o.customer_phone} · {o.customer_email}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200/70 font-mono text-[10px] uppercase font-bold text-slate-700">
                              {o.payment_method}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-[#00552B]">{o.order_number}</span>
                            <span className="text-slate-400 tabular-nums">{String(o.created_at || '').slice(0, 16)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${payColor}`}>
                              {localizePaymentStatus(o.payment_status, lang)}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColor}`}>
                              {localizeOrderStatus(o.order_status, lang)}
                            </span>
                          </div>
                        </div>

                        {/* Card Body: Line Items + Delivery Summary */}
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
                          <div className="lg:col-span-6 space-y-2.5">
                            {(o.items || []).map((it: any) => (
                              <div key={it.id} className="flex items-center gap-3">
                                <img
                                  src={resolveMediaUrl(it.product_image_key || 'product_robusta_house')}
                                  alt={it.product_name_vi}
                                  className="w-11 aspect-[4/5] rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {lang === 'en' ? it.product_name_en : it.product_name_vi}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {it.sku} · {localizeVariantLabel(it.variant_label, lang)} ·{' '}
                                    {it.unit === 'kg'
                                      ? `${it.quantity} kg (${Number(it.unit_price_vnd || 0).toLocaleString()} ₫/kg)`
                                      : `×${it.quantity}`}
                                  </p>
                                </div>
                                <span className="font-mono font-semibold text-slate-800 tabular-nums shrink-0">
                                  {it.line_total_vnd.toLocaleString()} ₫
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="lg:col-span-3 space-y-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
                            <p className="text-slate-500 font-semibold">{t('Giao nhận & Ghi chú', 'Shipping & Notes')}</p>
                            <p className="text-slate-700 line-clamp-2">{o.shipping_address}</p>
                            {o.tracking_code && (
                              <p className="font-mono text-[#00552B] font-semibold">
                                {t('Mã vận đơn:', 'Tracking:')} {o.tracking_code}
                              </p>
                            )}
                            {o.notes && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-200/60">
                                {o.notes}
                              </p>
                            )}
                          </div>

                          <div className="lg:col-span-3 flex flex-col lg:items-end gap-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
                            <span className="text-slate-500">{t('Tổng thu đơn hàng', 'Order Total')}</span>
                            <span className="text-lg font-bold font-mono text-[#00552B] tabular-nums">
                              {o.total.toLocaleString()} ₫
                            </span>
                            {o.points_awarded > 0 && (
                              <span className="text-[11px] text-emerald-700 font-medium tabular-nums">
                                +{o.points_awarded} {t('điểm thưởng', 'pts')}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 mt-1 w-full lg:w-auto">
                              <input
                                type="text"
                                value={trackingVal}
                                onChange={(e) => setTrackingDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                                placeholder={t('Mã vận đơn GHN...', 'Tracking #...')}
                                className="flex-1 lg:w-32 border border-slate-200 rounded px-2 py-1 text-[11px] font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => updateOrderRecord(o.id, { trackingCode: trackingVal })}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                {t('Lưu', 'Save')}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Shopee Seller Center 1-Click Action Footer */}
                        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            {o.order_status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderRecord(o.id, {
                                    orderStatus: 'Confirmed',
                                    resolutionNote: t('Quản trị viên đã duyệt đơn hàng.', 'Admin approved the order.'),
                                  })
                                }
                                className="px-3.5 py-1.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('Duyệt đơn ngay', 'Approve Order')}
                              </button>
                            )}
                            {o.order_status === 'Confirmed' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderRecord(o.id, {
                                    orderStatus: 'Processing',
                                    resolutionNote: t('Đơn hàng đang được rang xay & đóng gói.', 'Order moved to roasting & packing.'),
                                  })
                                }
                                className="px-3.5 py-1.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                {t('Chuẩn bị & Đóng gói', 'Pack Order')}
                              </button>
                            )}
                            {o.order_status === 'Processing' && (
                              <button
                                type="button"
                                onClick={() => openResolutionModal(o, 'Shipping')}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                {t('Bàn giao vận chuyển', 'Hand Over to Courier')}
                              </button>
                            )}
                            {o.order_status === 'Shipping' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderRecord(o.id, {
                                    orderStatus: 'Completed',
                                    paymentStatus: 'paid',
                                    resolutionNote: t('Đã giao thành công & hoàn tất đơn hàng.', 'Delivered & completed.'),
                                  })
                                }
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('Xác nhận hoàn tất', 'Mark Completed')}
                              </button>
                            )}
                            {o.payment_status !== 'paid' &&
                              o.order_status !== 'Cancelled' &&
                              o.order_status !== 'Returned' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOrderRecord(o.id, {
                                      paymentStatus: 'paid',
                                      resolutionNote: t('Đã đối soát & xác nhận thanh toán thành công.', 'Payment verified & settled.'),
                                    })
                                  }
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg cursor-pointer"
                                >
                                  {t('Xác nhận đã thu tiền', 'Confirm Payment')}
                                </button>
                              )}
                          </div>

                          <button
                            type="button"
                            onClick={() => openResolutionModal(o)}
                            className="px-3.5 py-1.5 border border-slate-300 bg-white hover:border-[#00552B] text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00552B]" />
                            {t('Xem & Giải quyết đơn', 'Inspect & Resolve')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6. CUSTOMERS & LOYALTY + DIRECT NOTIFICATIONS */}
          {resolvedSection === 'customers' && hasAdminPermission(user, 'customers') && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('Thành viên, Điểm thưởng & Thông báo Khách hàng', 'Members, Loyalty Points & Customer Notifications')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t(
                      'Điều chỉnh hạng thành viên, cộng điểm thủ công hoặc gửi thông báo khuyến mãi trực tiếp vào hộp thư tài khoản khách hàng.',
                      'Adjust member tiers, award points, or push promotions directly to customer notification inboxes.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyCategory('promo');
                    setNotifyModalTarget({ id: 'all', name: t('Tất cả khách hàng thành viên', 'All Customer Accounts') });
                  }}
                  className="px-4 py-2 bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {t('Gửi thông báo tất cả khách hàng', 'Broadcast to All Customers')}
                </button>
              </div>

              {loyaltySettings && (
                <form
                  onSubmit={saveLoyaltyPolicy}
                  className="bg-white p-5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs items-end"
                >
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t('Điểm / 10.000đ', 'Points / 10k VND')}</label>
                    <input
                      type="number"
                      value={loyaltySettings.points_per_10k_vnd}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_per_10k_vnd: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t('Giá trị 1 điểm (VND)', 'VND / Point')}</label>
                    <input
                      type="number"
                      value={loyaltySettings.vnd_per_point}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, vnd_per_point: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t('Hạn sử dụng (Ngày)', 'Expiry (Days)')}</label>
                    <input
                      type="number"
                      value={loyaltySettings.expiration_days}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, expiration_days: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t('Giảm tối đa (%)', 'Max Redeem %')}</label>
                    <input
                      type="number"
                      value={loyaltySettings.max_redeem_percent}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, max_redeem_percent: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                  <button type="submit" className="py-2 px-4 bg-[#00552B] text-white font-semibold rounded-lg cursor-pointer">
                    {t('Lưu chính sách điểm', 'Save Policy')}
                  </button>
                </form>
              )}

              <AdminWalletPointsPanel onGoProducts={() => selectSection('products')} />

              {/* Mobile Compact Customer Cards */}
              <div className="md:hidden bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {customers.map((c) => (
                  <div key={c.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{c.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.member_code} · {c.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono tabular-nums">
                        <span className="font-bold text-[#00552B] block">{Number(c.wallet_balance_vnd || 0).toLocaleString('vi-VN')} ₫</span>
                        <span className="text-[11px] font-semibold text-amber-600 block">{c.points.available} pts</span>
                        <span className="text-[10px] text-slate-500">{c.orderCount || 0} {t('đơn', 'ord')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <select
                        value={c.tier}
                        onChange={(e) => adjustCustomer(c.id, e.target.value, 0)}
                        className="border border-slate-200 rounded px-2 py-1 bg-white text-[11px]"
                      >
                        {[
                          { val: 'ROAR Member', labelVi: 'Thành viên ROAR' },
                          { val: 'ROAR Silver', labelVi: 'ROAR Bạc' },
                          { val: 'ROAR Gold', labelVi: 'ROAR Vàng' },
                          { val: 'ROAR Reserve', labelVi: 'ROAR Thượng Hạng' },
                        ].map((tr) => (
                          <option key={tr.val} value={tr.val}>
                            {lang === 'en' ? tr.val : tr.labelVi}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustCustomer(c.id, c.tier, 50)}
                          className="px-2 py-1 bg-slate-100 rounded font-mono text-[11px] cursor-pointer"
                        >
                          +50
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifyCategory('promo');
                            setNotifyModalTarget({ id: c.id, name: c.full_name, email: c.email });
                          }}
                          className="px-2.5 py-1 bg-[#00552B]/10 text-[#00552B] rounded font-semibold inline-flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          {t('Nhắn', 'Notify')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3 text-left">{t('Mã TV', 'Member ID')}</th>
                      <th className="p-3 text-left">{t('Họ tên & Email', 'Customer')}</th>
                      <th className="p-3 text-right">{t('Đơn hàng & Tổng chi', 'Orders & Spend')}</th>
                      <th className="p-3 text-left">{t('Hạng thành viên', 'Tier')}</th>
                      <th className="p-3 text-right">{t('Số dư Ví ROAR', 'ROAR Wallet')}</th>
                      <th className="p-3 text-right">{t('Điểm khả dụng', 'Available Pts')}</th>
                      <th className="p-3 text-right">{t('Thao tác & Thông báo', 'Actions & Notify')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono font-semibold">{c.member_code}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{c.full_name}</span>
                            {c.role === 'admin' && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500">{c.email}</div>
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          <div className="font-semibold text-slate-800">{c.orderCount || 0} {t('đơn', 'orders')}</div>
                          <div className="text-[11px] text-slate-500">{(c.totalSpent || 0).toLocaleString()} ₫</div>
                        </td>
                        <td className="p-3">
                          <select
                            value={c.tier}
                            onChange={(e) => adjustCustomer(c.id, e.target.value, 0)}
                            className="border border-slate-200 rounded px-2 py-1 bg-white"
                          >
                            {[
                              { val: 'ROAR Member', labelVi: 'Thành viên ROAR' },
                              { val: 'ROAR Silver', labelVi: 'ROAR Bạc' },
                              { val: 'ROAR Gold', labelVi: 'ROAR Vàng' },
                              { val: 'ROAR Reserve', labelVi: 'ROAR Thượng Hạng' },
                            ].map((tr) => (
                              <option key={tr.val} value={tr.val}>
                                {lang === 'en' ? tr.val : tr.labelVi}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#00552B] tabular-nums whitespace-nowrap">
                          {Number(c.wallet_balance_vnd || 0).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="p-3 text-right font-mono font-bold tabular-nums">{c.points.available}</td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => adjustCustomer(c.id, c.tier, 50)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono cursor-pointer"
                          >
                            +50 {t('điểm', 'pts')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifyCategory('promo');
                              setNotifyModalTarget({ id: c.id, name: c.full_name, email: c.email });
                            }}
                            className="px-2.5 py-1 bg-[#00552B]/10 hover:bg-[#00552B] text-[#00552B] hover:text-white rounded font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            {t('Gửi thông báo', 'Notify')}
                            {c.unreadNotifications > 0 && (
                              <span className="ml-0.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-mono">
                                {c.unreadNotifications}
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. PROMOTIONS, VOUCHERS, WALLET & POINTS */}
          {resolvedSection === 'promotions' && hasAdminPermission(user, 'promotions') && (
            <div className="space-y-3.5 sm:space-y-5">
              <AdminWalletPointsPanel onGoProducts={() => selectSection('products')} />
              <form
                onSubmit={createPromo}
                className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2.5 sm:gap-3 text-xs items-end"
              >
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">{t('Mã ưu đãi', 'Code')}</label>
                  <input
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="ROAR15"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">{t('Tên chương trình (VI)', 'Title (VI)')}</label>
                  <input
                    type="text"
                    required
                    value={promoTitleVi}
                    onChange={(e) => setPromoTitleVi(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">{t('Tên chương trình (EN)', 'Title (EN)')}</label>
                  <input
                    type="text"
                    value={promoTitleEn}
                    onChange={(e) => setPromoTitleEn(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 sm:contents gap-2">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t('Mức giảm (%)', 'Discount %')}</label>
                    <input
                      type="number"
                      required
                      value={promoValue}
                      onChange={(e) => setPromoValue(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t('Ngày kết thúc', 'End Date')}</label>
                    <input
                      type="date"
                      required
                      value={promoEnd}
                      onChange={(e) => setPromoEnd(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                    />
                  </div>
                </div>
                <button type="submit" className="py-2 px-3 bg-[#00552B] text-white font-semibold rounded-lg cursor-pointer">
                  {t('+ Tạo mã ưu đãi', 'Create Promo')}
                </button>
                <label className="sm:col-span-6 inline-flex items-center gap-2 text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={promoNotifyCustomers}
                    onChange={(e) => setPromoNotifyCustomers(e.target.checked)}
                    className="accent-[#00552B]"
                  />
                  <span>
                    {t(
                      'Tự động gửi thông báo ưu đãi mới vào hộp thư tài khoản tất cả khách hàng thành viên',
                      'Automatically notify all customer member inboxes when launching this voucher'
                    )}
                  </span>
                </label>
              </form>

              {/* Mobile Compact Promotions Cards */}
              <div className="md:hidden bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {promotions.map((pm) => (
                  <div key={pm.id} className="p-3 flex items-center justify-between gap-2.5">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#00552B]">{pm.code}</span>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">{pm.used_count}/{pm.usage_limit}</span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate">{lang === 'en' ? pm.title_en : pm.title_vi}</p>
                      <p className="text-[11px] font-mono text-slate-500 tabular-nums">{pm.start_date} → {pm.end_date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/promotions/${pm.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ active: !pm.active }),
                        });
                        loadAll();
                      }}
                      className={`px-2.5 py-1 rounded font-semibold shrink-0 cursor-pointer ${
                        pm.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {pm.active ? t('Bật', 'On') : t('Tắt', 'Off')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3 text-left">{t('Mã ưu đãi', 'Code')}</th>
                      <th className="p-3 text-left">{t('Chương trình', 'Campaign')}</th>
                      <th className="p-3 text-left">{t('Thời gian áp dụng', 'Window')}</th>
                      <th className="p-3 text-right">{t('Đã dùng / Giới hạn', 'Used / Limit')}</th>
                      <th className="p-3 text-left">{t('Trạng thái', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {promotions.map((pm) => (
                      <tr key={pm.id}>
                        <td className="p-3 font-mono font-bold text-[#00552B]">{pm.code}</td>
                        <td className="p-3">{lang === 'en' ? pm.title_en : pm.title_vi}</td>
                        <td className="p-3 font-mono tabular-nums">{pm.start_date} → {pm.end_date}</td>
                        <td className="p-3 text-right font-mono tabular-nums">{pm.used_count} / {pm.usage_limit}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/promotions/${pm.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ active: !pm.active }),
                              });
                              loadAll();
                            }}
                            className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                              pm.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {pm.active ? t('Đang kích hoạt', 'Enabled') : t('Tạm tắt', 'Disabled')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. B2B INQUIRIES & NEWSLETTER SUBSCRIBERS (YÊU CẦU & NEWSLETTER) */}
          {resolvedSection === 'b2b' && hasAdminPermission(user, 'b2b') && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setB2bSubTab('inquiries')}
                    className={`px-3.5 py-2 rounded-lg font-semibold cursor-pointer ${
                      b2bSubTab === 'inquiries' ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t('Yêu cầu B2B & Liên hệ', 'B2B Inquiries')} ({inquiries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setB2bSubTab('newsletter')}
                    className={`px-3.5 py-2 rounded-lg font-semibold cursor-pointer ${
                      b2bSubTab === 'newsletter' ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t('Đăng ký nhận tin (Newsletter)', 'Newsletter Subscribers')} ({newsletterSubscribers.length})
                  </button>
                </div>

                {b2bSubTab === 'newsletter' && newsletterSubscribers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(newsletterSubscribers.map((n) => n.email).join(', '));
                      showToast(t(`Đã sao chép ${newsletterSubscribers.length} email Newsletter`, `Copied ${newsletterSubscribers.length} emails`));
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] font-semibold text-slate-700 cursor-pointer"
                  >
                    {t('Sao chép tất cả Email', 'Copy All Emails')}
                  </button>
                )}
              </div>

              {b2bSubTab === 'inquiries' ? (
                inquiries.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                    {t('Chưa có yêu cầu B2B hoặc liên hệ hợp tác nào.', 'No B2B inquiries received yet.')}
                  </div>
                ) : (
                  <>
                    <div className="md:hidden bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                      {inquiries.map((inq) => (
                        <div key={inq.id} className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{inq.company_name || inq.contact_name}</p>
                              <p className="text-[11px] text-[#00552B] font-medium">{localizeB2BType(inq.inquiry_type, lang)}</p>
                              <p className="text-[11px] text-slate-500 truncate">{inq.email} · {inq.phone}</p>
                            </div>
                            <select
                              value={inq.status}
                              onChange={(e) => updateB2b(inq.id, e.target.value, inq.quoted_price || '')}
                              className="border border-slate-200 rounded px-2 py-1 bg-white text-[11px] shrink-0"
                            >
                              {Object.entries(B2B_STATUS_VI).map(([val, labelVi]) => (
                                <option key={val} value={val}>
                                  {lang === 'en' ? val : labelVi}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[11px] font-mono text-slate-600">{inq.product_sku || '—'} · {inq.estimated_volume || '—'}</p>
                          {inq.message && <p className="text-[11px] text-slate-600 line-clamp-2">{inq.message}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="p-3 text-left">{t('Loại yêu cầu', 'Inquiry Type')}</th>
                            <th className="p-3 text-left">{t('Doanh nghiệp / Liên hệ', 'Company / Contact')}</th>
                            <th className="p-3 text-left">{t('Sản phẩm / Sản lượng', 'SKU / Volume')}</th>
                            <th className="p-3 text-left">{t('Nội dung yêu cầu', 'Message')}</th>
                            <th className="p-3 text-left">{t('Trạng thái xử lý', 'Status')}</th>
                            <th className="p-3 text-right">{t('Xóa', 'Delete')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inquiries.map((inq) => (
                            <tr key={inq.id}>
                              <td className="p-3 font-medium">{localizeB2BType(inq.inquiry_type, lang)}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{inq.company_name || inq.contact_name}</div>
                                <div className="text-slate-500">{inq.email} · {inq.phone}</div>
                              </td>
                              <td className="p-3 font-mono">{inq.product_sku || '—'} · {inq.estimated_volume || '—'}</td>
                              <td className="p-3 max-w-xs truncate">{inq.message}</td>
                              <td className="p-3">
                                <select
                                  value={inq.status}
                                  onChange={(e) => updateB2b(inq.id, e.target.value, inq.quoted_price || '')}
                                  className="border border-slate-200 rounded px-2 py-1 bg-white"
                                >
                                  {Object.entries(B2B_STATUS_VI).map(([val, labelVi]) => (
                                    <option key={val} value={val}>
                                      {lang === 'en' ? val : labelVi}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = await apiFetch(`/api/admin/b2b/${inq.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      showToast(t('Đã xóa yêu cầu B2B', 'Deleted B2B inquiry'));
                                      loadAll();
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  title={t('Xóa yêu cầu', 'Delete inquiry')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              ) : newsletterSubscribers.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                  {t('Chưa có khách hàng nào đăng ký nhận bản tin (Newsletter).', 'No newsletter subscribers yet.')}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">{t('Ngôn ngữ', 'Language')}</th>
                        <th className="p-3 text-left">{t('Ngày đăng ký', 'Subscribed At')}</th>
                        <th className="p-3 text-right">{t('Xóa', 'Delete')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newsletterSubscribers.map((sub) => (
                        <tr key={sub.id}>
                          <td className="p-3 font-mono font-semibold text-slate-900">{sub.email}</td>
                          <td className="p-3 uppercase font-mono text-slate-600">{sub.lang || 'vi'}</td>
                          <td className="p-3 text-slate-500 tabular-nums">{String(sub.created_at || '').slice(0, 16)}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await apiFetch(`/api/admin/newsletter/${sub.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  showToast(t('Đã xóa email khỏi danh sách Newsletter', 'Removed newsletter subscriber'));
                                  loadAll();
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title={t('Xóa email', 'Remove subscriber')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 9. BRAND PERSONALITIES & ORIGINS */}
          {resolvedSection === 'brand' && hasAdminPermission(user, 'brand') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('Quản lý hình ảnh 7 Linh vật Cá tính', 'Seven Personalities Artwork')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('Chọn ảnh mới từ Thư viện hoặc dán đường dẫn ảnh tùy chỉnh cho từng linh vật.', 'Choose custom artwork from Media Library or paste image URL.')}
                  </p>
                </div>
                <div className="space-y-3 text-xs">
                  {personalities.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{lang === 'en' ? m.animal_en : m.animal_vi}</p>
                        <p className="text-slate-500 truncate">
                          {m.is_future_collection ? t('Bộ sưu tập tương lai', 'Future Collection') : m.associated_product_slug}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMascotPickerId(m.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-[#00552B] font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5 text-[#00552B]" />
                        {m.custom_image_url ? t('Đổi ảnh', 'Change Art') : t('Chọn ảnh từ thư viện', 'Pick Artwork')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('Trạng thái các Vùng Nguyên liệu Việt Nam', 'Vietnam Coffee Origins Status')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('Kiểm soát hiển thị vùng thu mua xác thực hay địa lý tham khảo trên bản đồ.', 'Toggle verified sourcing vs general coffee geography on origin map.')}
                  </p>
                </div>
                <div className="space-y-3 text-xs">
                  {origins.map((o) => (
                    <div key={o.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900">{lang === 'en' ? o.region_name_en : o.region_name_vi}</span>
                        <p className="text-slate-500">{o.elevation}</p>
                      </div>
                      <select
                        value={o.sourcing_status}
                        onChange={async (e) => {
                          await apiFetch(`/api/admin/origins/${o.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sourcing_status: e.target.value }),
                          });
                          refreshBootstrap();
                          showToast(t('Đã cập nhật trạng thái vùng trồng', 'Updated origin status'));
                        }}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="confirmed_sourcing">{t('Thu mua xác thực ROAR', 'Confirmed Sourcing')}</option>
                        <option value="general_geography">{t('Vùng địa lý tham khảo', 'General Geography')}</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. SITE SETTINGS & GITHUB PORTABILITY SNAPSHOT */}
          {resolvedSection === 'settings' && hasAdminPermission(user, 'settings') && (
            <div className="space-y-4 sm:space-y-6 max-w-3xl text-xs">
              <form onSubmit={handleSaveSettings} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">{t('Cài đặt chung Website', 'General Site Settings')}</h2>
                  <p className="text-slate-500 mt-0.5">
                    {t('Thông tin thương hiệu, email liên hệ và khẩu hiệu hiển thị trên toàn trang.', 'Global brand details, contact emails, and taglines across storefront.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Email Chăm sóc khách hàng', 'Support Email')}</label>
                    <input
                      type="email"
                      value={siteSettings.contact_email || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Email Hợp tác B2B & Xuất khẩu', 'B2B / Export Email')}</label>
                    <input
                      type="email"
                      value={siteSettings.b2b_email || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, b2b_email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Số điện thoại Hotline (Nút Gọi ngay)', 'Hotline Phone (Call Button)')}</label>
                    <input
                      type="tel"
                      value={siteSettings.hotline || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, hotline: e.target.value })}
                      placeholder="0901234567"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Số điện thoại Zalo (Nút Chat Zalo)', 'Zalo Phone (Zalo Button)')}</label>
                    <input
                      type="tel"
                      value={siteSettings.zalo_phone || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, zalo_phone: e.target.value })}
                      placeholder="0901234567"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Khẩu hiệu thương hiệu (Tiếng Việt)', 'Brand Tagline (VI)')}</label>
                    <input
                      type="text"
                      value={siteSettings.tagline_vi || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline_vi: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Khẩu hiệu thương hiệu (Tiếng Anh)', 'Brand Tagline (EN)')}</label>
                    <input
                      type="text"
                      value={siteSettings.tagline_en || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline_en: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">{t('Địa chỉ văn phòng / Xưởng rang (Tiếng Việt)', 'Office Address (VI)')}</label>
                    <input
                      type="text"
                      value={siteSettings.office_address_vi || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, office_address_vi: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">{t('Địa chỉ văn phòng (Tiếng Anh)', 'Office Address (EN)')}</label>
                    <input
                      type="text"
                      value={siteSettings.office_address_en || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, office_address_en: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Dynamic Order-Total Shipping Rules Setup */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {t('Cấu hình Phí vận chuyển theo Tổng tiền đơn hàng', 'Shipping Fee Rules by Order Total')}
                      </h3>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {t(
                          'Tùy biến phí giao hàng tự động áp dụng tại Giỏ hàng & Thanh toán theo giá trị đơn hàng (VND). Để trống "Đến mức" cho bậc cao nhất.',
                          'Customize shipping fees automatically applied at Cart & Checkout based on order subtotal (VND). Leave Max blank for top tier.'
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [
                          ...shippingRules,
                          { minSubtotal: 0, maxSubtotal: null, feeVnd: 0, labelVi: 'Bậc vận chuyển mới', labelEn: 'New shipping tier' },
                        ];
                        setShippingRules(next);
                        setSiteSettings({ ...siteSettings, shipping_rules_json: JSON.stringify(next) });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('Thêm bậc phí ship', 'Add Tier')}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-2 text-left">{t('Từ tổng tiền (₫)', 'Min Subtotal (₫)')}</th>
                          <th className="p-2 text-left">{t('Đến mức (₫)', 'Max Subtotal (₫)')}</th>
                          <th className="p-2 text-left">{t('Phí ship (₫)', 'Shipping Fee (₫)')}</th>
                          <th className="p-2 text-left">{t('Mô tả hiển thị', 'Label')}</th>
                          <th className="p-2 text-right">{t('Xóa', 'Del')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shippingRules.map((rule, idx) => (
                          <tr key={idx}>
                            <td className="p-2">
                              <input
                                type="number"
                                min={0}
                                step={10000}
                                value={rule.minSubtotal}
                                onChange={(e) => {
                                  const next = shippingRules.map((r, i) =>
                                    i === idx ? { ...r, minSubtotal: Math.max(0, Number(e.target.value)) } : r
                                  );
                                  setShippingRules(next);
                                  setSiteSettings({ ...siteSettings, shipping_rules_json: JSON.stringify(next) });
                                }}
                                className="w-28 border border-slate-200 rounded px-2 py-1 font-mono tabular-nums"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min={0}
                                step={10000}
                                value={rule.maxSubtotal ?? ''}
                                placeholder={t('Không giới hạn', 'No limit')}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const next = shippingRules.map((r, i) =>
                                    i === idx ? { ...r, maxSubtotal: raw === '' ? null : Math.max(0, Number(raw)) } : r
                                  );
                                  setShippingRules(next);
                                  setSiteSettings({ ...siteSettings, shipping_rules_json: JSON.stringify(next) });
                                }}
                                className="w-28 border border-slate-200 rounded px-2 py-1 font-mono tabular-nums"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min={0}
                                step={5000}
                                value={rule.feeVnd}
                                onChange={(e) => {
                                  const next = shippingRules.map((r, i) =>
                                    i === idx ? { ...r, feeVnd: Math.max(0, Number(e.target.value)) } : r
                                  );
                                  setShippingRules(next);
                                  setSiteSettings({ ...siteSettings, shipping_rules_json: JSON.stringify(next) });
                                }}
                                className="w-24 border border-slate-200 rounded px-2 py-1 font-mono tabular-nums font-semibold text-[#00552B]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={rule.labelVi}
                                onChange={(e) => {
                                  const next = shippingRules.map((r, i) =>
                                    i === idx ? { ...r, labelVi: e.target.value, labelEn: e.target.value } : r
                                  );
                                  setShippingRules(next);
                                  setSiteSettings({ ...siteSettings, shipping_rules_json: JSON.stringify(next) });
                                }}
                                className="w-full min-w-[140px] border border-slate-200 rounded px-2 py-1"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                disabled={shippingRules.length <= 1}
                                onClick={() => {
                                  const next = shippingRules.filter((_, i) => i !== idx);
                                  setShippingRules(next);
                                  setSiteSettings({ ...siteSettings, shipping_rules_json: JSON.stringify(next) });
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? t('Đang lưu cài đặt...', 'Saving...') : t('Lưu thay đổi cài đặt', 'Save Settings')}
                  </button>
                </div>
              </form>

              {/* Portable GitHub Snapshot Backup & Sync Card */}
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00552B]/10 text-[#00552B] flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {t('Sao lưu & Đồng bộ Source GitHub (Snapshot JSON)', 'Portable Backup & GitHub Sync (JSON Snapshot)')}
                    </h3>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {t(
                        'CSDL chạy chế độ Single-File (không tách file WAL) và tự động đồng bộ toàn bộ sản phẩm, 10 vùng trồng, 12 trang con, bài viết & hình ảnh ra JSON để tải về hoặc đẩy lên GitHub mà không mất dữ liệu.',
                        'SQLite runs in single-file mode and auto-syncs all products, 10 origins, 12 subpages, posts & settings into portable JSON snapshots for GitHub clones and ZIP exports.'
                      )}
                    </p>
                  </div>
                </div>

                {snapshotSummary?.counts && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PRODUCTS</span>
                      <span className="font-bold text-[#00552B]">{snapshotSummary.counts.products}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ORIGINS</span>
                      <span className="font-bold text-[#00552B]">{snapshotSummary.counts.origins}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SUBPAGES</span>
                      <span className="font-bold text-[#00552B]">{snapshotSummary.counts.cmsPages}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">POSTS / MEDIA</span>
                      <span className="font-bold text-[#00552B]">{snapshotSummary.counts.articles} / {snapshotSummary.counts.mediaAssets}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    disabled={syncingSnapshot}
                    onClick={handleSyncSnapshot}
                    className="px-3.5 py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingSnapshot ? 'animate-spin' : ''}`} />
                    {syncingSnapshot ? t('Đang đồng bộ...', 'Syncing...') : t('Đồng bộ Snapshot ngay', 'Sync Snapshot Now')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSnapshot}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-300 hover:border-[#00552B] bg-white text-slate-800 font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00552B]" />
                    {t('Tải file Backup (.json)', 'Download Backup (.json)')}
                  </button>
                  <label className="px-3.5 py-2.5 rounded-lg border border-slate-300 hover:border-[#00552B] bg-slate-50 text-slate-800 font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#00552B]" />
                    {restoringSnapshot ? t('Đang khôi phục...', 'Restoring...') : t('Khôi phục từ JSON', 'Restore from JSON')}
                    <input
                      type="file"
                      accept="application/json,.json"
                      disabled={restoringSnapshot}
                      onChange={(e) => {
                        handleUploadRestoreSnapshot(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 11. TEAM RBAC (PHÂN QUYỀN THÀNH VIÊN QUẢN TRỊ) */}
          {resolvedSection === 'team' && hasAdminPermission(user, 'team') && (
            <TeamRbacSection
              admins={teamAdmins}
              nonAdmins={teamNonAdmins}
              auditLogs={teamAuditLogs}
              onRefresh={loadAll}
            />
          )}
        </main>
      </div>

      {/* WooCommerce Product Editor Modal */}
      <ProductEditorModal
        open={productModalOpen}
        product={editingProduct}
        mediaAssets={mediaAssets}
        onMediaUploaded={loadMedia}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={loadAll}
      />

      {/* Media Picker for Brand Personalities */}
      <MediaPickerModal
        open={mascotPickerId !== null}
        onClose={() => setMascotPickerId(null)}
        mediaAssets={mediaAssets}
        onMediaUploaded={loadMedia}
        title={t('Chọn hình ảnh linh vật từ thư viện', 'Select Mascot Artwork')}
        onSelect={async (val) => {
          if (mascotPickerId === null) return;
          await apiFetch(`/api/admin/personalities/${mascotPickerId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customImageUrl: val }),
          });
          await refreshBootstrap();
          showToast(t('Đã cập nhật hình ảnh linh vật', 'Updated mascot artwork'));
          setMascotPickerId(null);
        }}
      />

      {/* Shopee-Style Order Detail & Resolution Modal */}
      {resolvingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setResolvingOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#00552B]">
                  {t('Quản lý & Giải quyết Đơn hàng', 'Order Fulfillment & Resolution Center')}
                </p>
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  {resolvingOrder.order_number} · {resolvingOrder.customer_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setResolvingOrder(null)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 5-Stage Shopee Order Stepper */}
              {resStatus === 'Cancelled' || resStatus === 'Returned' ? (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    resStatus === 'Cancelled'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-orange-50 border-orange-200 text-orange-800'
                  }`}
                >
                  {resStatus === 'Cancelled' ? <XCircle className="w-5 h-5 shrink-0" /> : <RotateCcw className="w-5 h-5 shrink-0" />}
                  <div>
                    <p className="font-bold">
                      {resStatus === 'Cancelled'
                        ? t('Đơn hàng ở trạng thái ĐÃ HỦY', 'Order Status: CANCELLED')
                        : t('Đơn hàng đang xử lý TRẢ HÀNG / HOÀN TIỀN', 'Order Status: RETURN / REFUND')}
                    </p>
                    <p className="text-[11px] opacity-85 mt-0.5">
                      {t(
                        'Khi lưu trạng thái Hủy hoặc Trả hàng, hệ thống tự động hoàn trả tồn kho sản phẩm và gửi thông báo giải quyết đến khách hàng.',
                        'Saving Cancelled or Returned automatically restores product inventory and notifies the customer.'
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'Pending', vi: 'Chờ duyệt', en: 'Pending', icon: Clock },
                      { id: 'Confirmed', vi: 'Đã duyệt', en: 'Approved', icon: CheckCircle2 },
                      { id: 'Processing', vi: 'Đóng gói', en: 'Packing', icon: PackageCheck },
                      { id: 'Shipping', vi: 'Đang giao', en: 'Shipping', icon: Truck },
                      { id: 'Completed', vi: 'Hoàn thành', en: 'Completed', icon: CheckCircle2 },
                    ].map((st, idx) => {
                      const orderFlow = ['Pending', 'Confirmed', 'Processing', 'Shipping', 'Completed'];
                      const activeIdx = orderFlow.indexOf(resStatus);
                      const reached = idx <= activeIdx;
                      const IconComp = st.icon;
                      return (
                        <div key={st.id} className="flex flex-col items-center text-center gap-1.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                              reached
                                ? 'bg-[#00552B] text-white border-[#00552B]'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] font-semibold ${reached ? 'text-[#00552B]' : 'text-slate-400'}`}>
                            {t(st.vi, st.en)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Line Items (4:5 thumbnails) + Pricing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-7 space-y-2.5">
                  <p className="font-bold text-slate-900">{t('Chi tiết sản phẩm', 'Order Items')}</p>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {(resolvingOrder.items || []).map((it: any) => (
                      <div key={it.id} className="p-3 flex items-center gap-3">
                        <img
                          src={resolveMediaUrl(it.product_image_key || 'product_robusta_house')}
                          alt={it.product_name_vi}
                          className="w-11 aspect-[4/5] rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {lang === 'en' ? it.product_name_en : it.product_name_vi}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {it.sku} · {localizeVariantLabel(it.variant_label, lang)} ·{' '}
                            {it.unit === 'kg'
                              ? `${it.quantity} kg (${Number(it.unit_price_vnd || 0).toLocaleString()} ₫/kg)`
                              : `×${it.quantity}`}
                          </p>
                        </div>
                        <span className="font-mono font-bold tabular-nums">{it.line_total_vnd.toLocaleString()} ₫</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <p className="font-bold text-slate-900">{t('Thông tin khách & Thanh toán', 'Customer & Billing')}</p>
                  <p className="text-slate-600">{resolvingOrder.customer_name} · {resolvingOrder.customer_phone}</p>
                  <p className="text-slate-600">{resolvingOrder.customer_email}</p>
                  <p className="text-slate-700 pt-1 border-t border-slate-200/70">
                    <strong>{t('Địa chỉ:', 'Ship to:')}</strong> {resolvingOrder.shipping_address}
                  </p>
                  <div className="pt-2 border-t border-slate-200/70 space-y-1 tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('Tạm tính:', 'Subtotal:')}</span>
                      <span className="font-mono">{(resolvingOrder.subtotal || 0).toLocaleString()} ₫</span>
                    </div>
                    {resolvingOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{t('Giảm giá / Voucher:', 'Discount:')}</span>
                        <span className="font-mono">-{resolvingOrder.discount_amount.toLocaleString()} ₫</span>
                      </div>
                    )}
                    {resolvingOrder.points_discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{t('Quy đổi điểm:', 'Points Redeemed:')}</span>
                        <span className="font-mono">-{resolvingOrder.points_discount.toLocaleString()} ₫</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('Phí vận chuyển:', 'Shipping:')}</span>
                      <span className="font-mono">{(resolvingOrder.shipping_fee || 0).toLocaleString()} ₫</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-[#00552B] pt-1 border-t border-slate-200">
                      <span>{t('Tổng đơn hàng:', 'Total:')}</span>
                      <span className="font-mono">{(resolvingOrder.total || 0).toLocaleString()} ₫</span>
                    </div>
                  </div>
                </div>
              </div>

              {resolvingOrder.notes && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
                  <p className="font-bold text-amber-900">{t('Lịch sử ghi chú & giải quyết trước đó', 'Previous Notes & Resolution Log')}</p>
                  <p className="text-slate-700 whitespace-pre-line">{resolvingOrder.notes}</p>
                </div>
              )}

              {/* Resolution Action Form */}
              <form onSubmit={handleSaveOrderResolution} className="space-y-4 border-t border-slate-200 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Trạng thái xử lý đơn', 'Order Status')}</label>
                    <select
                      value={resStatus}
                      onChange={(e) => setResStatus(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold"
                    >
                      {ORDER_STATUS_LIST.map((st) => (
                        <option key={st} value={st}>
                          {localizeOrderStatus(st, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Trạng thái thanh toán', 'Payment Status')}</label>
                    <select
                      value={resPayment}
                      onChange={(e) => setResPayment(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold"
                    >
                      {PAYMENT_STATUS_LIST.map((pst) => (
                        <option key={pst} value={pst}>
                          {localizePaymentStatus(pst, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Đơn vị vận chuyển', 'Shipping Carrier')}</label>
                    <select
                      value={resCarrier}
                      onChange={(e) => setResCarrier(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                      <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                      <option value="Viettel Post (VTP)">Viettel Post (VTP)</option>
                      <option value="Ahamove Express">Ahamove Express</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Mã vận đơn (Tracking Code)', 'Tracking Code')}</label>
                    <input
                      type="text"
                      value={resTracking}
                      onChange={(e) => setResTracking(e.target.value)}
                      placeholder="GHN-8826109..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="font-semibold text-slate-700">
                      {t('Ghi chú giải quyết / Phản hồi gửi khách hàng', 'Resolution Note (Notifies Customer Account)')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        t('Đã duyệt đơn & chuyển xưởng rang', 'Approved & routed to roastery'),
                        t('Đã đối soát thanh toán QR thành công', 'Verified QR payment transfer'),
                        t('Hoàn tất giải quyết đổi trả / hoàn tiền', 'Return/refund resolved'),
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setResNote(chip)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={resNote}
                    onChange={(e) => setResNote(e.target.value)}
                    placeholder={t('Nhập hướng xử lý, lý do hoàn tiền hoặc thông báo giao hàng cho khách...', 'Enter resolution note, courier note, or refund decision...')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingOrder(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    {t('Đóng', 'Close')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingOrderResolution}
                    className="px-5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {savingOrderResolution
                      ? t('Đang lưu & gửi thông báo...', 'Saving & Notifying...')
                      : t('Cập nhật & Giải quyết đơn hàng', 'Save & Resolve Order')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin -> Customer Notification Composer Modal */}
      {notifyModalTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setNotifyModalTarget(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#00552B]">
                  {t('Gửi thông báo trực tiếp đến Khách hàng', 'Send Customer Notification')}
                </p>
                <h2 className="text-base font-bold text-slate-900">
                  {notifyModalTarget.name}
                  {notifyModalTarget.email ? ` (${notifyModalTarget.email})` : ''}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setNotifyModalTarget(null)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-slate-500 py-1">{t('Mẫu nhanh:', 'Templates:')}</span>
              <button
                type="button"
                onClick={() => {
                  setNotifyCategory('promo');
                  setNotifyTitleVi('Ưu đãi Thành viên: Giảm 15% mã THANHVIEN15');
                  setNotifyTitleEn('Member Exclusive: 15% Off Code THANHVIEN15');
                  setNotifyMessageVi('Sử dụng mã THANHVIEN15 tại bước thanh toán để nhận ưu đãi 15% cho mọi dòng cà phê rang xay ROAR COFFEE.');
                  setNotifyMessageEn('Apply THANHVIEN15 at checkout for 15% off all ROAR COFFEE roasted selections.');
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium cursor-pointer"
              >
                + {t('Khuyến mãi 15%', '15% Promo')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotifyCategory('loyalty');
                  setNotifyTitleVi('Thông báo Điểm thưởng & Đặc quyền Hạng');
                  setNotifyTitleEn('ROAR Points & Tier Privilege Notice');
                  setNotifyMessageVi('Tài khoản của bạn vừa được cập nhật quyền lợi thành viên ROAR COFFEE. Kiểm tra mục Điểm thưởng để quy đổi cho đơn hàng tiếp theo.');
                  setNotifyMessageEn('Your ROAR COFFEE membership benefits have been updated. Visit your Rewards ledger to redeem points.');
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium cursor-pointer"
              >
                + {t('Tri ân điểm thưởng', 'Loyalty Update')}
              </button>
            </div>

            <form onSubmit={handleSendCustomerNotification} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Phân loại thông báo', 'Category')}</label>
                <select
                  value={notifyCategory}
                  onChange={(e) => setNotifyCategory(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="promo">{t('Khuyến mãi & Voucher', 'Promotion & Voucher')}</option>
                  <option value="loyalty">{t('Điểm thưởng & Hạng thành viên', 'Loyalty & Membership')}</option>
                  <option value="order">{t('Cập nhật Đơn hàng', 'Order Update')}</option>
                  <option value="system">{t('Thông báo Hệ thống', 'System Notice')}</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề (VI) *', 'Title (VI) *')}</label>
                  <input
                    type="text"
                    required
                    value={notifyTitleVi}
                    onChange={(e) => setNotifyTitleVi(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề (EN)', 'Title (EN)')}</label>
                  <input
                    type="text"
                    value={notifyTitleEn}
                    onChange={(e) => setNotifyTitleEn(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Nội dung thông báo (VI) *', 'Message (VI) *')}</label>
                <textarea
                  rows={3}
                  required
                  value={notifyMessageVi}
                  onChange={(e) => setNotifyMessageVi(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Nội dung (EN)', 'Message (EN)')}</label>
                <textarea
                  rows={2}
                  value={notifyMessageEn}
                  onChange={(e) => setNotifyMessageEn(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotifyModalTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  {t('Hủy', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={sendingNotify}
                  className="px-5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingNotify ? t('Đang gửi...', 'Sending...') : t('Gửi thông báo ngay', 'Send Notification')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
