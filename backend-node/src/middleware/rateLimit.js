import db from '../db.js';
import { HttpError } from '../utils/errors.js';

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    // Leftmost IP is the original client behind reverse proxies (Vercel, Cloudflare, etc.)
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export function getKeys(req) {
  const ip = getClientIp(req);
  const identifier = (req.body?.email || req.body?.username || '').trim().toLowerCase();
  return {
    ipEmailKey: `login:ip_email:${ip}:${identifier}`,
    ipKey: `login:ip:${ip}`,
  };
}

export async function loginRateLimiter(req, res, next) {
  try {
    const { ipEmailKey, ipKey } = getKeys(req);
    const windowSeconds = 60;
    const maxIpEmailAttempts = 5;
    const maxIpAttempts = 60;

    // Check both counters
    const result = await db.query(
      `SELECT key, count, EXTRACT(EPOCH FROM (NOW() - window_start)) AS elapsed
       FROM login_attempts
       WHERE key IN ($1, $2)`,
      [ipEmailKey, ipKey]
    );

    for (const row of result.rows) {
      const elapsed = parseFloat(row.elapsed);
      if (elapsed < windowSeconds) {
        if (row.key === ipEmailKey && row.count >= maxIpEmailAttempts) {
          const retryAfter = Math.max(1, Math.ceil(windowSeconds - elapsed));
          res.setHeader('Retry-After', String(retryAfter));
          return next(
            new HttpError(429, 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.')
          );
        }
        if (row.key === ipKey && row.count >= maxIpAttempts) {
          const retryAfter = Math.max(1, Math.ceil(windowSeconds - elapsed));
          res.setHeader('Retry-After', String(retryAfter));
          return next(
            new HttpError(429, 'Terlalu banyak percobaan login dari IP Anda. Silakan tunggu beberapa saat.')
          );
        }
      }
    }

    next();
  } catch (err) {
    console.error('[RateLimiter Error]:', err.message);
    next();
  }
}

export async function recordFailedLogin(req) {
  try {
    const { ipEmailKey, ipKey } = getKeys(req);
    const windowSeconds = 60;

    // Opportunistic cleanup of stale login_attempts older than 10 minutes
    db.query('DELETE FROM login_attempts WHERE EXTRACT(EPOCH FROM (NOW() - window_start)) > 600').catch(() => {});

    // Atomic increment for both keys using INSERT ... ON CONFLICT DO UPDATE ... RETURNING
    const atomicQuery = `
      INSERT INTO login_attempts (key, count, window_start)
      VALUES ($1, 1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET count = CASE
            WHEN EXTRACT(EPOCH FROM (NOW() - login_attempts.window_start)) >= ${windowSeconds} THEN 1
            ELSE login_attempts.count + 1
          END,
          window_start = CASE
            WHEN EXTRACT(EPOCH FROM (NOW() - login_attempts.window_start)) >= ${windowSeconds} THEN NOW()
            ELSE login_attempts.window_start
          END
      RETURNING key, count, EXTRACT(EPOCH FROM (NOW() - window_start)) AS elapsed;
    `;

    await Promise.all([
      db.query(atomicQuery, [ipEmailKey]),
      db.query(atomicQuery, [ipKey]),
    ]);
  } catch (err) {
    console.error('[RecordFailedLogin Error]:', err.message);
  }
}

export async function resetLoginAttempts(req) {
  try {
    const { ipEmailKey } = getKeys(req);
    await db.query('DELETE FROM login_attempts WHERE key = $1', [ipEmailKey]);
  } catch (err) {
    console.error('[ResetLoginAttempts Error]:', err.message);
  }
}
