const db = require('../db');

// Get all status pintu (excluding soft deleted)
exports.getAllStatusPintu = (req, res) => {
    const query = `
        SELECT id, nama_pintu, status, id_karyawan_terakhir, waktu_perubahan, alasan, created_at, updated_at 
        FROM status_pintu 
        WHERE deleted_at IS NULL
        ORDER BY waktu_perubahan DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json(results);
    });
};

// Get status pintu saat ini (status terbaru)
exports.getStatusPintuTerkini = (req, res) => {
    const query = `
        SELECT sp.*, k.nama as nama_karyawan
        FROM status_pintu sp
        LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
        WHERE sp.deleted_at IS NULL
        ORDER BY sp.waktu_perubahan DESC
        LIMIT 1
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Tidak ada data status pintu" });
        }
        res.json(results[0]);
    });
};

// Get status pintu berdasarkan nama pintu
exports.getStatusByNamaPintu = (req, res) => {
    const { nama_pintu } = req.params;
    const query = `
        SELECT sp.*, k.nama as nama_karyawan
        FROM status_pintu sp
        LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
        WHERE sp.nama_pintu = ? AND sp.deleted_at IS NULL
        ORDER BY sp.waktu_perubahan DESC
        LIMIT 1
    `;
    db.query(query, [nama_pintu], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Status pintu tidak ditemukan" });
        }
        res.json(results[0]);
    });
};

// Update status pintu
exports.updateStatusPintu = (req, res) => {
    const { nama_pintu, status, id_karyawan, alasan } = req.body;

    if (!nama_pintu || !status || !id_karyawan) {
        return res.status(400).json({ message: "Nama pintu, status, dan id_karyawan wajib diisi" });
    }

    // Validasi status (hanya 'terbuka' atau 'tertutup')
    if (!['terbuka', 'tertutup'].includes(status)) {
        return res.status(400).json({ message: "Status harus 'terbuka' atau 'tertutup'" });
    }

    const query = `
        INSERT INTO status_pintu (nama_pintu, status, id_karyawan_terakhir, waktu_perubahan, alasan) 
        VALUES (?, ?, ?, NOW(), ?)
    `;
    db.query(query, [nama_pintu, status, id_karyawan, alasan || null], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json({
            message: `Status pintu '${nama_pintu}' berhasil diubah menjadi '${status}'`,
            id: result.insertId
        });
    });
};

// Otomatis buka pintu berdasarkan absensi
exports.otomatisBukaPintu = (req, res) => {
    const { id_karyawan } = req.body;

    if (!id_karyawan) {
        return res.status(400).json({ message: "ID karyawan wajib diisi" });
    }

    // Cek apakah karyawan sudah absen hari ini
    const cekAbsenSql = `
        SELECT * FROM absensi 
        WHERE id_karyawan = ? AND DATE(tanggal) = CURDATE()
    `;

    db.query(cekAbsenSql, [id_karyawan], (err, absenResults) => {
        if (err) return res.status(500).json({ error: err.message });

        if (absenResults.length === 0) {
            return res.status(400).json({
                message: 'Karyawan belum melakukan absensi hari ini. Pintu tidak dapat dibuka otomatis.'
            });
        }

        // Buka pintu otomatis
        const insertSql = `
            INSERT INTO status_pintu (nama_pintu, status, id_karyawan_terakhir, waktu_perubahan, alasan) 
            VALUES (?, ?, ?, NOW(), ?)
        `;

        db.query(insertSql, [
            'Pintu Utama',
            'terbuka',
            id_karyawan,
            'Otomatis dibuka setelah absensi'
        ], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                message: 'Pintu berhasil dibuka otomatis setelah absensi',
                status: 'terbuka',
                id: result.insertId
            });
        });
    });
};

// Get history status pintu
exports.getHistoryStatusPintu = (req, res) => {
    const { start_date, end_date, nama_pintu } = req.query;

    let sql = `
        SELECT sp.*, k.nama as nama_karyawan
        FROM status_pintu sp
        LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
        WHERE sp.deleted_at IS NULL
    `;
    const params = [];

    if (nama_pintu) {
        sql += ' AND sp.nama_pintu = ?';
        params.push(nama_pintu);
    }

    if (start_date && end_date) {
        sql += ' AND DATE(sp.waktu_perubahan) BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    sql += ' ORDER BY sp.waktu_perubahan DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Soft delete status pintu
exports.deleteStatusPintu = (req, res) => {
    const { id } = req.params;
    const query = `
        UPDATE status_pintu 
        SET deleted_at = NOW() 
        WHERE id = ? AND deleted_at IS NULL
    `;
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Status pintu tidak ditemukan atau sudah dihapus" });
        }
        res.json({ message: "Status pintu berhasil dihapus" });
    });
};
