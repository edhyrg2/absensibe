-- 003_create_users_table.sql
-- Tabel untuk menyimpan data pengguna/admin sistem

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Username untuk login',
    password VARCHAR(255) NOT NULL COMMENT 'Password yang sudah di-hash',
    password_teks VARCHAR(255) COMMENT 'Password dalam bentuk teks (untuk keperluan admin)',
    id_karyawan INT COMMENT 'Referensi ke tabel karyawan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    FOREIGN KEY (id_karyawan) REFERENCES karyawan(id) ON DELETE SET NULL
);

-- Index untuk performa pencarian
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_id_karyawan ON users(id_karyawan);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
