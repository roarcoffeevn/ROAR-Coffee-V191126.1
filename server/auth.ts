import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const AUTH_SECRET = process.env.AUTH_SECRET || 'roar-coffee-dev-session-signing-key-2026';
export const SESSION_COOKIE_NAME = 'roar_session';

export const ALL_ADMIN_PERMISSIONS = [
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
] as const;

export type AdminPermission = (typeof ALL_ADMIN_PERMISSIONS)[number];

export const ADMIN_ROLE_PRESETS: Record<string, AdminPermission[]> = {
  super_admin: [...ALL_ADMIN_PERMISSIONS],
  order_manager: ['overview', 'orders', 'customers', 'promotions'],
  content_editor: ['overview', 'pages', 'posts', 'media', 'brand'],
  product_manager: ['overview', 'products', 'media', 'brand'],
  cs_b2b: ['overview', 'orders', 'customers', 'b2b'],
  custom_staff: ['overview'],
};

export function resolveEffectiveAdminPermissions(userRow: any): {
  adminRole: string;
  adminPermissions: string[];
} {
  if (!userRow || userRow.role !== 'admin') {
    return { adminRole: 'none', adminPermissions: [] };
  }
  const adminRole = userRow.admin_role && userRow.admin_role !== 'none' ? String(userRow.admin_role) : 'super_admin';
  if (adminRole === 'super_admin') {
    return { adminRole: 'super_admin', adminPermissions: [...ALL_ADMIN_PERMISSIONS] };
  }
  let parsed: string[] = [];
  try {
    const raw = JSON.parse(userRow.admin_permissions_json || '[]');
    if (Array.isArray(raw)) {
      parsed = raw.filter((p): p is string => typeof p === 'string' && (ALL_ADMIN_PERMISSIONS as readonly string[]).includes(p));
    }
  } catch {
    parsed = [];
  }
  if (parsed.length === 0 && ADMIN_ROLE_PRESETS[adminRole]) {
    parsed = [...ADMIN_ROLE_PRESETS[adminRole]];
  }
  return { adminRole, adminPermissions: parsed };
}

export interface SessionPayload {
  userId: number;
  email: string;
  role: 'customer' | 'b2b_partner' | 'admin';
  exp: number;
}

export interface AuthedRequest extends Request {
  authUser?: SessionPayload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = 60 * 60 * 24 * 7): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

export function attachAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  let token = cookies[SESSION_COOKIE_NAME];
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  const payload = verifySessionToken(token);
  if (payload) {
    req.authUser = payload;
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Administrator authentication required' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Administrator role required' });
    return;
  }
  next();
}
