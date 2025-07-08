# Migration untuk Sistem Absensi Wajah

File migration ini berisi struktur database yang dibutuhkan untuk menjalankan sistem absensi wajah berdasarkan analisis dari controller yang ada.

## Struktur Database

### 1. Tabel `karyawan`
Menyimpan data karyawan dengan kolom:
- `id`: Primary key auto increment
- `nip`: Nomor Induk Pegawai (unique)
- `nama`: Nama lengkap karyawan
- `jabatan`: Jabatan karyawan
- `foto`: Path atau URL foto karyawan
- `tim`: Tim atau divisi karyawan
- `created_at`, `updated_at`, `deleted_at`: Timestamp fields dengan soft delete

### 2. Tabel `pengaturan_waktu`
Menyimpan pengaturan waktu kerja dengan kolom:
- `id`: Primary key auto increment
- `nama`: Nama pengaturan (misal: "Jam Masuk", "Jam Pulang")
- `waktu_mulai`: Waktu mulai periode
- `waktu_selesai`: Waktu selesai periode
- `created_at`, `updated_at`, `deleted_at`: Timestamp fields dengan soft delete

### 3. Tabel `users`
Menyimpan data pengguna/admin sistem dengan kolom:
- `id`: Primary key auto increment
- `username`: Username untuk login (unique)
- `password`: Password yang sudah di-hash dengan bcrypt
- `password_teks`: Password dalam bentuk teks (untuk keperluan admin)
- `id_karyawan`: Foreign key ke tabel karyawan
- `created_at`, `updated_at`, `deleted_at`: Timestamp fields dengan soft delete

### 4. Tabel `absensi`
Menyimpan data absensi karyawan dengan kolom:
- `id`: Primary key auto increment
- `id_karyawan`: Foreign key ke tabel karyawan
- `tanggal`: Tanggal absensi
- `waktu_masuk`: Waktu absen masuk
- `waktu_keluar`: Waktu absen keluar
- `foto_masuk`: Path foto saat absen masuk
- `foto_keluar`: Path foto saat absen keluar
- `note`: Catatan tambahan
- `created_at`, `updated_at`: Timestamp fields
- Unique constraint pada kombinasi `id_karyawan` dan `tanggal`

## Cara Menjalankan Migration

### Opsi 1: Jalankan File Migration Lengkap
```bash
mysql -u root -p absensi_wajah < migration.sql
```

### Opsi 2: Jalankan Migration Bertahap
```bash
# Jalankan setiap file migration secara berurutan
mysql -u root -p absensi_wajah < migrations/001_create_karyawan_table.sql
mysql -u root -p absensi_wajah < migrations/002_create_pengaturan_waktu_table.sql
mysql -u root -p absensi_wajah < migrations/003_create_users_table.sql
mysql -u root -p absensi_wajah < migrations/004_create_absensi_table.sql
mysql -u root -p absensi_wajah < migrations/005_seed_default_data.sql
```

### Opsi 3: Jalankan dari MySQL Command Line
1. Login ke MySQL:
   ```bash
   mysql -u root -p
   ```

2. Buat database:
   ```sql
   CREATE DATABASE IF NOT EXISTS absensi_wajah;
   USE absensi_wajah;
   ```

3. Jalankan source file:
   ```sql
   SOURCE migration.sql;
   ```

## Data Default

Migration akan membuat data default berikut:

### Pengaturan Waktu:
- Jam Masuk: 07:00 - 09:00
- Jam Pulang: 16:00 - 18:00

### Admin User:
- Username: `admin`
- Password: `admin123`
- Terhubung dengan karyawan NIP: `ADM001`

### Contoh Karyawan:
- ADM001: Administrator (Admin, IT)
- EMP001: John Doe (Developer, IT)
- EMP002: Jane Smith (Designer, Creative)
- EMP003: Bob Johnson (Manager, Management)

## Index Database

Migration ini juga akan membuat index untuk optimasi performa:
- Index pada NIP karyawan
- Index pada username user
- Index pada kombinasi id_karyawan dan tanggal absensi
- Index pada deleted_at untuk soft delete

## Catatan Penting

1. **Soft Delete**: Sistem menggunakan soft delete untuk karyawan, users, dan pengaturan waktu
2. **Foreign Key Constraints**: Terdapat relasi antara tables dengan constraint CASCADE dan SET NULL
3. **Unique Constraints**: 
   - NIP karyawan harus unique
   - Username harus unique
   - Kombinasi id_karyawan dan tanggal absensi harus unique (satu karyawan hanya bisa absen sekali per hari)
4. **Password Hash**: Password disimpan dalam bentuk hash bcrypt dengan salt rounds 10

## Troubleshooting

Jika mengalami error foreign key constraint, pastikan:
1. Engine database adalah InnoDB
2. Tabel dijalankan sesuai urutan (karyawan → pengaturan_waktu → users → absensi)
3. Data yang direferensikan sudah ada sebelum membuat foreign key
