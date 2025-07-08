const db = require('../db');
const path = require('path');
const fs = require('fs');
const baseUrl = 'http://localhost:3000/uploads';

// Helper hapus file foto lama
function deleteFile(filename) {
    if (!filename) return;
    const filepath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
}

exports.getAllKaryawan = (req, res) => {
    db.query('SELECT * FROM karyawan', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.createKaryawan = (req, res) => {
    const { nip, nama, jabatan, tim } = req.body;

    if (req.files && req.files.foto) {
        const file = req.files.foto;
        const filename = Date.now() + path.extname(file.name); // gunakan timestamp agar unik
        const foto = `${baseUrl}/${filename}`;
        const uploadPath = path.join(__dirname, '..', 'uploads', filename);

        file.mv(uploadPath, (err) => {
            if (err) return res.status(500).json({ error: 'Upload file gagal' });

            const sql = 'INSERT INTO karyawan (nip, nama, jabatan, foto, tim) VALUES (?, ?, ?, ?, ?)';
            db.query(sql, [nip, nama, jabatan, foto, tim], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Karyawan berhasil ditambahkan', id: result.insertId });
            });
        });
    } else {
        const sql = 'INSERT INTO karyawan (nip, nama, jabatan, foto, tim) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [nip, nama, jabatan, null, tim], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Karyawan berhasil ditambahkan', id: result.insertId });
        });
    }
};

exports.updateKaryawan = (req, res) => {
    const id = req.params.id;
    const { nip, nama, jabatan, tim } = req.body;

    db.query('SELECT foto FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

        const oldFotoUrl = results[0].foto;
        let newFotoUrl = oldFotoUrl;

        const updateDB = () => {
            const sql = 'UPDATE karyawan SET nip = ?, nama = ?, jabatan = ?, foto = ?, tim = ? WHERE id = ?';
            db.query(sql, [nip, nama, jabatan, newFotoUrl, tim, id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Karyawan berhasil diupdate' });
            });
        };

        if (req.files && req.files.foto) {
            // Hapus file lama
            if (oldFotoUrl) {
                const oldFilename = oldFotoUrl.split('/').pop();
                deleteFile(oldFilename);
            }

            const file = req.files.foto;
            const filename = Date.now() + path.extname(file.name);
            newFotoUrl = `${baseUrl}/${filename}`;
            const uploadPath = path.join(__dirname, '..', 'uploads', filename);

            file.mv(uploadPath, (err) => {
                if (err) return res.status(500).json({ error: 'Upload file gagal' });
                updateDB();
            });
        } else {
            updateDB();
        }
    });
};

exports.deleteKaryawan = (req, res) => {
    const id = req.params.id;

    // Ambil data foto terlebih dahulu
    db.query('SELECT foto FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

        const fotoUrl = results[0].foto;
        if (fotoUrl) {
            const filename = fotoUrl.split('/').pop();
            deleteFile(filename);
        }

        // Hapus data absensi yang terkait
        db.query('DELETE FROM absensi WHERE id_karyawan = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: 'Gagal menghapus absensi terkait' });

            // Setelah absensi dihapus, hapus karyawan
            db.query('DELETE FROM karyawan WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: 'Gagal menghapus karyawan' });
                res.json({ message: 'Karyawan dan data absensi berhasil dihapus' });
            });
        });
    });
};

