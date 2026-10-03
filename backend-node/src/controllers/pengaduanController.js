import { z } from 'zod';
import db from '../db.js';
import { HttpError, validationError } from '../utils/errors.js';

const storePengaduanSchema = z.object({
  perangkat_id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  deskripsi: z.string({ required_error: 'The deskripsi field is required.' })
    .min(1, 'The deskripsi field is required.'),
});

const assignTeknisiSchema = z.object({
  teknisi_id: z.union([z.number(), z.string()]).transform(val => Number(val)),
});

const catatanSchema = z.object({
  catatan_teknisi: z.string({ required_error: 'The catatan teknisi field is required.' })
    .min(1, 'The catatan teknisi field is required.'),
});

const updateStatusSchema = z.object({
  status: z.enum(['Menunggu', 'Diproses', 'Selesai'], {
    errorMap: () => ({ message: 'The selected status is invalid.' }),
  }),
  catatan_teknisi: z.string().nullable().optional(),
});

function getFullPengaduanQuery(whereClause = '', orderBy = 'p.id DESC') {
  return `
    SELECT p.id, p.user_id, p.perangkat_id, p.deskripsi, p.status, p.teknisi_id, p.catatan_teknisi,
           p.created_at, p.updated_at,
           CASE
             WHEN u.id IS NOT NULL THEN
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email,
                 'email_verified_at', u.email_verified_at,
                 'role', u.role,
                 'created_at', u.created_at,
                 'updated_at', u.updated_at
               )
             ELSE NULL
           END AS user,
           CASE
             WHEN dev.id IS NOT NULL THEN
               json_build_object(
                 'id', dev.id,
                 'ruangan_id', dev.ruangan_id,
                 'kode_aset', dev.kode_aset,
                 'nama_perangkat', dev.nama_perangkat,
                 'status', dev.status,
                 'created_at', dev.created_at,
                 'updated_at', dev.updated_at,
                 'ruangan', CASE
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
                            END
               )
             ELSE NULL
           END AS perangkat,
           CASE
             WHEN tek.id IS NOT NULL THEN
               json_build_object(
                 'id', tek.id,
                 'name', tek.name,
                 'email', tek.email,
                 'email_verified_at', tek.email_verified_at,
                 'role', tek.role,
                 'created_at', tek.created_at,
                 'updated_at', tek.updated_at
               )
             ELSE NULL
           END AS teknisi
    FROM pengaduans p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN perangkats dev ON dev.id = p.perangkat_id
    LEFT JOIN ruangans r ON r.id = dev.ruangan_id
    LEFT JOIN gedungs g ON g.id = r.gedung_id
    LEFT JOIN users tek ON tek.id = p.teknisi_id
    ${whereClause}
    ORDER BY ${orderBy}
  `;
}

export async function lihatPengaduan(req, res, next) {
  try {
    const user = req.user;
    let whereClause = '';
    const params = [];

    if (user.role === 'user') {
      whereClause = 'WHERE p.user_id = $1';
      params.push(user.id);
    } else if (user.role === 'teknisi') {
      whereClause = 'WHERE p.teknisi_id = $1';
      params.push(user.id);
    }

    const queryStr = getFullPengaduanQuery(whereClause, 'p.id DESC');
    const result = await db.query(queryStr, params);

    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    let whereClause = 'WHERE p.id = $1';
    const params = [id];

    if (user.role === 'user') {
      whereClause += ' AND p.user_id = $2';
      params.push(user.id);
    } else if (user.role === 'teknisi') {
      whereClause += ' AND p.teknisi_id = $2';
      params.push(user.id);
    }

    const queryStr = getFullPengaduanQuery(whereClause);
    const result = await db.query(queryStr, params);

    if (result.rows.length === 0) {
      throw new HttpError(404, 'Pengaduan tidak ditemukan');
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function store(req, res, next) {
  const client = await db.getClient();
  try {
    const validated = storePengaduanSchema.parse(req.body);

    const devCheck = await client.query('SELECT id, status FROM perangkats WHERE id = $1', [validated.perangkat_id]);
    if (devCheck.rows.length === 0) {
      throw validationError({ perangkat_id: ['The selected perangkat id is invalid.'] });
    }

    // Application-level check
    const activeCheck = await client.query(
      `SELECT id FROM pengaduans
       WHERE user_id = $1 AND perangkat_id = $2 AND status IN ('Menunggu', 'Diproses')`,
      [req.user.id, validated.perangkat_id]
    );

    if (activeCheck.rows.length > 0) {
      throw new HttpError(
        422,
        'Anda sudah memiliki pengaduan aktif untuk perangkat ini yang sedang menunggu atau diproses.'
      );
    }

    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO pengaduans (user_id, perangkat_id, deskripsi, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'Menunggu', NOW(), NOW())
       RETURNING id, user_id, perangkat_id, deskripsi, status, teknisi_id, catatan_teknisi, created_at, updated_at`,
      [req.user.id, validated.perangkat_id, validated.deskripsi]
    );

    // Otomatis ubah status perangkat menjadi 'Rusak'
    await client.query('UPDATE perangkats SET status = $1, updated_at = NOW() WHERE id = $2', [
      'Rusak',
      validated.perangkat_id,
    ]);

    await client.query('COMMIT');

    const pengaduan = insertResult.rows[0];

    const devRes = await db.query('SELECT * FROM perangkats WHERE id = $1', [validated.perangkat_id]);
    pengaduan.perangkat = devRes.rows[0] || null;

    return res.status(201).json({
      message: 'Pengaduan berhasil dibuat',
      data: pengaduan,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // Catch database unique constraint violation (code 23505) from partial unique index
    if (err.code === '23505') {
      return res.status(422).json({
        message: 'Anda sudah memiliki pengaduan aktif untuk perangkat ini yang sedang menunggu atau diproses.',
      });
    }
    next(err);
  } finally {
    client.release();
  }
}

export async function assignTeknisi(req, res, next) {
  try {
    const { id } = req.params;
    const validated = assignTeknisiSchema.parse(req.body);

    const checkTech = await db.query('SELECT id, role FROM users WHERE id = $1 AND role = $2', [
      validated.teknisi_id,
      'teknisi',
    ]);

    if (checkTech.rows.length === 0) {
      throw validationError({ teknisi_id: ['The selected teknisi id is invalid.'] });
    }

    const checkComplaint = await db.query('SELECT * FROM pengaduans WHERE id = $1', [id]);
    if (checkComplaint.rows.length === 0) {
      throw new HttpError(404, 'Pengaduan tidak ditemukan');
    }

    await db.query(
      `UPDATE pengaduans
       SET teknisi_id = $1, status = 'Diproses', updated_at = NOW()
       WHERE id = $2`,
      [validated.teknisi_id, id]
    );

    const fullResult = await db.query(getFullPengaduanQuery('WHERE p.id = $1'), [id]);

    return res.status(200).json({
      message: 'Teknisi berhasil ditugaskan',
      data: fullResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function pemeriksaan(req, res, next) {
  try {
    const { id } = req.params;
    const validated = catatanSchema.parse(req.body);
    const user = req.user;

    let checkQuery = 'SELECT * FROM pengaduans WHERE id = $1';
    const params = [id];

    if (user.role !== 'admin') {
      checkQuery += ' AND teknisi_id = $2';
      params.push(user.id);
    }

    const checkRes = await db.query(checkQuery, params);
    if (checkRes.rows.length === 0) {
      throw new HttpError(404, 'Pengaduan tidak ditemukan');
    }

    const newNotes = `[Pemeriksaan]: ${validated.catatan_teknisi}`;

    const updateRes = await db.query(
      `UPDATE pengaduans
       SET catatan_teknisi = $1, status = 'Diproses', updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newNotes, id]
    );

    return res.status(200).json({
      message: 'Catatan pemeriksaan berhasil disimpan',
      data: updateRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function catatPerbaikan(req, res, next) {
  try {
    const { id } = req.params;
    const validated = catatanSchema.parse(req.body);
    const user = req.user;

    let checkQuery = 'SELECT * FROM pengaduans WHERE id = $1';
    const params = [id];

    if (user.role !== 'admin') {
      checkQuery += ' AND teknisi_id = $2';
      params.push(user.id);
    }

    const checkRes = await db.query(checkQuery, params);
    if (checkRes.rows.length === 0) {
      throw new HttpError(404, 'Pengaduan tidak ditemukan');
    }

    const currentNotes = checkRes.rows[0].catatan_teknisi || '';
    const newNotes = currentNotes.length > 0
      ? `${currentNotes}\n[Perbaikan]: ${validated.catatan_teknisi}`
      : `[Perbaikan]: ${validated.catatan_teknisi}`;

    const updateRes = await db.query(
      `UPDATE pengaduans
       SET catatan_teknisi = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newNotes, id]
    );

    return res.status(200).json({
      message: 'Catatan perbaikan berhasil ditambahkan',
      data: updateRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const validated = updateStatusSchema.parse(req.body);
    const user = req.user;

    let checkQuery = 'SELECT * FROM pengaduans WHERE id = $1';
    const params = [id];

    if (user.role !== 'admin') {
      checkQuery += ' AND teknisi_id = $2';
      params.push(user.id);
    }

    const checkRes = await client.query(checkQuery, params);
    if (checkRes.rows.length === 0) {
      throw new HttpError(404, 'Pengaduan tidak ditemukan');
    }

    const currentComplaint = checkRes.rows[0];
    const currentStatus = currentComplaint.status;
    const newStatus = validated.status;

    // Guardrail 1: Status Selesai tidak boleh dibuka kembali kecuali oleh Admin
    if (currentStatus === 'Selesai' && newStatus !== 'Selesai' && user.role !== 'admin') {
      return res.status(422).json({
        message: 'Komplain yang sudah selesai tidak dapat diubah kembali kecuali oleh Admin.',
      });
    }

    // Guardrail 2: Larang loncat status dari Menunggu langsung ke Selesai
    if (currentStatus === 'Menunggu' && newStatus === 'Selesai') {
      return res.status(422).json({
        message: 'Pengaduan tidak dapat langsung diselesaikan dari status Menunggu.',
      });
    }

    await client.query('BEGIN');

    let updateQuery = 'UPDATE pengaduans SET status = $1, updated_at = NOW()';
    const updateParams = [newStatus];

    if (validated.catatan_teknisi !== undefined && validated.catatan_teknisi !== null) {
      updateQuery = 'UPDATE pengaduans SET status = $1, catatan_teknisi = $2, updated_at = NOW()';
      updateParams.push(validated.catatan_teknisi);
      updateQuery += ` WHERE id = $3`;
      updateParams.push(id);
    } else {
      updateQuery += ` WHERE id = $2`;
      updateParams.push(id);
    }

    await client.query(updateQuery, updateParams);

    // Status perangkat update:
    // Saat Selesai, perangkat kembali Bagus HANYA jika:
    // 1. Tidak ada komplain aktif lain pada perangkat itu
    // 2. Tidak ada jadwal maintenance aktif (status 'Terjadwal') pada perangkat itu
    if (newStatus === 'Selesai') {
      const otherActiveComplaints = await client.query(
        `SELECT id FROM pengaduans
         WHERE perangkat_id = $1 AND id != $2 AND status IN ('Menunggu', 'Diproses')`,
        [currentComplaint.perangkat_id, id]
      );

      const activeMaintenances = await client.query(
        `SELECT id FROM maintenances
         WHERE perangkat_id = $1 AND status = 'Terjadwal'`,
        [currentComplaint.perangkat_id]
      );

      if (otherActiveComplaints.rows.length === 0 && activeMaintenances.rows.length === 0) {
        await client.query('UPDATE perangkats SET status = $1, updated_at = NOW() WHERE id = $2', [
          'Bagus',
          currentComplaint.perangkat_id,
        ]);
      }
    } else if (newStatus === 'Diproses') {
      await client.query('UPDATE perangkats SET status = $1, updated_at = NOW() WHERE id = $2', [
        'Rusak',
        currentComplaint.perangkat_id,
      ]);
    }

    await client.query('COMMIT');

    const freshResult = await db.query(getFullPengaduanQuery('WHERE p.id = $1'), [id]);

    return res.status(200).json({
      message: 'Status pengaduan berhasil diperbarui',
      data: freshResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
