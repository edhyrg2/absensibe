-- Migration untuk Sistem Absensi Wajah
-- Dibuat berdasarkan struktur controller yang -- 6. Insert data default untuk pengaturan wakt-- 8. Tambahkan -- 10. Tampilkan struktur setiap tabel
DESCRIBE karyawan;
DESCRIBE pengaturan_waktu;
DESCRIBE users;
DESCRIBE absensi;
DESCRIBE status_pintu; untuk performa
CREATE INDEX idx_absensi_karyawan_tanggal ON absensi(id_karyawan, tanggal);
CREATE INDEX idx_karyawan_nip ON karyawan(nip);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_pengaturan_waktu_nama ON pengaturan_waktu(nama);
CREATE INDEX idx_status_pintu_nama ON status_pintu(nama_pintu);
CREATE INDEX idx_status_pintu_status ON status_pintu(status);
CREATE INDEX idx_status_pintu_waktu ON status_pintu(waktu_perubahan);SERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) VALUES
('Jam Masuk', '07:00:00', '09:00:00'),
('Jam Pulang', '16:00:00', '18:00:00')
ON DUPLICATE KEY UPDATE
    waktu_mulai = VALUES(waktu_mulai),
    waktu_selesai = VALUES(waktu_selesai);

-- 7. Insert data default status pintu
INSERT INTO status_pintu (nama_pintu, status, alasan) VALUES
('Pintu Utama', 'tertutup', 'Status default sistem'),
('Pintu Belakang', 'tertutup', 'Status default sistem')
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    alasan = VALUES(alasan);-- 1. Buat database (jika belum ada)
CREATE DATABASE IF NOT EXISTS absensi_wajah;
USE absensi_wajah;

-- 2. Tabel karyawan
CREATE TABLE IF NOT EXISTS karyawan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(100),
    foto TEXT,
    tim VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 3. Tabel pengaturan_waktu
CREATE TABLE IF NOT EXISTS pengaturan_waktu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    waktu_mulai TIME NOT NULL,
    waktu_selesai TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 4. Tabel users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    password_teks VARCHAR(255),
    id_karyawan INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (id_karyawan) REFERENCES karyawan(id) ON DELETE SET NULL
);

-- 5. Tabel absensi
CREATE TABLE IF NOT EXISTS absensi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_karyawan INT NOT NULL,
    tanggal DATE NOT NULL,
    waktu_masuk TIME NULL,
    waktu_keluar TIME NULL,
    foto_masuk TEXT NULL,
    foto_keluar TEXT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_karyawan) REFERENCES karyawan(id) ON DELETE CASCADE,
    UNIQUE KEY unique_karyawan_tanggal (id_karyawan, tanggal)
);

-- 6. Tabel status_pintu
CREATE TABLE IF NOT EXISTS status_pintu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_pintu VARCHAR(100) NOT NULL COMMENT 'Nama/identifier pintu',
    status ENUM('terbuka', 'tertutup') NOT NULL COMMENT 'Status pintu saat ini',
    id_karyawan_terakhir INT COMMENT 'Karyawan yang terakhir mengubah status',
    waktu_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan status',
    alasan TEXT COMMENT 'Alasan perubahan status pintu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    FOREIGN KEY (id_karyawan_terakhir) REFERENCES karyawan(id) ON DELETE SET NULL
);

-- 6. Tabel status_pintu
CREATE TABLE IF NOT EXISTS status_pintu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_pintu VARCHAR(100) NOT NULL,
    status ENUM('terbuka', 'tertutup') NOT NULL,
    id_karyawan_terakhir INT,
    waktu_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    alasan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (id_karyawan_terakhir) REFERENCES karyawan(id) ON DELETE SET NULL
);

-- 7. Insert data default untuk pengaturan waktu
INSERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) VALUES
('Jam Masuk', '07:00:00', '09:00:00'),
('Jam Pulang', '16:00:00', '18:00:00')
ON DUPLICATE KEY UPDATE
    waktu_mulai = VALUES(waktu_mulai),
    waktu_selesai = VALUES(waktu_selesai);

-- 7. Insert data default admin user (optional)
-- Password: admin123 (hashed menggunakan bcrypt)
INSERT INTO karyawan (nip, nama, jabatan, tim) VALUES
('ADM001', 'Administrator', 'Admin', 'IT')
ON DUPLICATE KEY UPDATE
    nama = VALUES(nama),
    jabatan = VALUES(jabatan),
    tim = VALUES(tim);

-- Ambil ID karyawan admin untuk user
SET @admin_karyawan_id = (SELECT id FROM karyawan WHERE nip = 'ADM001');

INSERT INTO users (username, password, password_teks, id_karyawan) VALUES
('admin', '$2a$10$rOkLVJDZmAjOlxMdcq8Ow.UNk7v9mJzHZQYkFWmBFPBJxOKNvGMiq', 'admin123', @admin_karyawan_id)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    password_teks = VALUES(password_teks),
    id_karyawan = VALUES(id_karyawan);

-- 9. Insert data default status pintu
INSERT INTO status_pintu (nama_pintu, status, alasan) VALUES
('Pintu Utama', 'tertutup', 'Status default sistem'),
('Pintu Belakang', 'tertutup', 'Status default sistem')
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    alasan = VALUES(alasan);

-- 10. Tambahkan index untuk performa
CREATE INDEX idx_absensi_karyawan_tanggal ON absensi(id_karyawan, tanggal);
CREATE INDEX idx_karyawan_nip ON karyawan(nip);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_pengaturan_waktu_nama ON pengaturan_waktu(nama);
CREATE INDEX idx_status_pintu_nama ON status_pintu(nama_pintu);

-- 11. Tampilkan informasi tabel yang telah dibuat
SHOW TABLES;

-- 12. Tampilkan struktur setiap tabel
DESCRIBE karyawan;
DESCRIBE pengaturan_waktu;
DESCRIBE users;
DESCRIBE absensi;
DESCRIBE status_pintu;
