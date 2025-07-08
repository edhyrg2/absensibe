const mysql = require('mysql2');
require('dotenv').config();

// Konfigurasi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absensi_wajah'
};

async function verifyMigration() {
    console.log('🔍 Verifikasi hasil migration...');

    let connection;

    try {
        connection = mysql.createConnection(dbConfig);

        // Cek tables yang ada
        console.log('\n📊 Tabel-tabel yang ada:');
        const [tables] = await connection.promise().query('SHOW TABLES');

        if (tables.length === 0) {
            console.log('   ❌ Tidak ada tabel yang ditemukan. Migration mungkin belum berjalan.');
            return;
        }

        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✓ ${tableName}`);
        });

        // Cek struktur setiap tabel
        const expectedTables = ['karyawan', 'pengaturan_waktu', 'users', 'absensi', 'status_pintu'];

        for (const tableName of expectedTables) {
            try {
                console.log(`\n📋 Struktur tabel '${tableName}':`);
                const [columns] = await connection.promise().query(`DESCRIBE ${tableName}`);

                columns.forEach(col => {
                    console.log(`   - ${col.Field} (${col.Type}${col.Null === 'NO' ? ', NOT NULL' : ''}${col.Key ? ', ' + col.Key : ''})`);
                });

                // Cek jumlah data
                const [count] = await connection.promise().query(`SELECT COUNT(*) as total FROM ${tableName}`);
                console.log(`   📊 Total data: ${count[0].total} rows`);

            } catch (error) {
                console.log(`   ❌ Tabel '${tableName}' tidak ditemukan atau error: ${error.message}`);
            }
        }

        // Cek data default
        console.log('\n👤 Data default yang ada:');

        try {
            const [users] = await connection.promise().query('SELECT username FROM users');
            console.log(`   Users: ${users.map(u => u.username).join(', ')}`);
        } catch (error) {
            console.log('   ❌ Tidak bisa mengambil data users');
        }

        try {
            const [waktu] = await connection.promise().query('SELECT nama FROM pengaturan_waktu WHERE deleted_at IS NULL');
            console.log(`   Pengaturan waktu: ${waktu.map(w => w.nama).join(', ')}`);
        } catch (error) {
            console.log('   ❌ Tidak bisa mengambil data pengaturan waktu');
        }

        try {
            const [karyawan] = await connection.promise().query('SELECT nama FROM karyawan WHERE deleted_at IS NULL');
            console.log(`   Karyawan: ${karyawan.map(k => k.nama).join(', ')}`);
        } catch (error) {
            console.log('   ❌ Tidak bisa mengambil data karyawan');
        }

        try {
            const [statusPintu] = await connection.promise().query('SELECT nama_pintu, status FROM status_pintu WHERE deleted_at IS NULL ORDER BY waktu_perubahan DESC');
            console.log(`   Status Pintu: ${statusPintu.map(sp => `${sp.nama_pintu} (${sp.status})`).join(', ')}`);
        } catch (error) {
            console.log('   ❌ Tidak bisa mengambil data status pintu');
        }

        console.log('\n✅ Verifikasi selesai!');

    } catch (error) {
        console.error('❌ Error saat verifikasi:', error.message);

        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database tidak ditemukan. Jalankan migration terlebih dahulu:');
            console.log('   npm run migrate');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyMigration();
