const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absensi_wajah',
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

module.exports = connection;
