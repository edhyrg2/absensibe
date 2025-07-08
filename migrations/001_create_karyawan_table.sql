-- 001_create_karyawan_table.sql
-- Tabel untuk menyimpan data karyawan

CREATE TABLE IF NOT EXISTS karyawan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nomor Induk Pegawai',
    nama VARCHAR(100) NOT NULL COMMENT 'Nama lengkap karyawan',
    jabatan VARCHAR(100) COMMENT 'Jabatan karyawan',
    foto TEXT COMMENT 'Path atau URL foto karyawan',
    tim VARCHAR(100) COMMENT 'Tim atau divisi karyawan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp'
);

-- Index untuk performa pencarian
CREATE INDEX idx_karyawan_nip ON karyawan(nip);
CREATE INDEX idx_karyawan_tim ON karyawan(tim);
CREATE INDEX idx_karyawan_deleted_at ON karyawan(deleted_at);
