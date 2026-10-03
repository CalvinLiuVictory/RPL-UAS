import db from '../db.js';

export async function stats(req, res, next) {
  try {
    const user = req.user;

    if (user.role === 'admin') {
      const [complaintsRes, devicesRes, usersRes, buildingsRes] = await Promise.all([
        db.query(`
          SELECT
            COUNT(*)::int AS total_complaints,
            COUNT(*) FILTER (WHERE status = 'Menunggu')::int AS open_complaints,
            COUNT(*) FILTER (WHERE status = 'Diproses')::int AS in_progress,
            COUNT(*) FILTER (WHERE status = 'Selesai')::int AS resolved_complaints
          FROM pengaduans
        `),
        db.query(`
          SELECT
            COUNT(*)::int AS total_devices,
            COUNT(*) FILTER (WHERE status = 'Rusak')::int AS damaged_devices,
            COUNT(*) FILTER (WHERE status = 'Bagus')::int AS good_devices
          FROM perangkats
        `),
        db.query('SELECT COUNT(*)::int AS total_users FROM users'),
        db.query('SELECT COUNT(*)::int AS total_buildings FROM gedungs'),
      ]);

      const c = complaintsRes.rows[0];
      const d = devicesRes.rows[0];

      return res.status(200).json({
        role: 'admin',
        stats: {
          open_complaints: c.open_complaints,
          in_progress: c.in_progress,
          resolved_complaints: c.resolved_complaints,
          total_complaints: c.total_complaints,
          total_devices: d.total_devices,
          damaged_devices: d.damaged_devices,
          good_devices: d.good_devices,
          total_users: usersRes.rows[0].total_users,
          total_buildings: buildingsRes.rows[0].total_buildings,
        },
      });
    }

    if (user.role === 'teknisi') {
      const result = await db.query(
        `SELECT
           COUNT(*)::int AS assigned_tasks,
           COUNT(*) FILTER (WHERE status = 'Diproses')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'Selesai')::int AS completed
         FROM pengaduans
         WHERE teknisi_id = $1`,
        [user.id]
      );

      const s = result.rows[0];

      return res.status(200).json({
        role: 'teknisi',
        stats: {
          assigned_tasks: s.assigned_tasks,
          in_progress: s.in_progress,
          completed: s.completed,
        },
      });
    }

    // Role: user
    const result = await db.query(
      `SELECT
         COUNT(*)::int AS my_complaints,
         COUNT(*) FILTER (WHERE status = 'Menunggu')::int AS open_requests,
         COUNT(*) FILTER (WHERE status = 'Diproses')::int AS in_progress,
         COUNT(*) FILTER (WHERE status = 'Selesai')::int AS resolved
       FROM pengaduans
       WHERE user_id = $1`,
      [user.id]
    );

    const s = result.rows[0];

    return res.status(200).json({
      role: 'user',
      stats: {
        my_complaints: s.my_complaints,
        open_requests: s.open_requests,
        in_progress: s.in_progress,
        resolved: s.resolved,
      },
    });
  } catch (err) {
    next(err);
  }
}
