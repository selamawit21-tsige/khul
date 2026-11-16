import {eq} from 'drizzle-orm';
import type {NextFunction, Request, Response} from 'express';
import type {DecodedIdToken} from 'firebase-admin/auth';
import {db} from '../db/index.ts';
import {admins} from '../db/schema.ts';
import {adminAuth} from '../lib/firebase-admin.ts';

export const PRIMARY_ADMIN_EMAIL = 'tsigeselamawit925@gmail.com';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  isAdminUser?: boolean;
}

export async function checkIsAdmin(decoded: DecodedIdToken): Promise<boolean> {
  if (!decoded.email_verified) return false;
  const email = (decoded.email ?? '').toLowerCase();
  if (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const rows = await db
      .select({uid: admins.uid})
      .from(admins)
      .where(eq(admins.uid, decoded.uid))
      .limit(1);
    return rows.length > 0;
  } catch (error) {
    console.error('Admin lookup failed:', error);
    return false;
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return next();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.isAdminUser = await checkIsAdmin(decodedToken);
  } catch (error) {
    console.warn('Optional Firebase token check failed:', error);
  }
  return next();
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({error: 'Unauthorized: Missing token'});
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.email_verified) {
      return res.status(403).json({error: 'Forbidden: Verified email required'});
    }
    req.user = decodedToken;
    req.isAdminUser = await checkIsAdmin(decodedToken);
    return next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({error: 'Unauthorized: Invalid token'});
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  await requireAuth(req, res, async () => {
    if (!req.user || !req.isAdminUser) {
      return res.status(403).json({error: 'Forbidden: Khul Admin privilege required'});
    }
    return next();
  });
};
