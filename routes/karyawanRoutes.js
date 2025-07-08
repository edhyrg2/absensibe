const express = require('express');
const router = express.Router();
const karyawanController = require('../controllers/KaryawanController');
const verifyToken = require('../middlewares/auth');
router.use(verifyToken);
// GET semua karyawan
router.get('/', karyawanController.getAllKaryawan);

// POST tambah karyawan baru (upload foto)
router.post('/', karyawanController.createKaryawan);

// PUT update karyawan by id
router.put('/:id', karyawanController.updateKaryawan);

// DELETE karyawan by id
router.delete('/:id', karyawanController.deleteKaryawan);

module.exports = router;
