const express = require('express');
const router = express.Router();
const statusPintuPublicController = require('../controllers/statusPintuPublicController');

// Health check endpoint
router.get('/health', statusPintuPublicController.healthCheck);

// Get status pintu terkini (semua pintu)
router.get('/status', statusPintuPublicController.getAllStatusPintuPublic);

// Get status pintu terkini (yang paling baru diupdate)
router.get('/status/latest', statusPintuPublicController.getStatusPintuPublic);

// Get status berdasarkan nama pintu
router.get('/status/:nama_pintu', statusPintuPublicController.getStatusByNamaPintuPublic);

// Get history status pintu
router.get('/history', statusPintuPublicController.getHistoryStatusPintuPublic);

// Update status pintu (dengan API key)
router.post('/update', statusPintuPublicController.updateStatusPintuPublic);

// Update status pintu saja (simplified - hanya status)
router.post('/status/update', statusPintuPublicController.updateStatusOnlyPublic);

// Trigger buka pintu saat wajah terdeteksi (untuk sistem absensi)
router.post('/trigger/face-detected', statusPintuPublicController.triggerFaceDetected);

// Khusus Pintu Utama - Get status pintu utama saja
router.get('/main-door/status', statusPintuPublicController.getMainDoorStatus);

// Khusus Pintu Utama - Update status pintu utama saja  
router.post('/main-door/update', statusPintuPublicController.updateMainDoorOnly);

module.exports = router;
