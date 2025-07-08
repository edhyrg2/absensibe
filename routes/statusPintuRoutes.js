const express = require('express');
const router = express.Router();
const statusPintuController = require('../controllers/statusPintuController');
const verifyToken = require('../middlewares/auth');

// Middleware verifikasi token
router.use(verifyToken);

// Endpoint CRUD status pintu
router.get('/', statusPintuController.getAllStatusPintu);
router.get('/terkini', statusPintuController.getStatusPintuTerkini);
router.get('/pintu/:nama_pintu', statusPintuController.getStatusByNamaPintu);
router.get('/history', statusPintuController.getHistoryStatusPintu);
router.post('/update', statusPintuController.updateStatusPintu);
router.post('/otomatis-buka', statusPintuController.otomatisBukaPintu);
router.delete('/:id', statusPintuController.deleteStatusPintu);

module.exports = router;
