-- 004_create_absensi_table.sql
-- Tabel untuk menyimpan data absensi karyawan

CREATE TABLE IF NOT EXISTS absensi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_karyawan INT NOT NULL COMMENT 'Referensi ke tabel karyawan',
    tanggal DATE NOT NULL COMMENT 'Tanggal absensi',
    waktu_masuk TIME NULL COMMENT 'Waktu absen masuk',
    waktu_keluar TIME NULL COMMENT 'Waktu absen keluar',
    foto_masuk TEXT NULL COMMENT 'Path foto saat absen masuk',
    foto_keluar TEXT NULL COMMENT 'Path foto saat absen keluar',
    note TEXT NULL COMMENT 'Catatan tambahan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_karyawan) REFERENCES karyawan(id) ON DELETE CASCADE,
    UNIQUE KEY unique_karyawan_tanggal (id_karyawan, tanggal) COMMENT 'Satu karyawan hanya bisa absen sekali per hari'
);

-- Index untuk performa pencarian
CREATE INDEX idx_absensi_karyawan_tanggal ON absensi(id_karyawan, tanggal);
CREATE INDEX idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX idx_absensi_waktu_masuk ON absensi(waktu_masuk);
CREATE INDEX idx_absensi_waktu_keluar ON absensi(waktu_keluar);
