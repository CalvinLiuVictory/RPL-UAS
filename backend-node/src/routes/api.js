import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as gedungController from '../controllers/gedungController.js';
import * as ruanganController from '../controllers/ruanganController.js';
import * as perangkatController from '../controllers/perangkatController.js';
import * as pengaduanController from '../controllers/pengaduanController.js';
import * as maintenanceController from '../controllers/maintenanceController.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

// Middleware shortcuts
const auth = [authMiddleware];
const adminOnly = [authMiddleware, roleMiddleware('admin')];
const userOnly = [authMiddleware, roleMiddleware('user')];
const fieldWorkers = [authMiddleware, roleMiddleware('teknisi', 'admin')];

// ==========================================
// RUTE HEALTH CHECK & PUBLIK
// ==========================================
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/login', loginRateLimiter, authController.login);

// ==========================================
// RUTE TERPROTEKSI (Wajib Login)
// ==========================================
// Auth & Dashboard
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.me);

router.get('/dashboard', auth, (req, res) => {
  res.status(200).json({
    message: 'Selamat datang di Dashboard, ' + req.user.name,
    user: req.user,
  });
});

router.get('/dashboard/stats', auth, dashboardController.stats);

// Akses baca perangkat & ruangan untuk seluruh user terautentikasi (dropdown komplain)
router.get('/perangkats', auth, perangkatController.index);
router.get('/perangkats/:id', auth, perangkatController.show);
router.get('/ruangans', auth, ruanganController.index);
router.get('/gedungs', auth, gedungController.index);

// ==========================================
// KHUSUS ADMIN
// ==========================================
// Users CRUD
router.get('/users', adminOnly, userController.index);
router.post('/users', adminOnly, userController.store);
router.get('/users/:id', adminOnly, userController.show);
router.put('/users/:id', adminOnly, userController.update);
router.patch('/users/:id', adminOnly, userController.update);
router.delete('/users/:id', adminOnly, userController.destroy);

// Gedungs CRUD
router.post('/gedungs', adminOnly, gedungController.store);
router.get('/gedungs/:id', adminOnly, gedungController.show);
router.put('/gedungs/:id', adminOnly, gedungController.update);
router.patch('/gedungs/:id', adminOnly, gedungController.update);
router.delete('/gedungs/:id', adminOnly, gedungController.destroy);

// Ruangans CRUD
router.post('/ruangans', adminOnly, ruanganController.store);
router.get('/ruangans/:id', adminOnly, ruanganController.show);
router.put('/ruangans/:id', adminOnly, ruanganController.update);
router.patch('/ruangans/:id', adminOnly, ruanganController.update);
router.delete('/ruangans/:id', adminOnly, ruanganController.destroy);

// Perangkats CRUD
router.post('/perangkats', adminOnly, perangkatController.store);
router.put('/perangkats/:id', adminOnly, perangkatController.update);
router.patch('/perangkats/:id', adminOnly, perangkatController.update);
router.delete('/perangkats/:id', adminOnly, perangkatController.destroy);

// Fitur Pengaduan & Maintenance (Akses Admin)
router.put('/pengaduan/:id/assign', adminOnly, pengaduanController.assignTeknisi);
router.post('/maintenance', adminOnly, maintenanceController.store);

// ==========================================
// KHUSUS USER / PELAPOR
// ==========================================
router.post('/pengaduan', userOnly, pengaduanController.store);

// ==========================================
// KHUSUS TEKNISI & ADMIN (Pekerjaan Lapangan)
// ==========================================
router.put('/pengaduan/:id/periksa', fieldWorkers, pengaduanController.pemeriksaan);
router.put('/pengaduan/:id/perbaiki', fieldWorkers, pengaduanController.catatPerbaikan);
router.put('/pengaduan/:id/status', fieldWorkers, pengaduanController.updateStatus);
router.put('/maintenance/:id/catat', fieldWorkers, maintenanceController.catatMaintenance);

// ==========================================
// RUTE GABUNGAN (Filter Akses/Data di Controller)
// ==========================================
router.get('/pengaduan', auth, pengaduanController.lihatPengaduan);
router.get('/pengaduan/:id', auth, pengaduanController.show);
router.get('/maintenance', fieldWorkers, maintenanceController.lihatMaintenance);
router.get('/maintenance/:id', fieldWorkers, maintenanceController.show);

export default router;
