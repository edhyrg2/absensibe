-- 006_create_status_pintu_table.sql
-- Tabel untuk menyimpan status pintu dan log perubahannya

CREATE TABLE IF NOT EXISTS status_pintu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_pintu VARCHAR(100) NOT NULL COMMENT 'Nama/identifier pintu (misal: Pintu Utama, Pintu Belakang)',
    status ENUM('terbuka', 'tertutup') NOT NULL COMMENT 'Status pintu saat ini',
    id_karyawan_terakhir INT COMMENT 'Karyawan yang terakhir mengubah status',
    waktu_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu perubahan status',
    alasan TEXT COMMENT 'Alasan perubahan status pintu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    FOREIGN KEY (id_karyawan_terakhir) REFERENCES karyawan(id) ON DELETE SET NULL
);

-- Index untuk performa pencarian
CREATE INDEX idx_status_pintu_nama ON status_pintu(nama_pintu);
CREATE INDEX idx_status_pintu_status ON status_pintu(status);
CREATE INDEX idx_status_pintu_waktu ON status_pintu(waktu_perubahan);
CREATE INDEX idx_status_pintu_karyawan ON status_pintu(id_karyawan_terakhir);
CREATE INDEX idx_status_pintu_deleted_at ON status_pintu(deleted_at);

-- Insert data default status pintu
INSERT INTO status_pintu (nama_pintu, status, alasan) VALUES
('Pintu Utama', 'tertutup', 'Status default sistem'),
('Pintu Belakang', 'tertutup', 'Status default sistem')
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    alasan = VALUES(alasan);
