import crypto from 'crypto';
import db from '../db.js';
import { HttpError } from '../utils/errors.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    const rawToken = authHeader.slice(7).trim();
    if (!rawToken) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    let tokenId = null;
    let plainToken = rawToken;

    if (rawToken.includes('|')) {
      const parts = rawToken.split('|');
      tokenId = parseInt(parts[0], 10);
      plainToken = parts.slice(1).join('|');
    }

    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    let tokenResult;
    if (tokenId && !isNaN(tokenId)) {
      tokenResult = await db.query(
        'SELECT * FROM personal_access_tokens WHERE id = $1',
        [tokenId]
      );
    } else {
      tokenResult = await db.query(
        'SELECT * FROM personal_access_tokens WHERE token = $1',
        [hashedToken]
      );
    }

    if (tokenResult.rows.length === 0) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    const tokenRow = tokenResult.rows[0];

    // Constant-time compare hashes if tokenId was provided
    if (tokenId && !crypto.timingSafeEqual(Buffer.from(tokenRow.token), Buffer.from(hashedToken))) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    // Check expiration: expires_at column or TOKEN_TTL_MINUTES (default 1440 min = 24h)
    const ttlMinutes = parseInt(process.env.TOKEN_TTL_MINUTES || '1440', 10);
    const createdAtTime = new Date(tokenRow.created_at).getTime();
    const ageMinutes = (Date.now() - createdAtTime) / (1000 * 60);

    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    if (ageMinutes > ttlMinutes) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    // Update last_used_at
    await db.query(
      'UPDATE personal_access_tokens SET last_used_at = NOW() WHERE id = $1',
      [tokenRow.id]
    );

    // Load user without password and remember_token
    const userResult = await db.query(
      'SELECT id, name, email, email_verified_at, role, created_at, updated_at FROM users WHERE id = $1',
      [tokenRow.tokenable_id]
    );

    if (userResult.rows.length === 0) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    req.user = userResult.rows[0];
    req.tokenRecord = tokenRow;
    next();
  } catch (err) {
    if (err instanceof HttpError) {
      return next(err);
    }
    // Malformed token or parse issues must result in 401, not 500
    return next(new HttpError(401, 'Unauthenticated.'));
  }
}
