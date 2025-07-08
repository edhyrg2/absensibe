const mysql = require('mysql2');
require('dotenv').config();

async function testConnection() {
    console.log('🔍 Testing database connections...');

    // Test koneksi tanpa database
    const connection1 = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        await connection1.promise().ping();
        console.log('✅ Basic MySQL connection: OK');

        // Test buat database
        await connection1.promise().query('CREATE DATABASE IF NOT EXISTS absensi_wajah');
        console.log('✅ Create database: OK');

        // Test list databases
        const [databases] = await connection1.promise().query('SHOW DATABASES');
        console.log('📊 Available databases:');
        databases.forEach(db => {
            const dbName = Object.values(db)[0];
            console.log(`   - ${dbName}`);
        });

    } catch (error) {
        console.error('❌ Basic connection failed:', error.message);
        return;
    } finally {
        await connection1.end();
    }

    // Test koneksi dengan database
    const connection2 = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'absensi_wajah'
    });

    try {
        await connection2.promise().ping();
        console.log('✅ Database-specific connection: OK');

        // Test list tables
        const [tables] = await connection2.promise().query('SHOW TABLES');
        console.log('📊 Tables in absensi_wajah:');
        if (tables.length === 0) {
            console.log('   (No tables found)');
        } else {
            tables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`   - ${tableName}`);
            });
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await connection2.end();
    }
}

testConnection();
