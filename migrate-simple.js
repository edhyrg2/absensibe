const mysql = require('mysql2');
require('dotenv').config();

// Konfigurasi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'absensi_wajah'
};

async function runMigration() {
    console.log('🚀 Memulai proses migration...');

    let connection;

    try {
        connection = mysql.createConnection(dbConfig);

        // 1. Buat tabel karyawan
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
        console.log('   ✓ Tabel karyawan berhasil dibuat');

        // 2. Buat tabel pengaturan_waktu
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
        console.log('   ✓ Tabel pengaturan_waktu berhasil dibuat');

        // 3. Buat tabel users
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
        console.log('   ✓ Tabel users berhasil dibuat');

        // 4. Buat tabel absensi
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
        console.log('   ✓ Tabel absensi berhasil dibuat');

        // 5. Buat tabel status_pintu
        console.log('⏳ Membuat tabel status_pintu...');
        await connection.promise().query(`
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
            )
        `);
        console.log('   ✓ Tabel status_pintu berhasil dibuat');

        // 6. Insert data default
        console.log('⏳ Menambahkan data default...');

        // Pengaturan waktu
        await connection.promise().query(`
            INSERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) VALUES
            ('Jam Masuk', '07:00:00', '09:00:00'),
            ('Jam Pulang', '16:00:00', '18:00:00')
            ON DUPLICATE KEY UPDATE
                waktu_mulai = VALUES(waktu_mulai),
                waktu_selesai = VALUES(waktu_selesai)
        `);

        // Karyawan admin
        await connection.promise().query(`
            INSERT INTO karyawan (nip, nama, jabatan, tim) VALUES
            ('ADM001', 'Administrator', 'Admin', 'IT')
            ON DUPLICATE KEY UPDATE
                nama = VALUES(nama),
                jabatan = VALUES(jabatan),
                tim = VALUES(tim)
        `);

        // User admin
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

        // Status pintu default
        await connection.promise().query(`
            INSERT INTO status_pintu (nama_pintu, status, alasan) VALUES
            ('Pintu Utama', 'tertutup', 'Status default sistem'),
            ('Pintu Belakang', 'tertutup', 'Status default sistem')
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                alasan = VALUES(alasan)
        `);

        console.log('   ✓ Data default berhasil ditambahkan');

        // 7. Buat index
        console.log('⏳ Membuat index...');
        const indexes = [
            'CREATE INDEX idx_karyawan_nip ON karyawan(nip)',
            'CREATE INDEX idx_users_username ON users(username)',
            'CREATE INDEX idx_pengaturan_waktu_nama ON pengaturan_waktu(nama)',
            'CREATE INDEX idx_absensi_karyawan_tanggal ON absensi(id_karyawan, tanggal)',
            'CREATE INDEX idx_status_pintu_nama ON status_pintu(nama_pintu)',
            'CREATE INDEX idx_status_pintu_status ON status_pintu(status)'
        ];

        for (const indexSql of indexes) {
            try {
                await connection.promise().query(indexSql);
            } catch (error) {
                if (!error.message.includes('Duplicate key name')) {
                    console.warn(`   ⚠️  Warning membuat index: ${error.message}`);
                }
            }
        }
        console.log('   ✓ Index berhasil dibuat');

        console.log('');
        console.log('✅ Migration berhasil dijalankan!');
        console.log('📊 Database dan tabel telah dibuat:');
        console.log('   - karyawan, pengaturan_waktu, users, absensi, status_pintu');
        console.log('');
        console.log('👤 Data default yang dibuat:');
        console.log('   - Admin user: username=admin, password=admin123');
        console.log('   - Pengaturan waktu: Jam Masuk (07:00-09:00), Jam Pulang (16:00-18:00)');
        console.log('   - Status pintu: Pintu Utama dan Pintu Belakang (tertutup)');

    } catch (error) {
        console.error('❌ Error saat menjalankan migration:');
        console.error(error.message);
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
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
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
