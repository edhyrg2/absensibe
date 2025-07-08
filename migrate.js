const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Konfigurasi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Penting untuk menjalankan multiple SQL statements
};

// Fungsi untuk test koneksi database
async function testConnection() {
    console.log('🔍 Testing database connection...');

    const connection = mysql.createConnection(dbConfig);

    try {
        await connection.promise().ping();
        console.log('✅ Database connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    } finally {
        await connection.end();
    }
}

async function runMigration() {
    console.log('🚀 Memulai proses migration...');
    console.log('📋 Konfigurasi database:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}`);
    console.log('');

    // Test koneksi terlebih dahulu
    const isConnected = await testConnection();
    if (!isConnected) {
        console.log('');
        console.log('💡 Tips troubleshooting:');
        console.log('   1. Pastikan MySQL server sudah berjalan');
        console.log('   2. Buat file .env dari .env.example dan sesuaikan konfigurasi');
        console.log('   3. Pastikan username dan password MySQL benar');
        console.log('');
        console.log('   Contoh file .env:');
        console.log('   DB_HOST=localhost');
        console.log('   DB_USER=root');
        console.log('   DB_PASSWORD=your_mysql_password');
        console.log('   DB_NAME=absensi_wajah');
        process.exit(1);
    }

    let connection;

    try {
        // Buat koneksi tanpa database terlebih dahulu
        connection = mysql.createConnection(dbConfig);

        // Baca file migration
        const migrationPath = path.join(__dirname, 'migration.sql');
        console.log(`📄 Membaca file migration: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`File migration tidak ditemukan: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('⏳ Menjalankan migration...');

        // Pertama, buat database jika belum ada
        await connection.promise().query('CREATE DATABASE IF NOT EXISTS absensi_wajah');
        console.log('   ✓ Database \'absensi_wajah\' siap');

        // Ganti koneksi untuk menggunakan database yang baru dibuat
        await connection.end();
        connection = mysql.createConnection({
            ...dbConfig,
            database: 'absensi_wajah'
        });

        // Split SQL berdasarkan delimiter dan jalankan satu per satu
        const sqlStatements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 &&
                !stmt.startsWith('--') &&
                !stmt.match(/^\s*$/) &&
                !stmt.toLowerCase().includes('create database') &&
                !stmt.toLowerCase().startsWith('use '));

        let currentDatabase = 'absensi_wajah';

        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            if (statement) {
                try {
                    await connection.promise().query(statement);

                    if (statement.toLowerCase().includes('create table')) {
                        const tableName = statement.match(/create table.*?(\w+)/i)?.[1];
                        if (tableName) {
                            console.log(`   ✓ Tabel '${tableName}' berhasil dibuat`);
                        }
                    } else if (statement.toLowerCase().includes('insert into')) {
                        const tableName = statement.match(/insert into\s+(\w+)/i)?.[1];
                        if (tableName) {
                            console.log(`   ✓ Data default berhasil dimasukkan ke '${tableName}'`);
                        }
                    } else if (statement.toLowerCase().includes('create index')) {
                        const indexName = statement.match(/create index\s+(\w+)/i)?.[1];
                        if (indexName) {
                            console.log(`   ✓ Index '${indexName}' berhasil dibuat`);
                        }
                    }
                } catch (error) {
                    // Skip errors untuk statement yang mungkin sudah ada
                    if (error.message.includes('already exists') ||
                        error.message.includes('Duplicate entry') ||
                        error.message.includes('Duplicate key name')) {
                        // Ignore - sudah ada
                    } else if (statement.toLowerCase().includes('show tables') ||
                        statement.toLowerCase().includes('describe ')) {
                        // Skip tampilan informasi
                    } else {
                        console.warn(`   ⚠️  Warning: ${error.message}`);
                    }
                }
            }
        }

        console.log('');
        console.log('✅ Migration berhasil dijalankan!');
        console.log('📊 Database dan tabel telah dibuat:');
        console.log('   - Database: absensi_wajah');
        console.log('   - Tabel: karyawan, pengaturan_waktu, users, absensi');
        console.log('');
        console.log('👤 Data default yang dibuat:');
        console.log('   - Admin user: username=admin, password=admin123');
        console.log('   - Pengaturan waktu: Jam Masuk (07:00-09:00), Jam Pulang (16:00-18:00)');
        console.log('');
        console.log('🎉 Sistem siap digunakan! Jalankan: npm start');

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

// Fungsi untuk migration rollback (opsional)
async function rollbackMigration() {
    console.log('🗑️  Memulai rollback migration...');

    let connection;

    try {
        connection = mysql.createConnection({
            ...dbConfig,
            database: 'absensi_wajah'
        });

        console.log('⚠️  Menghapus semua tabel...');

        // Drop tables in reverse order (karena foreign key constraints)
        await connection.promise().query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.promise().query('DROP TABLE IF EXISTS absensi');
        await connection.promise().query('DROP TABLE IF EXISTS users');
        await connection.promise().query('DROP TABLE IF EXISTS status_pintu');
        await connection.promise().query('DROP TABLE IF EXISTS pengaturan_waktu');
        await connection.promise().query('DROP TABLE IF EXISTS karyawan');
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
