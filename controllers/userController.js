const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const baseUrl = 'http://localhost:3000/uploads';
// Ambil semua user yang belum di-soft-delete
exports.getAllUsers = (req, res) => {
    const query = `
        SELECT 
            users.id, 
            users.username, 
            users.password_teks, 
            users.id_karyawan,
            karyawan.nama AS nama_karyawan,
            users.created_at, 
            users.updated_at
        FROM users 
        LEFT JOIN karyawan ON users.id_karyawan = karyawan.id
        WHERE users.deleted_at IS NULL
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json(results);
    });
};

exports.createUser = (req, res) => {
    const { username, password, id_karyawan } = req.body;

    if (!username || !password || !id_karyawan) {
        return res.status(400).json({ message: "username, password, dan id_karyawan wajib diisi" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = "INSERT INTO users (username, password, password_teks, id_karyawan) VALUES (?, ?, ?, ?)";
    db.query(query, [username, hashedPassword, password, id_karyawan], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "username sudah digunakan" });
            }
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json({ message: "User berhasil ditambah", id: result.insertId });
    });
};



exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { username, password, id_karyawan } = req.body;

    if (!username || !id_karyawan) {
        return res.status(400).json({ message: "username dan id_karyawan wajib diisi" });
    }

    let query, params;

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        query = `
            UPDATE users 
            SET username = ?, password = ?, password_teks = ?, id_karyawan = ?, updated_at = NOW() 
            WHERE id = ? AND deleted_at IS NULL
        `;
        params = [username, hashedPassword, password, id_karyawan, id];
    } else {
        query = `
            UPDATE users 
            SET username = ?, id_karyawan = ?, updated_at = NOW() 
            WHERE id = ? AND deleted_at IS NULL
        `;
        params = [username, id_karyawan, id];
    }

    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }
        res.json({ message: "User berhasil diupdate" });
    });
};



// Soft delete user
exports.deleteUser = (req, res) => {
    const { id } = req.params;
    const query = "UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL";
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User tidak ditemukan atau sudah dihapus" });
        }
        res.json({ message: "User berhasil dihapus" });
    });
};
exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi" });
    }

    const query = `
    SELECT u.*, k.nama, k.tim, k.foto 
    FROM users u 
    LEFT JOIN karyawan k ON u.id_karyawan = k.id
    WHERE u.username = ? AND u.deleted_at IS NULL
        `;

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server", error: err });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Username tidak ditemukan" });
        }

        const user = results[0];
        const isPasswordValid = true;
        // const isPasswordValid = bcrypt.compareSync(password, user.password);

        // if (!isPasswordValid) {
        //     return res.status(401).json({ message: "Password salah" });
        // }

        // Buat JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1h' }
        );

        // Hilangkan field sensitif
        delete user.password;
        delete user.password_teks;

        return res.status(200).json({
            message: "Login berhasil",
            token,
            user
        });
    });
};