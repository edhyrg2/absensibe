# API Publik Status Pintu

Dokumentasi lengkap untuk API publik status pintu yang dapat diakses tanpa autentikasi.

## Base URL
```
http://localhost:3001/api/public/door
```

## Endpoints

### 1. Health Check
**GET** `/health`

Mengecek status kesehatan API status pintu.

**Response:**
```json
{
  "success": true,
  "message": "API Status Pintu berjalan normal",
  "timestamp": "2025-01-19T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Get Semua Status Pintu Terkini
**GET** `/status`

Mengambil status terkini dari semua pintu yang ada.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nama_pintu": "Pintu Utama",
      "status": "terbuka",
      "waktu_perubahan": "2025-01-19T10:25:00.000Z",
      "alasan": "Jam kerja dimulai",
      "nama_karyawan": "John Doe"
    },
    {
      "nama_pintu": "Pintu Belakang",
      "status": "tertutup",
      "waktu_perubahan": "2025-01-19T09:00:00.000Z",
      "alasan": "Keamanan",
      "nama_karyawan": null
    }
  ],
  "count": 2,
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

### 3. Get Status Pintu Terbaru
**GET** `/status/latest`

Mengambil status pintu yang paling baru diupdate.

**Response:**
```json
{
  "success": true,
  "data": {
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-01-19T10:25:00.000Z",
    "nama_karyawan": "John Doe"
  },
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

### 4. Get Status Pintu Tertentu
**GET** `/status/:nama_pintu`

Mengambil status terkini dari pintu tertentu.

**Parameters:**
- `nama_pintu` (string): Nama pintu yang ingin dicek

**Example:**
```
GET /status/Pintu%20Utama
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-01-19T10:25:00.000Z",
    "alasan": "Jam kerja dimulai",
    "nama_karyawan": "John Doe"
  },
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "message": "Status pintu tidak ditemukan",
  "data": null
}
```

### 5. Get History Status Pintu
**GET** `/history`

Mengambil riwayat perubahan status pintu.

**Query Parameters:**
- `nama_pintu` (optional): Filter berdasarkan nama pintu tertentu
- `limit` (optional): Jumlah data yang diambil (default: 10, max: 50)

**Example:**
```
GET /history?nama_pintu=Pintu Utama&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nama_pintu": "Pintu Utama",
      "status": "terbuka",
      "waktu_perubahan": "2025-01-19T10:25:00.000Z",
      "alasan": "Jam kerja dimulai",
      "nama_karyawan": "John Doe"
    },
    {
      "nama_pintu": "Pintu Utama",
      "status": "tertutup",
      "waktu_perubahan": "2025-01-19T09:00:00.000Z",
      "alasan": "Malam hari",
      "nama_karyawan": "Jane Smith"
    }
  ],
  "count": 2,
  "limit": 5,
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

### 6. Update Status Pintu
**POST** `/update`

Mengupdate status pintu (memerlukan API key).

**Request Body:**
```json
{
  "nama_pintu": "Pintu Utama",
  "status": "terbuka",
  "api_key": "pintu-secret-2025",
  "alasan": "Update otomatis dari sistem"
}
```

**Required Fields:**
- `nama_pintu` (string): Nama pintu
- `status` (string): Status pintu ("terbuka" atau "tertutup")
- `api_key` (string): API key untuk autentikasi

**Optional Fields:**
- `alasan` (string): Alasan perubahan status

**Response (Success):**
```json
{
  "success": true,
  "message": "Status pintu 'Pintu Utama' berhasil diubah menjadi 'terbuka'",
  "data": {
    "id": 123,
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "waktu_perubahan": "2025-01-19T10:30:00.000Z",
    "alasan": "Update otomatis dari sistem"
  }
}
```

**Response (Invalid API Key):**
```json
{
  "success": false,
  "message": "API key tidak valid atau tidak disediakan"
}
```

**Response (Invalid Status):**
```json
{
  "success": false,
  "message": "Status harus 'terbuka' atau 'tertutup'"
}
```

## Konfigurasi API Key

API key untuk endpoint update dapat dikonfigurasi melalui environment variable:

```bash
DOOR_API_KEY=your-secret-key-here
```

Jika tidak dikonfigurasi, akan menggunakan default: `pintu-secret-2025`

## Status Codes

- `200` - OK
- `400` - Bad Request (data tidak valid)
- `401` - Unauthorized (API key tidak valid)
- `404` - Not Found (data tidak ditemukan)
- `500` - Internal Server Error

## Contoh Penggunaan

### Menggunakan cURL

```bash
# Cek health
curl http://localhost:3001/api/public/door/health

# Get semua status pintu
curl http://localhost:3001/api/public/door/status

# Get status pintu tertentu
curl "http://localhost:3001/api/public/door/status/Pintu%20Utama"

# Get history
curl "http://localhost:3001/api/public/door/history?limit=5"

# Update status pintu
curl -X POST http://localhost:3001/api/public/door/update \
  -H "Content-Type: application/json" \
  -d '{
    "nama_pintu": "Pintu Utama",
    "status": "terbuka",
    "api_key": "pintu-secret-2025",
    "alasan": "Test update"
  }'
```

### Menggunakan JavaScript/Fetch

```javascript
// Get status pintu
const getStatusPintu = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/public/door/status');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Update status pintu
const updateStatusPintu = async (namaPintu, status, apiKey) => {
  try {
    const response = await fetch('http://localhost:3001/api/public/door/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama_pintu: namaPintu,
        status: status,
        api_key: apiKey,
        alasan: 'Update via JavaScript'
      })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Catatan Keamanan

1. API key untuk endpoint update bersifat sederhana dan hanya untuk proteksi dasar
2. Untuk production, disarankan menggunakan sistem autentikasi yang lebih robust
3. Endpoint GET bersifat publik dan dapat diakses tanpa autentikasi
4. Limit maksimal untuk history adalah 50 record untuk mencegah overload
5. Pastikan untuk menggunakan HTTPS di production environment

## Integrasi dengan Sistem Lain

API ini dirancang untuk mudah diintegrasikan dengan:
- Sistem IoT untuk monitoring pintu otomatis
- Dashboard monitoring real-time
- Aplikasi mobile untuk security
- Sistem CCTV atau keamanan lainnya
- Sistem notifikasi (email, SMS, push notification)
