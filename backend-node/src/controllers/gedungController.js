import { z } from 'zod';
import db from '../db.js';
import { HttpError, validationError } from '../utils/errors.js';

const storeGedungSchema = z.object({
  nama_gedung: z.string({ required_error: 'The nama gedung field is required.' })
    .min(1, 'The nama gedung field is required.')
    .max(255, 'The nama gedung field must not be greater than 255 characters.'),
  kode_gedung: z.string({ required_error: 'The kode gedung field is required.' })
    .min(1, 'The kode gedung field is required.'),
  keterangan: z.string().nullable().optional(),
});

const updateGedungSchema = z.object({
  nama_gedung: z.string().min(1, 'The nama gedung field is required.').max(255).optional(),
  kode_gedung: z.string().min(1, 'The kode gedung field is required.').optional(),
  keterangan: z.string().nullable().optional(),
});

export async function index(req, res, next) {
  try {
    const result = await db.query(`
      SELECT g.id, g.kode_gedung, g.nama_gedung, g.keterangan, g.created_at, g.updated_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', r.id,
                   'gedung_id', r.gedung_id,
                   'nama_ruangan', r.nama_ruangan,
                   'created_at', r.created_at,
                   'updated_at', r.updated_at
                 ) ORDER BY r.id ASC
               ) FILTER (WHERE r.id IS NOT NULL),
               '[]'::json
             ) AS ruangans
      FROM gedungs g
      LEFT JOIN ruangans r ON r.gedung_id = g.id
      GROUP BY g.id
      ORDER BY g.id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function store(req, res, next) {
  try {
    const validated = storeGedungSchema.parse(req.body);

    // Check unique kode_gedung
    const existing = await db.query('SELECT id FROM gedungs WHERE kode_gedung = $1', [validated.kode_gedung]);
    if (existing.rows.length > 0) {
      throw validationError({ kode_gedung: ['The kode gedung has already been taken.'] });
    }

    const insertResult = await db.query(
      `INSERT INTO gedungs (kode_gedung, nama_gedung, keterangan, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, kode_gedung, nama_gedung, keterangan, created_at, updated_at`,
      [validated.kode_gedung, validated.nama_gedung, validated.keterangan ?? null]
    );

    return res.status(201).json({
      message: 'Gedung berhasil ditambahkan',
      data: insertResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const { id } = req.params;

    const gedungResult = await db.query(
      'SELECT id, kode_gedung, nama_gedung, keterangan, created_at, updated_at FROM gedungs WHERE id = $1',
      [id]
    );

    if (gedungResult.rows.length === 0) {
      throw new HttpError(404, 'Gedung tidak ditemukan');
    }

    const gedung = gedungResult.rows[0];

    // Fetch ruangans with their perangkats
    const ruangansResult = await db.query(`
      SELECT r.id, r.gedung_id, r.nama_ruangan, r.created_at, r.updated_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'ruangan_id', p.ruangan_id,
                   'kode_aset', p.kode_aset,
                   'nama_perangkat', p.nama_perangkat,
                   'status', p.status,
                   'created_at', p.created_at,
                   'updated_at', p.updated_at
                 ) ORDER BY p.id ASC
               ) FILTER (WHERE p.id IS NOT NULL),
               '[]'::json
             ) AS perangkats
      FROM ruangans r
      LEFT JOIN perangkats p ON p.ruangan_id = r.id
      WHERE r.gedung_id = $1
      GROUP BY r.id
      ORDER BY r.id ASC
    `, [id]);

    gedung.ruangans = ruangansResult.rows;

    return res.status(200).json(gedung);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;

    const checkGedung = await db.query('SELECT * FROM gedungs WHERE id = $1', [id]);
    if (checkGedung.rows.length === 0) {
      throw new HttpError(404, 'Gedung tidak ditemukan');
    }

    const validated = updateGedungSchema.parse(req.body);

    if (validated.kode_gedung) {
      const dup = await db.query(
        'SELECT id FROM gedungs WHERE kode_gedung = $1 AND id != $2',
        [validated.kode_gedung, id]
      );
      if (dup.rows.length > 0) {
        throw validationError({ kode_gedung: ['The kode gedung has already been taken.'] });
      }
    }

    const current = checkGedung.rows[0];
    const nama_gedung = validated.nama_gedung ?? current.nama_gedung;
    const kode_gedung = validated.kode_gedung ?? current.kode_gedung;
    const keterangan = validated.keterangan !== undefined ? validated.keterangan : current.keterangan;

    const updateResult = await db.query(
      `UPDATE gedungs
       SET nama_gedung = $1, kode_gedung = $2, keterangan = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, kode_gedung, nama_gedung, keterangan, created_at, updated_at`,
      [nama_gedung, kode_gedung, keterangan, id]
    );

    return res.status(200).json({
      message: 'Data gedung berhasil diperbarui',
      data: updateResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function destroy(req, res, next) {
  try {
    const { id } = req.params;

    const checkGedung = await db.query('SELECT id FROM gedungs WHERE id = $1', [id]);
    if (checkGedung.rows.length === 0) {
      throw new HttpError(404, 'Gedung tidak ditemukan');
    }

    const countResult = await db.query('SELECT COUNT(*)::int as count FROM ruangans WHERE gedung_id = $1', [id]);
    if (countResult.rows[0].count > 0) {
      return res.status(422).json({
        message: 'Gedung tidak dapat dihapus karena masih memiliki ruangan terkait.',
      });
    }

    await db.query('DELETE FROM gedungs WHERE id = $1', [id]);

    return res.status(200).json({
      message: 'Gedung berhasil dihapus',
    });
  } catch (err) {
    next(err);
  }
}
