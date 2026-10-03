import { z } from 'zod';
import db from '../db.js';
import { HttpError, validationError } from '../utils/errors.js';

const storePerangkatSchema = z.object({
  ruangan_id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  kode_aset: z.string({ required_error: 'The kode aset field is required.' })
    .min(1, 'The kode aset field is required.'),
  nama_perangkat: z.string({ required_error: 'The nama perangkat field is required.' })
    .min(1, 'The nama perangkat field is required.'),
  status: z.enum(['Bagus', 'Rusak', 'Maintenance']).default('Bagus').optional(),
});

const updatePerangkatSchema = z.object({
  ruangan_id: z.union([z.number(), z.string()]).transform(val => Number(val)).optional(),
  kode_aset: z.string().min(1, 'The kode aset field is required.').optional(),
  nama_perangkat: z.string().min(1, 'The nama perangkat field is required.').optional(),
  status: z.enum(['Bagus', 'Rusak', 'Maintenance']).optional(),
});

export async function index(req, res, next) {
  try {
    const result = await db.query(`
      SELECT p.id, p.ruangan_id, p.kode_aset, p.nama_perangkat, p.status, p.created_at, p.updated_at,
             CASE
               WHEN r.id IS NOT NULL THEN
                 json_build_object(
                   'id', r.id,
                   'gedung_id', r.gedung_id,
                   'nama_ruangan', r.nama_ruangan,
                   'created_at', r.created_at,
                   'updated_at', r.updated_at,
                   'gedung', CASE
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
                             END
                 )
               ELSE NULL
             END AS ruangan
      FROM perangkats p
      LEFT JOIN ruangans r ON r.id = p.ruangan_id
      LEFT JOIN gedungs g ON g.id = r.gedung_id
      ORDER BY p.id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function store(req, res, next) {
  try {
    const validated = storePerangkatSchema.parse(req.body);

    const checkRuangan = await db.query('SELECT id FROM ruangans WHERE id = $1', [validated.ruangan_id]);
    if (checkRuangan.rows.length === 0) {
      throw validationError({ ruangan_id: ['The selected ruangan id is invalid.'] });
    }

    const checkKode = await db.query('SELECT id FROM perangkats WHERE kode_aset = $1', [validated.kode_aset]);
    if (checkKode.rows.length > 0) {
      throw validationError({ kode_aset: ['The kode aset has already been taken.'] });
    }

    const insertResult = await db.query(
      `INSERT INTO perangkats (ruangan_id, kode_aset, nama_perangkat, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, ruangan_id, kode_aset, nama_perangkat, status, created_at, updated_at`,
      [validated.ruangan_id, validated.kode_aset, validated.nama_perangkat, validated.status || 'Bagus']
    );

    const perangkatId = insertResult.rows[0].id;
    const fullResult = await db.query(`
      SELECT p.id, p.ruangan_id, p.kode_aset, p.nama_perangkat, p.status, p.created_at, p.updated_at,
             json_build_object(
               'id', r.id,
               'gedung_id', r.gedung_id,
               'nama_ruangan', r.nama_ruangan,
               'created_at', r.created_at,
               'updated_at', r.updated_at,
               'gedung', json_build_object(
                 'id', g.id,
                 'kode_gedung', g.kode_gedung,
                 'nama_gedung', g.nama_gedung,
                 'keterangan', g.keterangan,
                 'created_at', g.created_at,
                 'updated_at', g.updated_at
               )
             ) AS ruangan
      FROM perangkats p
      LEFT JOIN ruangans r ON r.id = p.ruangan_id
      LEFT JOIN gedungs g ON g.id = r.gedung_id
      WHERE p.id = $1
    `, [perangkatId]);

    return res.status(201).json({
      message: 'Perangkat berhasil ditambahkan',
      data: fullResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT p.id, p.ruangan_id, p.kode_aset, p.nama_perangkat, p.status, p.created_at, p.updated_at,
             CASE
               WHEN r.id IS NOT NULL THEN
                 json_build_object(
                   'id', r.id,
                   'gedung_id', r.gedung_id,
                   'nama_ruangan', r.nama_ruangan,
                   'created_at', r.created_at,
                   'updated_at', r.updated_at,
                   'gedung', CASE
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
                             END
                 )
               ELSE NULL
             END AS ruangan
      FROM perangkats p
      LEFT JOIN ruangans r ON r.id = p.ruangan_id
      LEFT JOIN gedungs g ON g.id = r.gedung_id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new HttpError(404, 'Perangkat tidak ditemukan');
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;

    const checkPerangkat = await db.query('SELECT * FROM perangkats WHERE id = $1', [id]);
    if (checkPerangkat.rows.length === 0) {
      throw new HttpError(404, 'Perangkat tidak ditemukan');
    }

    const validated = updatePerangkatSchema.parse(req.body);

    if (validated.ruangan_id) {
      const checkRuangan = await db.query('SELECT id FROM ruangans WHERE id = $1', [validated.ruangan_id]);
      if (checkRuangan.rows.length === 0) {
        throw validationError({ ruangan_id: ['The selected ruangan id is invalid.'] });
      }
    }

    if (validated.kode_aset) {
      const checkKode = await db.query(
        'SELECT id FROM perangkats WHERE kode_aset = $1 AND id != $2',
        [validated.kode_aset, id]
      );
      if (checkKode.rows.length > 0) {
        throw validationError({ kode_aset: ['The kode aset has already been taken.'] });
      }
    }

    const current = checkPerangkat.rows[0];
    const ruangan_id = validated.ruangan_id ?? current.ruangan_id;
    const kode_aset = validated.kode_aset ?? current.kode_aset;
    const nama_perangkat = validated.nama_perangkat ?? current.nama_perangkat;
    const status = validated.status ?? current.status;

    await db.query(
      `UPDATE perangkats
       SET ruangan_id = $1, kode_aset = $2, nama_perangkat = $3, status = $4, updated_at = NOW()
       WHERE id = $5`,
      [ruangan_id, kode_aset, nama_perangkat, status, id]
    );

    const fullResult = await db.query(`
      SELECT p.id, p.ruangan_id, p.kode_aset, p.nama_perangkat, p.status, p.created_at, p.updated_at,
             json_build_object(
               'id', r.id,
               'gedung_id', r.gedung_id,
               'nama_ruangan', r.nama_ruangan,
               'created_at', r.created_at,
               'updated_at', r.updated_at,
               'gedung', json_build_object(
                 'id', g.id,
                 'kode_gedung', g.kode_gedung,
                 'nama_gedung', g.nama_gedung,
                 'keterangan', g.keterangan,
                 'created_at', g.created_at,
                 'updated_at', g.updated_at
               )
             ) AS ruangan
      FROM perangkats p
      LEFT JOIN ruangans r ON r.id = p.ruangan_id
      LEFT JOIN gedungs g ON g.id = r.gedung_id
      WHERE p.id = $1
    `, [id]);

    return res.status(200).json({
      message: 'Perangkat berhasil diperbarui',
      data: fullResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function destroy(req, res, next) {
  try {
    const { id } = req.params;

    const checkPerangkat = await db.query('SELECT id FROM perangkats WHERE id = $1', [id]);
    if (checkPerangkat.rows.length === 0) {
      throw new HttpError(404, 'Perangkat tidak ditemukan');
    }

    // Protection rule: reject 422 if perangkat has active or historical pengaduan
    const complaintCountResult = await db.query(
      'SELECT COUNT(*)::int as count FROM pengaduans WHERE perangkat_id = $1',
      [id]
    );

    if (complaintCountResult.rows[0].count > 0) {
      return res.status(422).json({
        message: 'Perangkat tidak dapat dihapus karena masih memiliki riwayat pengaduan terkait.',
      });
    }

    await db.query('DELETE FROM perangkats WHERE id = $1', [id]);

    return res.status(200).json({
      message: 'Perangkat berhasil dihapus',
    });
  } catch (err) {
    next(err);
  }
}
