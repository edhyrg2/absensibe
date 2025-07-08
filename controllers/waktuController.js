const db = require('../db');

// Get all waktu (excluding soft deleted)
exports.getAllWaktu = (req, res) => {
    const query = `
        SELECT id, nama, waktu_mulai, waktu_selesai, created_at, updated_at 
        FROM pengaturan_waktu 
        WHERE deleted_at IS NULL
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json(results);
    });
};
exports.getWaktuSekarang = (req, res) => {
    const query = `
        SELECT id, nama, waktu_mulai, waktu_selesai, created_at, updated_at 
        FROM pengaturan_waktu 
        WHERE deleted_at IS NULL
          AND TIME(NOW()) BETWEEN waktu_mulai AND waktu_selesai
        LIMIT 1
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Tidak ada pengaturan waktu yang aktif saat ini" });
        }
        res.json(results[0]);
    });
};

// Create new waktu
exports.createWaktu = (req, res) => {
    const { nama, waktu_mulai, waktu_selesai } = req.body;

    if (!nama || !waktu_mulai || !waktu_selesai) {
        return res.status(400).json({ message: "Nama, waktu mulai dan waktu selesai wajib diisi" });
    }

    const query = `
        INSERT INTO pengaturan_waktu (nama, waktu_mulai, waktu_selesai) 
        VALUES (?, ?, ?)
    `;
    db.query(query, [nama, waktu_mulai, waktu_selesai], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json({ message: "Pengaturan waktu berhasil ditambah", id: result.insertId });
    });
};

// Update waktu
exports.updateWaktu = (req, res) => {
    const { id } = req.params;
    const { waktu_mulai, waktu_selesai } = req.body;

    if (!waktu_mulai || !waktu_selesai) {
        return res.status(400).json({ message: "waktu mulai dan waktu selesai wajib diisi" });
    }

    const query = `
        UPDATE pengaturan_waktu 
        SET waktu_mulai = ?, waktu_selesai = ?, updated_at = NOW() 
        WHERE id = ? AND deleted_at IS NULL
    `;
    db.query(query, [waktu_mulai, waktu_selesai, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pengaturan waktu tidak ditemukan" });
        }
        res.json({ message: "Pengaturan waktu berhasil diupdate" });
    });
};

// Soft delete waktu
exports.deleteWaktu = (req, res) => {
    const { id } = req.params;
    const query = `
        UPDATE pengaturan_waktu 
        SET deleted_at = NOW() 
        WHERE id = ? AND deleted_at IS NULL
    `;
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pengaturan waktu tidak ditemukan atau sudah dihapus" });
        }
        res.json({ message: "Pengaturan waktu berhasil dihapus" });
    });
};
