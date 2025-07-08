-- 005_seed_default_data.sql
-- Script untuk memasukkan data default sistem

-- Insert data default admin karyawan
INSERT INTO karyawan (nip, nama, jabatan, tim) VALUES
('ADM001', 'Administrator', 'Admin', 'IT')
ON DUPLICATE KEY UPDATE
    nama = VALUES(nama),
    jabatan = VALUES(jabatan),
    tim = VALUES(tim);

-- Ambil ID karyawan admin untuk user
SET @admin_karyawan_id = (SELECT id FROM karyawan WHERE nip = 'ADM001');

-- Insert data default admin user
-- Password: admin123 (hashed menggunakan bcrypt dengan salt rounds 10)
INSERT INTO users (username, password, password_teks, id_karyawan) VALUES
('admin', '$2a$10$rOkLVJDZmAjOlxMdcq8Ow.UNk7v9mJzHZQYkFWmBFPBJxOKNvGMiq', 'admin123', @admin_karyawan_id)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    password_teks = VALUES(password_teks),
    id_karyawan = VALUES(id_karyawan);

-- Insert contoh karyawan untuk testing
INSERT INTO karyawan (nip, nama, jabatan, tim) VALUES
('EMP001', 'John Doe', 'Developer', 'IT'),
('EMP002', 'Jane Smith', 'Designer', 'Creative'),
('EMP003', 'Bob Johnson', 'Manager', 'Management')
ON DUPLICATE KEY UPDATE
    nama = VALUES(nama),
    jabatan = VALUES(jabatan),
    tim = VALUES(tim);
