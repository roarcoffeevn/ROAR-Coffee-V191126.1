export type AdminPermission =
  | 'overview'
  | 'pages'
  | 'posts'
  | 'media'
  | 'products'
  | 'orders'
  | 'customers'
  | 'promotions'
  | 'b2b'
  | 'brand'
  | 'settings'
  | 'team';

export type AdminRoleKey =
  | 'super_admin'
  | 'order_manager'
  | 'content_editor'
  | 'product_manager'
  | 'cs_b2b'
  | 'custom_staff';

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'overview',
  'pages',
  'posts',
  'media',
  'products',
  'orders',
  'customers',
  'promotions',
  'b2b',
  'brand',
  'settings',
  'team',
];

export interface AdminRolePreset {
  key: AdminRoleKey;
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
  permissions: AdminPermission[];
}

export const ADMIN_ROLE_PRESETS: AdminRolePreset[] = [
  {
    key: 'super_admin',
    labelVi: 'Quản trị Tối cao (Super Admin)',
    labelEn: 'Super Administrator',
    descVi: 'Toàn quyền truy cập tất cả 12 phân hệ, cài đặt hệ thống và phân quyền thành viên.',
    descEn: 'Full unrestricted access across all 12 CMS modules, settings, and team RBAC.',
    permissions: [...ALL_ADMIN_PERMISSIONS],
  },
  {
    key: 'order_manager',
    labelVi: 'Quản lý Đơn hàng & Vận hành',
    labelEn: 'Order & Fulfillment Manager',
    descVi: 'Duyệt đơn hàng, đối soát thanh toán, chăm sóc khách hàng và phát hành voucher.',
    descEn: 'Approve and resolve orders, reconcile payments, manage loyalty and promotions.',
    permissions: ['overview', 'orders', 'customers', 'promotions'],
  },
  {
    key: 'content_editor',
    labelVi: 'Biên tập Nội dung & Trang con',
    labelEn: 'Content & Pages Editor',
    descVi: 'Chỉnh sửa trang con website, đăng bài tạp chí, tải ảnh thư viện và quản lý linh vật.',
    descEn: 'Edit storefront subpages, publish journal posts, upload media, and manage origin/brand info.',
    permissions: ['overview', 'pages', 'posts', 'media', 'brand'],
  },
  {
    key: 'product_manager',
    labelVi: 'Quản lý Sản phẩm & Kho',
    labelEn: 'Catalog & Inventory Manager',
    descVi: 'Tạo/cập nhật SKU rang xay, hòa tan, nhân xanh B2B, thư viện ảnh và vùng trồng.',
    descEn: 'Manage retail & B2B green coffee SKUs, galleries, media assets, and origins.',
    permissions: ['overview', 'products', 'media', 'brand'],
  },
  {
    key: 'cs_b2b',
    labelVi: 'Chăm sóc Khách hàng & Đối tác B2B',
    labelEn: 'Customer Care & B2B Sales',
    descVi: 'Xử lý yêu cầu B2B/OEM/HORECA, gửi thông báo thành viên và theo dõi đơn hàng.',
    descEn: 'Handle B2B/OEM/HORECA inquiries, member notifications, and order inquiries.',
    permissions: ['overview', 'orders', 'customers', 'b2b'],
  },
  {
    key: 'custom_staff',
    labelVi: 'Nhân sự Tùy chỉnh quyền',
    labelEn: 'Custom Staff Role',
    descVi: 'Chọn thủ công từng phân hệ được phép thao tác trong CMS.',
    descEn: 'Granular manually selected module permissions.',
    permissions: ['overview'],
  },
];

export const ADMIN_PERMISSION_META: Array<{
  key: AdminPermission;
  labelVi: string;
  labelEn: string;
  groupVi: string;
  groupEn: string;
}> = [
  { key: 'overview', labelVi: 'Tổng quan Dashboard', labelEn: 'Dashboard Overview', groupVi: 'Bảng tin', groupEn: 'Workspace' },
  { key: 'pages', labelVi: 'Chỉnh sửa Trang con', labelEn: 'Storefront Subpages', groupVi: 'Nội dung', groupEn: 'Content' },
  { key: 'posts', labelVi: 'Bài viết & Tạp chí', labelEn: 'Journal Posts', groupVi: 'Nội dung', groupEn: 'Content' },
  { key: 'media', labelVi: 'Thư viện Hình ảnh', labelEn: 'Media Library', groupVi: 'Nội dung', groupEn: 'Content' },
  { key: 'products', labelVi: 'Quản lý Sản phẩm', labelEn: 'Products Catalog', groupVi: 'Cửa hàng', groupEn: 'Store' },
  { key: 'orders', labelVi: 'Duyệt & Xử lý Đơn hàng', labelEn: 'Order Fulfillment', groupVi: 'Cửa hàng', groupEn: 'Store' },
  { key: 'customers', labelVi: 'Khách hàng & Điểm thưởng', labelEn: 'Customers & Loyalty', groupVi: 'Cửa hàng', groupEn: 'Store' },
  { key: 'promotions', labelVi: 'Khuyến mãi & Voucher', labelEn: 'Promotions', groupVi: 'Cửa hàng', groupEn: 'Store' },
  { key: 'b2b', labelVi: 'Yêu cầu Đối tác B2B', labelEn: 'B2B Inquiries', groupVi: 'Hệ thống', groupEn: 'System' },
  { key: 'brand', labelVi: 'Linh vật & Vùng trồng', labelEn: 'Mascots & Origins', groupVi: 'Hệ thống', groupEn: 'System' },
  { key: 'settings', labelVi: 'Cài đặt Website', labelEn: 'Site Settings', groupVi: 'Hệ thống', groupEn: 'System' },
  { key: 'team', labelVi: 'Phân quyền Thành viên', labelEn: 'Team & RBAC', groupVi: 'Hệ thống', groupEn: 'System' },
];

export function hasAdminPermission(
  user: { role?: string; adminRole?: string; adminPermissions?: string[] } | null | undefined,
  perm: AdminPermission
): boolean {
  if (!user || user.role !== 'admin') return false;
  if (user.adminRole === 'super_admin') return true;
  if (Array.isArray(user.adminPermissions) && user.adminPermissions.includes(perm)) return true;
  // Backward compatibility if an existing admin session token/user has no explicit adminRole yet
  if (!user.adminRole && (!user.adminPermissions || user.adminPermissions.length === 0)) return true;
  return false;
}

export function getRolePreset(roleKey: string | undefined): AdminRolePreset {
  return ADMIN_ROLE_PRESETS.find((r) => r.key === roleKey) || ADMIN_ROLE_PRESETS[ADMIN_ROLE_PRESETS.length - 1];
}
