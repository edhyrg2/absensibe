# URL API - Sistem Absensi
Base URL: http://localhost:3001

## 🔐 AUTHENTICATED ENDPOINTS (Require JWT Token)

### User Management
- POST   /api/user/login
- POST   /api/user
- GET    /api/user/verify-token
- GET    /api/user
- PUT    /api/user/:id
- DELETE /api/user/:id

### Karyawan (Employee)
- GET    /api/karyawan
- POST   /api/karyawan
- PUT    /api/karyawan/:id
- DELETE /api/karyawan/:id

### Absensi (Attendance)
- POST   /api/absensi/add
- POST   /api/absensi
- GET    /api/absensi/rekap
- PUT    /api/absensi/:id

### Time Settings
- GET    /api/pengaturan-waktu
- GET    /api/pengaturan-waktu/now
- POST   /api/pengaturan-waktu
- PUT    /api/pengaturan-waktu/:id
- DELETE /api/pengaturan-waktu/:id

### Door Status (Authenticated)
- GET    /api/status-pintu
- GET    /api/status-pintu/terkini
- GET    /api/status-pintu/pintu/:nama_pintu
- GET    /api/status-pintu/history
- POST   /api/status-pintu/update
- POST   /api/status-pintu/otomatis-buka
- DELETE /api/status-pintu/:id

## 🌐 PUBLIC ENDPOINTS (No Authentication Required)

### Door Status (Public)
- GET    /api/public/door/health
- GET    /api/public/door/status
- GET    /api/public/door/status/latest
- GET    /api/public/door/status/:nama_pintu
- GET    /api/public/door/history
- POST   /api/public/door/update (requires API key)

### Static Files
- GET    /uploads/*

## 🔑 QUICK ACCESS URLS

### Health Check
http://localhost:3001/api/public/door/health

### Door Status (Public)
http://localhost:3001/api/public/door/status
http://localhost:3001/api/public/door/status/latest
http://localhost:3001/api/public/door/status/Pintu%20Utama
http://localhost:3001/api/public/door/history

### Login
http://localhost:3001/api/user/login

### Employee Photos
http://localhost:3001/uploads/karyawan/
http://localhost:3001/uploads/absensi/

## 📋 COMMON QUERY PARAMETERS

### Absensi Report
/api/absensi/rekap?start_date=2025-01-01&end_date=2025-01-31&id_karyawan=1

### Door History (Public)
/api/public/door/history?nama_pintu=Pintu%20Utama&limit=10

### Door History (Authenticated)
/api/status-pintu/history?nama_pintu=Pintu%20Utama&limit=20

## 🔧 HEADERS

### For Authenticated Endpoints:
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

### For File Upload:
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data

### For Public Endpoints:
Content-Type: application/json (for POST requests)
