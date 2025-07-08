# API Documentation - Sistem Absensi

## Base URL
```
http://localhost:3001
```

## Authentication
Sebagian besar endpoint memerlukan autentikasi JWT Token, kecuali endpoint public yang ditandai dengan ⭐.

### Headers untuk Authenticated Endpoints:
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## 📱 User Management APIs

### POST `/api/user/login`
**Login User**
```bash
POST http://localhost:3001/api/user/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

### POST `/api/user`
**Create New User**
```bash
POST http://localhost:3001/api/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password",
  "role": "admin"
}
```

### GET `/api/user/verify-token`
**Verify JWT Token**
```bash
GET http://localhost:3001/api/user/verify-token
Authorization: Bearer <token>
```

### GET `/api/user`
**Get All Users**
```bash
GET http://localhost:3001/api/user
Authorization: Bearer <token>
```

### PUT `/api/user/:id`
**Update User**
```bash
PUT http://localhost:3001/api/user/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "updateduser",
  "password": "newpassword",
  "role": "user"
}
```

### DELETE `/api/user/:id`
**Delete User**
```bash
DELETE http://localhost:3001/api/user/1
Authorization: Bearer <token>
```

---

## 👤 Karyawan (Employee) Management APIs

### GET `/api/karyawan`
**Get All Employees**
```bash
GET http://localhost:3001/api/karyawan
Authorization: Bearer <token>
```

### POST `/api/karyawan`
**Create New Employee (with photo upload)**
```bash
POST http://localhost:3001/api/karyawan
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- nama: "John Doe"
- jabatan: "Manager"
- departemen: "IT"
- foto: <file>
```

### PUT `/api/karyawan/:id`
**Update Employee**
```bash
PUT http://localhost:3001/api/karyawan/1
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- nama: "John Doe Updated"
- jabatan: "Senior Manager"
- departemen: "IT"
- foto: <file> (optional)
```

### DELETE `/api/karyawan/:id`
**Delete Employee**
```bash
DELETE http://localhost:3001/api/karyawan/1
Authorization: Bearer <token>
```

---

## ⏰ Absensi (Attendance) APIs

### POST `/api/absensi/add`
**Clock In/Out (with photo + Auto Door Control)**
```bash
POST http://localhost:3001/api/absensi/add
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- id_karyawan: "1"
- type: "masuk" // or "keluar"
- foto: <file>
```

**Response - First Time Attendance:**
```json
{
  "message": "Absen masuk berhasil dicatat",
  "fotoPath": "uploads/absensi/1-2025-07-06-10-30-00.jpg",
  "door_status": "Pintu dibuka otomatis selama 5 menit"
}
```

**Response - Already Attended (Still Opens Door):**
```json
{
  "error": true,
  "message": "Sudah absen masuk hari ini",
  "door_status": "Pintu dibuka otomatis selama 5 menit untuk akses"
}
```

> **🚪 Auto Door Feature**: 
> - Pintu **SELALU** terbuka selama 5 menit setiap hit endpoint ini
> - Tidak peduli apakah user sudah absen atau belum
> - Memungkinkan akses berulang untuk karyawan yang sudah absen

### POST `/api/absensi`
**Create Attendance Record**
```bash
POST http://localhost:3001/api/absensi
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_karyawan": 1,
  "tanggal": "2025-01-18",
  "jam_masuk": "08:00:00",
  "jam_keluar": "17:00:00",
  "status": "hadir"
}
```

### GET `/api/absensi/rekap`
**Get Attendance Report**
```bash
GET http://localhost:3001/api/absensi/rekap
Authorization: Bearer <token>

Query Parameters:
- start_date: 2025-01-01
- end_date: 2025-01-31
- id_karyawan: 1 (optional)
```

### PUT `/api/absensi/:id`
**Update Attendance Record**
```bash
PUT http://localhost:3001/api/absensi/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "jam_masuk": "08:30:00",
  "jam_keluar": "17:30:00",
  "status": "hadir"
}
```

---

## ⏰ Time Settings APIs

### GET `/api/pengaturan-waktu`
**Get All Time Settings**
```bash
GET http://localhost:3001/api/pengaturan-waktu
Authorization: Bearer <token>
```

### GET `/api/pengaturan-waktu/now`
**Get Current Time Settings**
```bash
GET http://localhost:3001/api/pengaturan-waktu/now
Authorization: Bearer <token>
```

### POST `/api/pengaturan-waktu`
**Create Time Setting**
```bash
POST http://localhost:3001/api/pengaturan-waktu
Authorization: Bearer <token>
Content-Type: application/json

{
  "jam_masuk": "08:00:00",
  "jam_keluar": "17:00:00",
  "toleransi_terlambat": 15,
  "aktif": true
}
```

### PUT `/api/pengaturan-waktu/:id`
**Update Time Setting**
```bash
PUT http://localhost:3001/api/pengaturan-waktu/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "jam_masuk": "08:30:00",
  "jam_keluar": "17:30:00",
  "toleransi_terlambat": 10,
  "aktif": true
}
```

### DELETE `/api/pengaturan-waktu/:id`
**Delete Time Setting**
```bash
DELETE http://localhost:3001/api/pengaturan-waktu/1
Authorization: Bearer <token>
```

---

## 🚪 Door Status APIs (Authenticated)

### GET `/api/status-pintu`
**Get All Door Status**
```bash
GET http://localhost:3001/api/status-pintu
Authorization: Bearer <token>
```

### GET `/api/status-pintu/terkini`
**Get Latest Door Status**
```bash
GET http://localhost:3001/api/status-pintu/terkini
Authorization: Bearer <token>
```

### GET `/api/status-pintu/pintu/:nama_pintu`
**Get Status by Door Name**
```bash
GET http://localhost:3001/api/status-pintu/pintu/Pintu%20Utama
Authorization: Bearer <token>
```

### GET `/api/status-pintu/history`
**Get Door Status History**
```bash
GET http://localhost:3001/api/status-pintu/history
Authorization: Bearer <token>

Query Parameters:
- nama_pintu: "Pintu Utama" (optional)
- limit: 10 (optional)
```

### POST `/api/status-pintu/update`
**Update Door Status**
```bash
POST http://localhost:3001/api/status-pintu/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama_pintu": "Pintu Utama",
  "status": "terbuka",
  "alasan": "Jam kerja dimulai"
}
```

### POST `/api/status-pintu/otomatis-buka`
**Auto Open Door**
```bash
POST http://localhost:3001/api/status-pintu/otomatis-buka
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama_pintu": "Pintu Utama",
  "durasi_menit": 30
}
```

### DELETE `/api/status-pintu/:id`
**Delete Door Status Record**
```bash
DELETE http://localhost:3001/api/status-pintu/1
Authorization: Bearer <token>
```

---

## 🌐 Public Door Status APIs ⭐

> **⚠️ PENTING**: Endpoint ini dapat diakses **TANPA AUTENTIKASI** - cocok untuk integrasi IoT/sistem eksternal

> **Note**: These endpoints are public and don't require authentication

### GET `/api/public/door/health` ⭐
**Health Check**
```bash
GET http://localhost:3001/api/public/door/health
```

**Response:**
```json
{
  "success": true,
  "message": "API Status Pintu berjalan normal",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "version": "1.0.0"
}
```

### GET `/api/public/door/status` ⭐
**Get All Door Current Status**
```bash
GET http://localhost:3001/api/public/door/status
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nama_pintu": "Pintu Utama",
      "status": "terbuka",
      "waktu_perubahan": "2025-01-18T08:00:00.000Z",
      "alasan": "Jam kerja dimulai",
      "nama_karyawan": "Admin"
    }
  ],
  "count": 1,
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

### GET `/api/public/door/status/latest` ⭐
**Get Latest Door Status (Most Recent)**
```bash
GET http://localhost:3001/api/public/door/status/latest
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-01-18T08:00:00.000Z",
    "nama_karyawan": "Admin"
  },
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

### GET `/api/public/door/status/:nama_pintu` ⭐
**Get Status by Door Name (Public)**
```bash
GET http://localhost:3001/api/public/door/status/Pintu%20Utama
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-01-18T08:00:00.000Z",
    "alasan": "Jam kerja dimulai",
    "nama_karyawan": "Admin"
  },
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

### GET `/api/public/door/history` ⭐
**Get Door Status History (Public)**
```bash
GET http://localhost:3001/api/public/door/history?nama_pintu=Pintu%20Utama&limit=5
```

**Query Parameters:**
- `nama_pintu` (optional): Filter by door name
- `limit` (optional): Number of records (max 50, default 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nama_pintu": "Pintu Utama",
      "status": "terbuka",
      "waktu_perubahan": "2025-01-18T08:00:00.000Z",
      "alasan": "Jam kerja dimulai",
      "nama_karyawan": "Admin"
    }
  ],
  "count": 1,
  "limit": 5,
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

### POST `/api/public/door/update` ⭐
**Update Door Status (Public with API Key)**
```bash
POST http://localhost:3001/api/public/door/update
Content-Type: application/json

{
  "nama_pintu": "Pintu Utama",
  "status": "tertutup",
  "api_key": "pintu-secret-2025",
  "alasan": "Jam kerja selesai"
}
```

**Required Fields:**
- `nama_pintu`: Door name
- `status`: "terbuka" or "tertutup"
- `api_key`: API key for authentication (default: "pintu-secret-2025")
- `alasan` (optional): Reason for status change

**Response:**
```json
{
  "success": true,
  "message": "Status pintu 'Pintu Utama' berhasil diubah menjadi 'tertutup'",
  "data": {
    "id": 5,
    "nama_pintu": "Pintu Utama",
    "status": "tertutup",
    "waktu_perubahan": "2025-07-06T10:30:00.000Z",
    "alasan": "Jam kerja selesai"
  }
}
```

### GET `/api/public/door/main-door/status` ⭐
**Get Main Door Status Only**
```bash
GET http://localhost:3001/api/public/door/main-door/status
```

**Response:**
```json
{
  "success": true,
  "message": "Status Pintu Utama",
  "data": {
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-07-06T10:30:00.000Z",
    "alasan": "Absen Masuk - John Doe (ID: 123)",
    "nama_karyawan": "John Doe"
  },
  "timestamp": "2025-07-06T10:35:00.000Z"
}
```

### POST `/api/public/door/main-door/update` ⭐
**Update Main Door Only (Simplified)**
```bash
POST http://localhost:3001/api/public/door/main-door/update
Content-Type: application/json

{
  "status": "terbuka",
  "api_key": "pintu-secret-2025",
  "alasan": "Manual override"
}
```

**Required Fields:**
- `status`: "terbuka" or "tertutup"
- `api_key`: API key for authentication
- `alasan` (optional): Reason for status change

**Response:**
```json
{
  "success": true,
  "message": "Pintu Utama berhasil diubah menjadi 'terbuka'",
  "data": {
    "id": 8,
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-07-06T10:30:00.000Z",
    "alasan": "Manual override"
  }
}
```

---

## 📁 File Upload/Static Files

### GET `/uploads/*`
**Access Uploaded Files**
```bash
GET http://localhost:3001/uploads/karyawan/photo.jpg
GET http://localhost:3001/uploads/absensi/1-2025-01-18-08-00-00.jpg
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=absensi_db

# Server Configuration
PORT=3001

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Door API Key (for public endpoints)
DOOR_API_KEY=pintu-secret-2025
```

---

## 📊 Database Tables

1. **users** - User accounts
2. **karyawan** - Employee data
3. **absensi** - Attendance records
4. **pengaturan_waktu** - Time settings
5. **status_pintu** - Door status logs

---

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:3001/api/public/door/health
   
   # Get door status
   curl http://localhost:3001/api/public/door/status
   ```

3. **Login to get JWT token:**
   ```bash
   curl -X POST http://localhost:3001/api/user/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}'
   ```

---

## 📝 Notes

- ⭐ = Public endpoints (no authentication required)
- All other endpoints require JWT token in Authorization header
- File uploads use `multipart/form-data`
- Date format: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Time format: HH:mm:ss
- Public API has rate limiting (max 50 records for history)

---

**Last Updated:** January 18, 2025
