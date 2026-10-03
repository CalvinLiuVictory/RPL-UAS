import { z } from 'zod';
import db from '../db.js';
import { HttpError, validationError } from '../utils/errors.js';

const storeRuanganSchema = z.object({
  gedung_id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  nama_ruangan: z.string({ required_error: 'The nama ruangan field is required.' })
    .min(1, 'The nama ruangan field is required.'),
});

const updateRuanganSchema = z.object({
  gedung_id: z.union([z.number(), z.string()]).transform(val => Number(val)).optional(),
  nama_ruangan: z.string().min(1, 'The nama ruangan field is required.').optional(),
});

export async function index(req, res, next) {
  try {
    const result = await db.query(`
      SELECT r.id, r.gedung_id, r.nama_ruangan, r.created_at, r.updated_at,
             CASE
               WHEN g.id IS NOT NULL THEN
                 json_build_object(
                   'id', g.id,
                   'kode_gedung', g.kode_gedung,
                   'nama_gedung', g.nama_gedung,
                   'keterangan', g.keterangan,
                   'created_at', g.created_at,
                   'updated_at', g.updated_at
                 )
               ELSE NULL
             END AS gedung
      FROM ruangans r
      LEFT JOIN gedungs g ON g.id = r.gedung_id
      ORDER BY r.id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function store(req, res, next) {
  try {
    const validated = storeRuanganSchema.parse(req.body);

    const gedungCheck = await db.query('SELECT * FROM gedungs WHERE id = $1', [validated.gedung_id]);
    if (gedungCheck.rows.length === 0) {
      throw validationError({ gedung_id: ['The selected gedung id is invalid.'] });
    }

    const insertResult = await db.query(
      `INSERT INTO ruangans (gedung_id, nama_ruangan, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, gedung_id, nama_ruangan, created_at, updated_at`,
      [validated.gedung_id, validated.nama_ruangan]
    );

    const ruangan = insertResult.rows[0];
    ruangan.gedung = gedungCheck.rows[0];

    return res.status(201).json({
      message: 'Ruangan berhasil ditambahkan',
      data: ruangan,
    });
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT r.id, r.gedung_id, r.nama_ruangan, r.created_at, r.updated_at,
             CASE
               WHEN g.id IS NOT NULL THEN
                 json_build_object(
                   'id', g.id,
                   'kode_gedung', g.kode_gedung,
                   'nama_gedung', g.nama_gedung,
                   'keterangan', g.keterangan,
                   'created_at', g.created_at,
                   'updated_at', g.updated_at
                 )
               ELSE NULL
             END AS gedung
      FROM ruangans r
      LEFT JOIN gedungs g ON g.id = r.gedung_id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new HttpError(404, 'Ruangan tidak ditemukan');
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;

    const checkRuangan = await db.query('SELECT * FROM ruangans WHERE id = $1', [id]);
    if (checkRuangan.rows.length === 0) {
      throw new HttpError(404, 'Ruangan tidak ditemukan');
    }

    const validated = updateRuanganSchema.parse(req.body);

    if (validated.gedung_id) {
      const checkGedung = await db.query('SELECT id FROM gedungs WHERE id = $1', [validated.gedung_id]);
      if (checkGedung.rows.length === 0) {
        throw validationError({ gedung_id: ['The selected gedung id is invalid.'] });
      }
    }

    const current = checkRuangan.rows[0];
    const gedung_id = validated.gedung_id ?? current.gedung_id;
    const nama_ruangan = validated.nama_ruangan ?? current.nama_ruangan;

    const updateResult = await db.query(
      `UPDATE ruangans
       SET gedung_id = $1, nama_ruangan = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, gedung_id, nama_ruangan, created_at, updated_at`,
      [gedung_id, nama_ruangan, id]
    );

    const gedungResult = await db.query('SELECT * FROM gedungs WHERE id = $1', [gedung_id]);
    const updatedRuangan = updateResult.rows[0];
    updatedRuangan.gedung = gedungResult.rows[0] || null;

    return res.status(200).json({
      message: 'Ruangan berhasil diperbarui',
      data: updatedRuangan,
    });
  } catch (err) {
    next(err);
  }
}

export async function destroy(req, res, next) {
  try {
    const { id } = req.params;

    const checkRuangan = await db.query('SELECT id FROM ruangans WHERE id = $1', [id]);
    if (checkRuangan.rows.length === 0) {
      throw new HttpError(404, 'Ruangan tidak ditemukan');
    }

    // Protection rule: reject 422 if ruangan still has devices
    const deviceCountResult = await db.query(
      'SELECT COUNT(*)::int as count FROM perangkats WHERE ruangan_id = $1',
      [id]
    );

    if (deviceCountResult.rows[0].count > 0) {
      return res.status(422).json({
        message: 'Ruangan tidak dapat dihapus karena masih memiliki perangkat terkait.',
      });
    }

    await db.query('DELETE FROM ruangans WHERE id = $1', [id]);

    return res.status(200).json({
      message: 'Ruangan berhasil dihapus',
    });
  } catch (err) {
    next(err);
  }
}
