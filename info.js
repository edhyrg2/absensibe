const mysql = require('mysql2');
require('dotenv').config();

// Konfigurasi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absensi_wajah'
};

async function showSystemInfo() {
    console.log('📊 Sistem Absensi Wajah - Informasi Database');
    console.log('='.repeat(50));

    let connection;

    try {
        connection = mysql.createConnection(dbConfig);

        // Informasi database
        console.log('\n🏢 Informasi Database:');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User: ${dbConfig.user}`);

        // Statistik tabel
        console.log('\n📋 Statistik Tabel:');
        const tables = ['karyawan', 'users', 'pengaturan_waktu', 'absensi', 'status_pintu'];

        for (const table of tables) {
            try {
                const [count] = await connection.promise().query(`SELECT COUNT(*) as total FROM ${table}`);
                console.log(`   ${table.padEnd(20)}: ${count[0].total} records`);
            } catch (error) {
                console.log(`   ${table.padEnd(20)}: Error - ${error.message}`);
            }
        }

        // Data karyawan
        console.log('\n👥 Daftar Karyawan:');
        try {
            const [karyawan] = await connection.promise().query(`
                SELECT nip, nama, jabatan, tim 
                FROM karyawan 
                WHERE deleted_at IS NULL 
                ORDER BY nip
            `);

            if (karyawan.length === 0) {
                console.log('   (Tidak ada data karyawan)');
            } else {
                karyawan.forEach(k => {
                    console.log(`   ${k.nip} - ${k.nama} (${k.jabatan}, ${k.tim})`);
                });
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }

        // Data user
        console.log('\n🔐 Daftar User:');
        try {
            const [users] = await connection.promise().query(`
                SELECT u.username, k.nama as nama_karyawan
                FROM users u
                LEFT JOIN karyawan k ON u.id_karyawan = k.id
                WHERE u.deleted_at IS NULL
                ORDER BY u.username
            `);

            if (users.length === 0) {
                console.log('   (Tidak ada data user)');
            } else {
                users.forEach(u => {
                    console.log(`   ${u.username} - ${u.nama_karyawan || 'Tidak terhubung dengan karyawan'}`);
                });
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }

        // Pengaturan waktu
        console.log('\n⏰ Pengaturan Waktu:');
        try {
            const [waktu] = await connection.promise().query(`
                SELECT nama, waktu_mulai, waktu_selesai
                FROM pengaturan_waktu
                WHERE deleted_at IS NULL
                ORDER BY waktu_mulai
            `);

            if (waktu.length === 0) {
                console.log('   (Tidak ada pengaturan waktu)');
            } else {
                waktu.forEach(w => {
                    console.log(`   ${w.nama}: ${w.waktu_mulai} - ${w.waktu_selesai}`);
                });
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }

        // Statistik absensi (7 hari terakhir)
        console.log('\n📈 Statistik Absensi (7 hari terakhir):');
        try {
            const [absensi] = await connection.promise().query(`
                SELECT 
                    DATE(tanggal) as tanggal,
                    COUNT(*) as total_absen,
                    COUNT(waktu_masuk) as total_masuk,
                    COUNT(waktu_keluar) as total_keluar
                FROM absensi
                WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(tanggal)
                ORDER BY tanggal DESC
            `);

            if (absensi.length === 0) {
                console.log('   (Tidak ada data absensi dalam 7 hari terakhir)');
            } else {
                absensi.forEach(a => {
                    console.log(`   ${a.tanggal}: ${a.total_absen} absen (${a.total_masuk} masuk, ${a.total_keluar} keluar)`);
                });
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }

        // Status pintu terkini
        console.log('\n🚪 Status Pintu Terkini:');
        try {
            const [statusPintu] = await connection.promise().query(`
                SELECT sp.nama_pintu, sp.status, sp.waktu_perubahan, k.nama as nama_karyawan
                FROM status_pintu sp
                LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
                WHERE sp.deleted_at IS NULL
                ORDER BY sp.waktu_perubahan DESC
            `);

            if (statusPintu.length === 0) {
                console.log('   (Tidak ada data status pintu)');
            } else {
                const pintuGrouped = {};
                statusPintu.forEach(sp => {
                    if (!pintuGrouped[sp.nama_pintu]) {
                        pintuGrouped[sp.nama_pintu] = sp;
                    }
                });

                Object.values(pintuGrouped).forEach(sp => {
                    const waktu = new Date(sp.waktu_perubahan).toLocaleString('id-ID');
                    const oleh = sp.nama_karyawan ? ` (oleh ${sp.nama_karyawan})` : '';
                    console.log(`   ${sp.nama_pintu}: ${sp.status.toUpperCase()} - ${waktu}${oleh}`);
                });
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }

        console.log('\n✅ Informasi sistem berhasil ditampilkan!');

    } catch (error) {
        console.error('❌ Error:', error.message);

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

showSystemInfo();
