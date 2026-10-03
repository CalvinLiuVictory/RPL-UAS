import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db.js';
import { HttpError } from '../utils/errors.js';
import { recordFailedLogin, resetLoginAttempts } from '../middleware/rateLimit.js';

const loginSchema = z.object({
  email: z.string({ required_error: 'The email field is required.' })
    .min(1, 'The email field is required.')
    .email('Format email tidak valid (contoh: user@campuscare.com).'),
  password: z.string({ required_error: 'The password field is required.' })
    .min(1, 'The password field is required.'),
});

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);

    const userResult = await db.query(
      'SELECT id, name, email, email_verified_at, password, role, created_at, updated_at FROM users WHERE email = $1',
      [validated.email]
    );

    if (userResult.rows.length === 0) {
      await recordFailedLogin(req);
      throw new HttpError(401, 'Email atau password salah');
    }

    const user = userResult.rows[0];

    // Verify password with bcryptjs
    const passwordMatch = bcrypt.compareSync(validated.password, user.password);
    if (!passwordMatch) {
      await recordFailedLogin(req);
      throw new HttpError(401, 'Email atau password salah');
    }

    // Reset rate limiter on successful authentication
    await resetLoginAttempts(req);

    // Generate 40-character random hex token (like Sanctum)
    const plainToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    const ttlMinutes = parseInt(process.env.TOKEN_TTL_MINUTES || '1440', 10);
    const tokenInsertResult = await db.query(
      `INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' minutes')::interval, NOW(), NOW())
       RETURNING id, expires_at`,
      ['App\\Models\\User', user.id, 'auth_token', hashedToken, '["*"]', ttlMinutes]
    );

    const tokenId = tokenInsertResult.rows[0].id;
    const formattedToken = `${tokenId}|${plainToken}`;

    // Clean user object (never return password or remember_token)
    const { password, ...safeUser } = user;

    return res.status(200).json({
      message: 'Login berhasil',
      access_token: formattedToken,
      token_type: 'Bearer',
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.tokenRecord?.id) {
      await db.query('DELETE FROM personal_access_tokens WHERE id = $1', [req.tokenRecord.id]);
    }

    return res.status(200).json({
      message: 'Berhasil logout',
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    return res.status(200).json({
      message: 'Detail profil user',
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
}
