const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// K        // 8. Insert data default pengaturan waktu
console.log('⏳ Menambahkan data default pengaturan waktu...');
await connection.promise().query(`
            INSERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) VALUES
            ('Jam Masuk', '07:00:00', '09:00:00'),
            ('Jam Pulang', '16:00:00', '18:00:00')
            ON DUPLICATE KEY UPDATE
                waktu_mulai = VALUES(waktu_mulai),
                waktu_selesai = VALUES(waktu_selesai)
        `);
console.log('   ✓ Data pengaturan waktu berhasil ditambahkan');

// 9. Insert data default karyawan admintabase
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

async function runMigration() {
    console.log('🚀 Memulai proses migration...');
    console.log('📋 Konfigurasi database:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}`);
    console.log('');

    let connection;

    try {
        // Test koneksi basic
        connection = mysql.createConnection(dbConfig);
        await connection.promise().ping();
        console.log('✅ Database connection successful!');

        // 1. Buat database
        console.log('⏳ Membuat database...');
        await connection.promise().query('CREATE DATABASE IF NOT EXISTS absensi_wajah');
        console.log('   ✓ Database \'absensi_wajah\' siap');

        // 2. Ganti koneksi untuk menggunakan database
        await connection.end();
        connection = mysql.createConnection({
            ...dbConfig,
            database: 'absensi_wajah'
        });

        // 3. Buat tabel karyawan
        console.log('⏳ Membuat tabel karyawan...');
        await connection.promise().query(`
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
            )
        `);
        console.log('   ✓ Tabel \'karyawan\' berhasil dibuat');

        // 4. Buat tabel pengaturan_waktu
        console.log('⏳ Membuat tabel pengaturan_waktu...');
        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS pengaturan_waktu (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                waktu_mulai TIME NOT NULL,
                waktu_selesai TIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            )
        `);
        console.log('   ✓ Tabel \'pengaturan_waktu\' berhasil dibuat');

        // 5. Buat tabel users
        console.log('⏳ Membuat tabel users...');
        await connection.promise().query(`
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
            )
        `);
        console.log('   ✓ Tabel \'users\' berhasil dibuat');

        // 6. Buat tabel absensi
        console.log('⏳ Membuat tabel absensi...');
        await connection.promise().query(`
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
            )
        `);
        console.log('   ✓ Tabel \'absensi\' berhasil dibuat');

        // 7. Buat tabel status_pintu
        console.log('⏳ Membuat tabel status_pintu...');
        await connection.promise().query(`
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
            )
        `);
        console.log('   ✓ Tabel \'status_pintu\' berhasil dibuat');

        // 8. Insert data default pengaturan waktu
        console.log('⏳ Menambahkan data default pengaturan waktu...');
        await connection.promise().query(`
            INSERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) VALUES
            ('Jam Masuk', '07:00:00', '09:00:00'),
            ('Jam Pulang', '16:00:00', '18:00:00')
            ON DUPLICATE KEY UPDATE
                waktu_mulai = VALUES(waktu_mulai),
                waktu_selesai = VALUES(waktu_selesai)
        `);
        console.log('   ✓ Data pengaturan waktu berhasil ditambahkan');

        // 8. Insert data default karyawan admin
        console.log('⏳ Menambahkan data default karyawan...');
        await connection.promise().query(`
            INSERT INTO karyawan (nip, nama, jabatan, tim) VALUES
            ('ADM001', 'Administrator', 'Admin', 'IT')
            ON DUPLICATE KEY UPDATE
                nama = VALUES(nama),
                jabatan = VALUES(jabatan),
                tim = VALUES(tim)
        `);
        console.log('   ✓ Data karyawan admin berhasil ditambahkan');

        // 9. Insert data default user admin
        console.log('⏳ Menambahkan data default user admin...');
        const [adminKaryawan] = await connection.promise().query('SELECT id FROM karyawan WHERE nip = ?', ['ADM001']);
        const adminKaryawanId = adminKaryawan[0].id;

        await connection.promise().query(`
            INSERT INTO users (username, password, password_teks, id_karyawan) VALUES
            ('admin', '$2a$10$rOkLVJDZmAjOlxMdcq8Ow.UNk7v9mJzHZQYkFWmBFPBJxOKNvGMiq', 'admin123', ?)
            ON DUPLICATE KEY UPDATE
                password = VALUES(password),
                password_teks = VALUES(password_teks),
                id_karyawan = VALUES(id_karyawan)
        `, [adminKaryawanId]);
        console.log('   ✓ Data user admin berhasil ditambahkan');

        // 11. Insert data default status pintu
        console.log('⏳ Menambahkan data default status pintu...');
        await connection.promise().query(`
            INSERT INTO status_pintu (nama_pintu, status, alasan) VALUES
            ('Pintu Utama', 'tertutup', 'Status default sistem'),
            ('Pintu Belakang', 'tertutup', 'Status default sistem')
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                alasan = VALUES(alasan)
        `);
        console.log('   ✓ Data default status pintu berhasil ditambahkan');

        // 12. Buat index untuk performa
        console.log('⏳ Membuat index...');
        const indexes = [
            { name: 'idx_karyawan_nip', sql: 'CREATE INDEX idx_karyawan_nip ON karyawan(nip)' },
            { name: 'idx_users_username', sql: 'CREATE INDEX idx_users_username ON users(username)' },
            { name: 'idx_pengaturan_waktu_nama', sql: 'CREATE INDEX idx_pengaturan_waktu_nama ON pengaturan_waktu(nama)' },
            { name: 'idx_absensi_karyawan_tanggal', sql: 'CREATE INDEX idx_absensi_karyawan_tanggal ON absensi(id_karyawan, tanggal)' },
            { name: 'idx_status_pintu_nama', sql: 'CREATE INDEX idx_status_pintu_nama ON status_pintu(nama_pintu)' },
            { name: 'idx_status_pintu_status', sql: 'CREATE INDEX idx_status_pintu_status ON status_pintu(status)' },
            { name: 'idx_status_pintu_waktu', sql: 'CREATE INDEX idx_status_pintu_waktu ON status_pintu(waktu_perubahan)' }
        ];

        for (const index of indexes) {
            try {
                await connection.promise().query(index.sql);
                console.log(`   ✓ Index '${index.name}' berhasil dibuat`);
            } catch (error) {
                if (error.message.includes('Duplicate key name')) {
                    console.log(`   ℹ️  Index '${index.name}' sudah ada`);
                } else {
                    console.warn(`   ⚠️  Warning membuat index '${index.name}': ${error.message}`);
                }
            }
        }

        console.log('');
        console.log('✅ Migration berhasil dijalankan!');
        console.log('📊 Database dan tabel telah dibuat:');
        console.log('   - Database: absensi_wajah');
        console.log('   - Tabel: karyawan, pengaturan_waktu, users, absensi, status_pintu');
        console.log('');
        console.log('👤 Data default yang dibuat:');
        console.log('   - Admin user: username=admin, password=admin123');
        console.log('   - Pengaturan waktu: Jam Masuk (07:00-09:00), Jam Pulang (16:00-18:00)');
        console.log('   - Status pintu: Pintu Utama dan Pintu Belakang (tertutup)');
        console.log('');
        console.log('🎉 Sistem siap digunakan! Jalankan: npm start');

    } catch (error) {
        console.error('❌ Error saat menjalankan migration:');
        console.error(error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('💡 Tips troubleshooting:');
            console.log('   1. Pastikan MySQL server sudah berjalan');
            console.log('   2. Periksa konfigurasi database di file .env');
            console.log('   3. Pastikan username dan password MySQL benar');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Fungsi untuk rollback
async function rollbackMigration() {
    console.log('🗑️  Memulai rollback migration...');

    let connection;

    try {
        connection = mysql.createConnection({
            ...dbConfig,
            database: 'absensi_wajah'
        });

        console.log('⚠️  Menghapus semua tabel...');

        await connection.promise().query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['absensi', 'users', 'status_pintu', 'pengaturan_waktu', 'karyawan'];

        for (const table of tables) {
            await connection.promise().query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`   ✓ Tabel '${table}' dihapus`);
        }

        await connection.promise().query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Rollback berhasil! Semua tabel telah dihapus.');

    } catch (error) {
        console.error('❌ Error saat rollback:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Cek argumen command line
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
    rollbackMigration();
} else {
    runMigration();
}
