# Sistem Absensi Wajah

Sistem absensi berbasis pengenalan wajah menggunakan Node.js, Express, dan MySQL.

## Prerequisites

- Node.js (v14 atau lebih baru)
- MySQL Server
- NPM atau Yarn

## Instalasi

1. **Clone atau download project ini**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup konfigurasi database**
   ```bash
   # Copy file .env.example ke .env
   copy .env.example .env
   
   # Edit file .env sesuai dengan konfigurasi MySQL Anda
   ```

   Contoh isi file `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=absensi_wajah
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

4. **Jalankan migration database**
   ```bash
   npm run migrate
   ```

5. **Verifikasi migration (opsional)**
   ```bash
   npm run migrate:verify
   ```

6. **Jalankan aplikasi**
   ```bash
   npm start
   ```

   Server akan berjalan di `http://localhost:3000`

## Script NPM yang Tersedia

| Script | Deskripsi |
|--------|-----------|
| `npm start` | Menjalankan server aplikasi |
| `npm run migrate` | Menjalankan migration database (membuat tabel dan data default) |
| `npm run migrate:rollback` | Menghapus semua tabel (rollback) |
| `npm run migrate:verify` | Verifikasi hasil migration dan menampilkan struktur database |
| `npm run db:setup` | Alias untuk `npm run migrate` |

## Struktur Database

### Tabel `karyawan`
- `id` - Primary key
- `nip` - Nomor Induk Pegawai (unique)
- `nama` - Nama lengkap
- `jabatan` - Jabatan karyawan
- `foto` - Path foto karyawan
- `tim` - Tim/divisi
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### Tabel `pengaturan_waktu`
- `id` - Primary key
- `nama` - Nama pengaturan (misal: "Jam Masuk")
- `waktu_mulai` - Waktu mulai
- `waktu_selesai` - Waktu selesai
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### Tabel `users`
- `id` - Primary key
- `username` - Username login (unique)
- `password` - Password ter-hash
- `password_teks` - Password plaintext (untuk admin)
- `id_karyawan` - Foreign key ke tabel karyawan
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### Tabel `absensi`
- `id` - Primary key
- `id_karyawan` - Foreign key ke tabel karyawan
- `tanggal` - Tanggal absensi
- `waktu_masuk` - Waktu absen masuk
- `waktu_keluar` - Waktu absen keluar
- `foto_masuk` - Path foto saat absen masuk
- `foto_keluar` - Path foto saat absen keluar
- `note` - Catatan tambahan
- `created_at`, `updated_at` - Timestamps

## Data Default

Setelah migration, sistem akan memiliki data default:

### Admin User
- **Username**: `admin`
- **Password**: `admin123`

### Pengaturan Waktu
- **Jam Masuk**: 07:00 - 09:00
- **Jam Pulang**: 16:00 - 18:00

### Contoh Karyawan
- ADM001: Administrator (Admin, IT)
- EMP001: John Doe (Developer, IT)
- EMP002: Jane Smith (Designer, Creative)
- EMP003: Bob Johnson (Manager, Management)

## API Endpoints

### Authentication
- `POST /api/users/login` - Login user

### Karyawan
- `GET /api/karyawan` - Get all karyawan
- `POST /api/karyawan` - Create karyawan
- `PUT /api/karyawan/:id` - Update karyawan
- `DELETE /api/karyawan/:id` - Delete karyawan

### Absensi
- `POST /api/absensi/masuk` - Absen masuk/keluar
- `GET /api/absensi/rekap` - Get rekap absensi

### Pengaturan Waktu
- `GET /api/waktu` - Get all pengaturan waktu
- `GET /api/waktu/sekarang` - Get waktu saat ini
- `POST /api/waktu` - Create pengaturan waktu
- `PUT /api/waktu/:id` - Update pengaturan waktu
- `DELETE /api/waktu/:id` - Delete pengaturan waktu

## Troubleshooting

### Migration Gagal
1. **Pastikan MySQL server berjalan**
2. **Periksa konfigurasi di file `.env`**
3. **Pastikan user MySQL memiliki permission untuk create database**

### Error "Access Denied"
1. **Periksa username dan password MySQL di file `.env`**
2. **Pastikan user MySQL memiliki akses ke database**

### Error "Connection Refused"
1. **Pastikan MySQL server berjalan di port 3306**
2. **Periksa firewall tidak memblokir koneksi**

### Rollback Database
Jika perlu menghapus semua tabel dan memulai ulang:
```bash
npm run migrate:rollback
npm run migrate
```

## Development

### Menambah Migration Baru
1. Buat file SQL baru di folder `migrations/`
2. Update script `migrate.js` jika diperlukan
3. Jalankan `npm run migrate`

### Struktur Folder
```
absensi/
├── controllers/        # Controller files
├── middlewares/        # Middleware files
├── routes/            # Route files
├── migrations/        # Database migration files
├── uploads/           # Uploaded files
├── .env              # Environment variables
├── .env.example      # Environment template
├── db.js             # Database connection
├── migrate.js        # Migration script
├── server.js         # Main server file
└── package.json      # NPM configuration
```

## License

MIT
