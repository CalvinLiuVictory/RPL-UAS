import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db.js';
import { HttpError, validationError } from '../utils/errors.js';

const storeUserSchema = z.object({
  name: z.string({ required_error: 'The name field is required.' })
    .min(1, 'The name field is required.')
    .max(255, 'The name field must not be greater than 255 characters.'),
  email: z.string({ required_error: 'The email field is required.' })
    .email('The email field must be a valid email address.'),
  password: z.string({ required_error: 'The password field is required.' })
    .min(8, 'The password field must be at least 8 characters.'),
  role: z.enum(['admin', 'teknisi', 'user'], {
    errorMap: () => ({ message: 'The selected role is invalid.' }),
  }),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'The name field is required.').max(255).optional(),
  email: z.string().email('The email field must be a valid email address.').optional(),
  password: z.string().min(8, 'The password field must be at least 8 characters.').nullable().optional(),
  role: z.enum(['admin', 'teknisi', 'user']).optional(),
});

export async function index(req, res, next) {
  try {
    const role = req.query.role;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.max(1, parseInt(req.query.per_page || '10', 10));
    const offset = (page - 1) * perPage;

    let countQuery = 'SELECT COUNT(*)::int as total FROM users';
    let dataQuery = `SELECT id, name, email, email_verified_at, role, created_at, updated_at
                     FROM users`;
    const params = [];

    if (role && ['admin', 'teknisi', 'user'].includes(role)) {
      params.push(role);
      countQuery += ' WHERE role = $1';
      dataQuery += ` WHERE role = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`;
    } else {
      dataQuery += ` ORDER BY id DESC LIMIT $1 OFFSET $2`;
    }

    const countRes = await db.query(countQuery, params);
    const total = countRes.rows[0].total;

    const dataParams = params.length > 0 ? [role, perPage, offset] : [perPage, offset];
    const dataRes = await db.query(dataQuery, dataParams);

    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const baseUrl = `${req.protocol}://${req.get('host')}/api/users`;

    const from = total > 0 ? offset + 1 : null;
    const to = total > 0 ? Math.min(offset + perPage, total) : null;

    // Laravel 12 pagination link structure
    const links = [
      {
        url: page > 1 ? `${baseUrl}?page=${page - 1}` : null,
        label: '&laquo; Previous',
        page: page > 1 ? page - 1 : null,
        active: false,
      },
    ];

    for (let p = 1; p <= lastPage; p++) {
      links.push({
        url: `${baseUrl}?page=${p}`,
        label: String(p),
        page: p,
        active: p === page,
      });
    }

    links.push({
      url: page < lastPage ? `${baseUrl}?page=${page + 1}` : null,
      label: 'Next &raquo;',
      page: page < lastPage ? page + 1 : null,
      active: false,
    });

    const paginationResponse = {
      current_page: page,
      data: dataRes.rows,
      first_page_url: `${baseUrl}?page=1`,
      from,
      last_page: lastPage,
      last_page_url: `${baseUrl}?page=${lastPage}`,
      links,
      next_page_url: page < lastPage ? `${baseUrl}?page=${page + 1}` : null,
      path: baseUrl,
      per_page: perPage,
      prev_page_url: page > 1 ? `${baseUrl}?page=${page - 1}` : null,
      to,
      total,
    };

    return res.status(200).json(paginationResponse);
  } catch (err) {
    next(err);
  }
}

export async function store(req, res, next) {
  try {
    const validated = storeUserSchema.parse(req.body);

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [validated.email]);
    if (existing.rows.length > 0) {
      throw validationError({ email: ['The email has already been taken.'] });
    }

    const hashedPassword = bcrypt.hashSync(validated.password, 12);

    const insertResult = await db.query(
      `INSERT INTO users (name, email, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, email, email_verified_at, role, created_at, updated_at`,
      [validated.name, validated.email, hashedPassword, validated.role]
    );

    return res.status(201).json({
      message: 'User berhasil ditambahkan',
      data: insertResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, name, email, email_verified_at, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, 'User tidak ditemukan');
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;

    const checkUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      throw new HttpError(404, 'User tidak ditemukan');
    }

    const validated = updateUserSchema.parse(req.body);

    if (validated.email) {
      const dup = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [validated.email, id]);
      if (dup.rows.length > 0) {
        throw validationError({ email: ['The email has already been taken.'] });
      }
    }

    const current = checkUser.rows[0];
    const name = validated.name ?? current.name;
    const email = validated.email ?? current.email;
    const role = validated.role ?? current.role;
    const password = validated.password && validated.password.length > 0
      ? bcrypt.hashSync(validated.password, 12)
      : current.password;

    const updateResult = await db.query(
      `UPDATE users
       SET name = $1, email = $2, role = $3, password = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, email_verified_at, role, created_at, updated_at`,
      [name, email, role, password, id]
    );

    return res.status(200).json({
      message: 'Data user berhasil diperbarui',
      data: updateResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function destroy(req, res, next) {
  try {
    const { id } = req.params;

    const checkUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      throw new HttpError(404, 'User tidak ditemukan');
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);

    return res.status(200).json({
      message: 'User berhasil dihapus',
    });
  } catch (err) {
    next(err);
  }
}
