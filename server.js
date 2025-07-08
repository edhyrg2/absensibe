const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const db = require('./db');
const userRoutes = require('./routes/userRoutes');
const karyawanRoutes = require('./routes/karyawanRoutes');
const absensiRoutes = require('./routes/absensiRoutes');
const pengaturanWaktuRoutes = require('./routes/waktuRoutes');
const statusPintuRoutes = require('./routes/statusPintuRoutes');
const statusPintuPublicRoutes = require('./routes/statusPintuPublicRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind ke semua interface

// CORS configuration untuk akses dari IP lain
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/user', userRoutes);
app.use('/api/karyawan', karyawanRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/pengaturan-waktu', pengaturanWaktuRoutes);
app.use('/api/status-pintu', statusPintuRoutes);
app.use('/api/public/door', statusPintuPublicRoutes);

// Fungsi untuk mendapatkan IP address lokal
const getLocalIP = () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal (i.e. 127.0.0.1) dan non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results;
};

app.listen(PORT, HOST, () => {
    const localIPs = getLocalIP();

    console.log('🚀 Server berhasil dijalankan!');
    console.log('📡 Akses URL:');
    console.log(`   - Localhost: http://localhost:${PORT}`);
    console.log(`   - 127.0.0.1: http://127.0.0.1:${PORT}`);

    if (localIPs.length > 0) {
        localIPs.forEach(ip => {
            console.log(`   - Network IP: http://${ip}:${PORT}`);
        });
    }

    console.log('');
    console.log('🌐 Public Door API (No Auth Required):');
    console.log(`   - Health Check: http://localhost:${PORT}/api/public/door/health`);
    console.log(`   - Door Status:  http://localhost:${PORT}/api/public/door/status`);

    if (localIPs.length > 0) {
        console.log(`   - Network Access: http://${localIPs[0]}:${PORT}/api/public/door/status`);
    }
});
