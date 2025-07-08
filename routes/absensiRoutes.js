const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiController');
const verifyToken = require('../middlewares/auth');
router.use(verifyToken);
router.post('/add', absensiController.absenMasuk);
router.post('/', absensiController.createAbsen);
router.get('/rekap', absensiController.getRekapAbsensi);
router.put('/:id', absensiController.updateAbsen);

module.exports = router;
