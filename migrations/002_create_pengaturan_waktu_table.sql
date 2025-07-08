-- 002_create_pengaturan_waktu_table.sql
-- Tabel untuk menyimpan pengaturan waktu kerja

CREATE TABLE IF NOT EXISTS pengaturan_waktu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL COMMENT 'Nama pengaturan waktu (misal: Jam Masuk, Jam Pulang)',
    waktu_mulai TIME NOT NULL COMMENT 'Waktu mulai periode',
    waktu_selesai TIME NOT NULL COMMENT 'Waktu selesai periode',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp'
);

-- Index untuk performa pencarian
CREATE INDEX idx_pengaturan_waktu_nama ON pengaturan_waktu(nama);
CREATE INDEX idx_pengaturan_waktu_deleted_at ON pengaturan_waktu(deleted_at);

-- Insert data default
INSERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) VALUES
('Jam Masuk', '07:00:00', '09:00:00'),
('Jam Pulang', '16:00:00', '18:00:00')
ON DUPLICATE KEY UPDATE
    waktu_mulai = VALUES(waktu_mulai),
    waktu_selesai = VALUES(waktu_selesai);
