const express = require('express');
const router = express.Router();
const pengaturanWaktuController = require('../controllers/waktuController');
const verifyToken = require('../middlewares/auth');

// Middleware verifikasi token
router.use(verifyToken);

// Endpoint CRUD pengaturan_waktu
router.get('/', pengaturanWaktuController.getAllWaktu);
router.get('/now', pengaturanWaktuController.getWaktuSekarang);
router.post('/', pengaturanWaktuController.createWaktu);
router.put('/:id', pengaturanWaktuController.updateWaktu);
router.delete('/:id', pengaturanWaktuController.deleteWaktu);

module.exports = router;
