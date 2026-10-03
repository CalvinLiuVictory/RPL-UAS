import { z } from 'zod';
import db from '../db.js';
import { HttpError, validationError } from '../utils/errors.js';

const storeMaintenanceSchema = z.object({
  perangkat_id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  teknisi_id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  tanggal_jadwal: z.string({ required_error: 'The tanggal jadwal field is required.' })
    .min(1, 'The tanggal jadwal field is required.'),
  deskripsi_pekerjaan: z.string({ required_error: 'The deskripsi pekerjaan field is required.' })
    .min(1, 'The deskripsi pekerjaan field is required.'),
});

const catatMaintenanceSchema = z.object({
  catatan_hasil: z.string({ required_error: 'The catatan hasil field is required.' })
    .min(1, 'The catatan hasil field is required.'),
  status: z.enum(['Terjadwal', 'Selesai'], {
    errorMap: () => ({ message: 'The selected status is invalid.' }),
  }),
});

function getFullMaintenanceQuery(whereClause = '') {
  return `
    SELECT m.id, m.perangkat_id, m.teknisi_id, m.tanggal_jadwal, m.deskripsi_pekerjaan,
           m.status, m.catatan_hasil, m.created_at, m.updated_at,
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
    FROM maintenances m
    LEFT JOIN perangkats dev ON dev.id = m.perangkat_id
    LEFT JOIN ruangans r ON r.id = dev.ruangan_id
    LEFT JOIN gedungs g ON g.id = r.gedung_id
    LEFT JOIN users tek ON tek.id = m.teknisi_id
    ${whereClause}
    ORDER BY m.id DESC
  `;
}

export async function lihatMaintenance(req, res, next) {
  try {
    const user = req.user;
    let whereClause = '';
    const params = [];

    if (user.role === 'teknisi') {
      whereClause = 'WHERE m.teknisi_id = $1';
      params.push(user.id);
    }

    const result = await db.query(getFullMaintenanceQuery(whereClause), params);
    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    let whereClause = 'WHERE m.id = $1';
    const params = [id];

    if (user.role === 'teknisi') {
      whereClause += ' AND m.teknisi_id = $2';
      params.push(user.id);
    }

    const result = await db.query(getFullMaintenanceQuery(whereClause), params);
    if (result.rows.length === 0) {
      throw new HttpError(404, 'Jadwal maintenance tidak ditemukan');
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function store(req, res, next) {
  const client = await db.getClient();
  try {
    const validated = storeMaintenanceSchema.parse(req.body);

    const devCheck = await client.query('SELECT id FROM perangkats WHERE id = $1', [validated.perangkat_id]);
    if (devCheck.rows.length === 0) {
      throw validationError({ perangkat_id: ['The selected perangkat id is invalid.'] });
    }

    const techCheck = await client.query('SELECT id FROM users WHERE id = $1 AND role = $2', [
      validated.teknisi_id,
      'teknisi',
    ]);
    if (techCheck.rows.length === 0) {
      throw validationError({ teknisi_id: ['The selected teknisi id is invalid.'] });
    }

    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO maintenances (perangkat_id, teknisi_id, tanggal_jadwal, deskripsi_pekerjaan, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'Terjadwal', NOW(), NOW())
       RETURNING id, perangkat_id, teknisi_id, tanggal_jadwal, deskripsi_pekerjaan, status, catatan_hasil, created_at, updated_at`,
      [validated.perangkat_id, validated.teknisi_id, validated.tanggal_jadwal, validated.deskripsi_pekerjaan]
    );

    // Ubah status perangkat menjadi 'Maintenance'
    await client.query('UPDATE perangkats SET status = $1, updated_at = NOW() WHERE id = $2', [
      'Maintenance',
      validated.perangkat_id,
    ]);

    await client.query('COMMIT');

    const maintenanceId = insertResult.rows[0].id;
    const fullRes = await db.query(getFullMaintenanceQuery('WHERE m.id = $1'), [maintenanceId]);

    return res.status(201).json({
      message: 'Jadwal maintenance berhasil dibuat',
      data: fullRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function catatMaintenance(req, res, next) {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const validated = catatMaintenanceSchema.parse(req.body);
    const user = req.user;

    let checkQuery = 'SELECT * FROM maintenances WHERE id = $1';
    const params = [id];

    if (user.role !== 'admin') {
      checkQuery += ' AND teknisi_id = $2';
      params.push(user.id);
    }

    const checkRes = await client.query(checkQuery, params);
    if (checkRes.rows.length === 0) {
      throw new HttpError(404, 'Jadwal maintenance tidak ditemukan');
    }

    const currentMaintenance = checkRes.rows[0];

    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE maintenances
       SET catatan_hasil = $1, status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [validated.catatan_hasil, validated.status, id]
    );

    // Jika status sudah Selesai, kembalikan status perangkat ke 'Bagus' jika tidak ada komplain aktif
    if (validated.status === 'Selesai') {
      const activeComplaints = await client.query(
        `SELECT id FROM pengaduans WHERE perangkat_id = $1 AND status IN ('Menunggu', 'Diproses')`,
        [currentMaintenance.perangkat_id]
      );
      if (activeComplaints.rows.length === 0) {
        await client.query('UPDATE perangkats SET status = $1, updated_at = NOW() WHERE id = $2', [
          'Bagus',
          currentMaintenance.perangkat_id,
        ]);
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Hasil maintenance berhasil dicatat',
      data: updateRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
