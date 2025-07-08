const db = require('../db');

// Get status pintu terkini (API publik - tanpa auth)
exports.getStatusPintuPublic = (req, res) => {
    const query = `
        SELECT sp.nama_pintu, sp.status, sp.waktu_perubahan, k.nama as nama_karyawan
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
        res.json({
            success: true,
            data: results[0],
            timestamp: new Date().toISOString()
        });
    });
};

// Get status pintu berdasarkan nama pintu (API publik)
exports.getStatusByNamaPintuPublic = (req, res) => {
    const { nama_pintu } = req.params;
    const query = `
        SELECT sp.nama_pintu, sp.status, sp.waktu_perubahan, sp.alasan, k.nama as nama_karyawan
        FROM status_pintu sp
        LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
        WHERE sp.nama_pintu = ? AND sp.deleted_at IS NULL
        ORDER BY sp.waktu_perubahan DESC
        LIMIT 1
    `;
    db.query(query, [nama_pintu], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Status pintu tidak ditemukan",
                data: null
            });
        }
        res.json({
            success: true,
            data: results[0],
            timestamp: new Date().toISOString()
        });
    });
};

// Get semua status pintu dengan status terkini masing-masing (API publik)
exports.getAllStatusPintuPublic = (req, res) => {
    const query = `
        SELECT sp1.nama_pintu, sp1.status, sp1.waktu_perubahan, sp1.alasan, k.nama as nama_karyawan
        FROM status_pintu sp1
        LEFT JOIN karyawan k ON sp1.id_karyawan_terakhir = k.id
        INNER JOIN (
            SELECT nama_pintu, MAX(waktu_perubahan) as max_waktu
            FROM status_pintu 
            WHERE deleted_at IS NULL
            GROUP BY nama_pintu
        ) sp2 ON sp1.nama_pintu = sp2.nama_pintu AND sp1.waktu_perubahan = sp2.max_waktu
        WHERE sp1.deleted_at IS NULL
        ORDER BY sp1.nama_pintu
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json({
            success: true,
            data: results,
            count: results.length,
            timestamp: new Date().toISOString()
        });
    });
};

// Update status pintu (API publik dengan kunci rahasia)
exports.updateStatusPintuPublic = (req, res) => {
    const { nama_pintu, status, api_key, alasan } = req.body;

    // Validasi API key sederhana (bisa diganti dengan sistem yang lebih aman)
    const validApiKey = process.env.DOOR_API_KEY || 'pintu-secret-2025';
    if (!api_key || api_key !== validApiKey) {
        return res.status(401).json({
            success: false,
            message: "API key tidak valid atau tidak disediakan"
        });
    }

    if (!nama_pintu || !status) {
        return res.status(400).json({
            success: false,
            message: "Nama pintu dan status wajib diisi"
        });
    }

    // Validasi status (hanya 'terbuka' atau 'tertutup')
    if (!['terbuka', 'tertutup'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status harus 'terbuka' atau 'tertutup'"
        });
    }

    // Cek apakah record pintu sudah ada
    const checkQuery = `
        SELECT id FROM status_pintu 
        WHERE nama_pintu = ? AND deleted_at IS NULL 
        ORDER BY waktu_perubahan DESC LIMIT 1
    `;

    db.query(checkQuery, [nama_pintu], (checkErr, checkResults) => {
        if (checkErr) {
            return res.status(500).json({
                success: false,
                message: "Database error saat mengecek status pintu",
                error: checkErr
            });
        }

        if (checkResults.length > 0) {
            // Record ada, lakukan UPDATE
            const updateQuery = `
                UPDATE status_pintu 
                SET status = ?, waktu_perubahan = NOW(), alasan = ?, id_karyawan_terakhir = NULL
                WHERE nama_pintu = ? AND deleted_at IS NULL
            `;

            db.query(updateQuery, [status, alasan || 'Update via API publik', nama_pintu], (err, result) => {
                if (err) return res.status(500).json({
                    success: false,
                    message: "Database error saat update",
                    error: err
                });

                res.json({
                    success: true,
                    message: `Status pintu '${nama_pintu}' berhasil diubah menjadi '${status}'`,
                    data: {
                        id: checkResults[0].id,
                        nama_pintu: nama_pintu,
                        status: status,
                        waktu_perubahan: new Date().toISOString(),
                        alasan: alasan || 'Update via API publik',
                        action: 'updated'
                    }
                });
            });
        } else {
            // Record tidak ada, lakukan INSERT (pertama kali)
            const insertQuery = `
                INSERT INTO status_pintu (nama_pintu, status, id_karyawan_terakhir, waktu_perubahan, alasan) 
                VALUES (?, ?, NULL, NOW(), ?)
            `;

            db.query(insertQuery, [nama_pintu, status, alasan || 'Insert awal via API publik'], (err, result) => {
                if (err) return res.status(500).json({
                    success: false,
                    message: "Database error saat insert",
                    error: err
                });

                res.json({
                    success: true,
                    message: `Status pintu '${nama_pintu}' berhasil dibuat dengan status '${status}'`,
                    data: {
                        id: result.insertId,
                        nama_pintu: nama_pintu,
                        status: status,
                        waktu_perubahan: new Date().toISOString(),
                        alasan: alasan || 'Insert awal via API publik',
                        action: 'created'
                    }
                });
            });
        }
    });
};

// Get history status pintu (API publik dengan limit)
exports.getHistoryStatusPintuPublic = (req, res) => {
    const { nama_pintu, limit = 10 } = req.query;

    // Batasi limit maksimal untuk API publik
    const maxLimit = Math.min(parseInt(limit) || 10, 50);

    let sql = `
        SELECT sp.nama_pintu, sp.status, sp.waktu_perubahan, sp.alasan, k.nama as nama_karyawan
        FROM status_pintu sp
        LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
        WHERE sp.deleted_at IS NULL
    `;
    const params = [];

    if (nama_pintu) {
        sql += ' AND sp.nama_pintu = ?';
        params.push(nama_pintu);
    }

    sql += ' ORDER BY sp.waktu_perubahan DESC LIMIT ?';
    params.push(maxLimit);

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({
            success: false,
            message: "Database error",
            error: err
        });

        res.json({
            success: true,
            data: results,
            count: results.length,
            limit: maxLimit,
            timestamp: new Date().toISOString()
        });
    });
};

// Health check untuk API status pintu
exports.healthCheck = (req, res) => {
    res.json({
        success: true,
        message: "API Status Pintu berjalan normal",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
};

// Update status pintu saja (simplified - hanya nama pintu dan status)
exports.updateStatusOnlyPublic = (req, res) => {
    const { nama_pintu, status, api_key } = req.body;

    // Validasi API key sederhana
    const validApiKey = process.env.DOOR_API_KEY || 'pintu-secret-2025';
    if (!api_key || api_key !== validApiKey) {
        return res.status(401).json({
            success: false,
            message: "API key tidak valid atau tidak disediakan"
        });
    }

    if (!nama_pintu || !status) {
        return res.status(400).json({
            success: false,
            message: "Nama pintu dan status wajib diisi"
        });
    }

    // Validasi status (hanya 'terbuka' atau 'tertutup')
    if (!['terbuka', 'tertutup'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status harus 'terbuka' atau 'tertutup'"
        });
    }

    // Cek apakah record pintu sudah ada
    const checkQuery = `
        SELECT id FROM status_pintu 
        WHERE nama_pintu = ? AND deleted_at IS NULL 
        ORDER BY waktu_perubahan DESC LIMIT 1
    `;

    db.query(checkQuery, [nama_pintu], (checkErr, checkResults) => {
        if (checkErr) {
            return res.status(500).json({
                success: false,
                message: "Database error saat mengecek status pintu",
                error: checkErr
            });
        }

        if (checkResults.length > 0) {
            // Record ada, lakukan UPDATE
            const updateQuery = `
                UPDATE status_pintu 
                SET status = ?, waktu_perubahan = NOW(), alasan = 'Update status via API'
                WHERE nama_pintu = ? AND deleted_at IS NULL
            `;

            db.query(updateQuery, [status, nama_pintu], (err, result) => {
                if (err) return res.status(500).json({
                    success: false,
                    message: "Database error saat update",
                    error: err
                });

                res.json({
                    success: true,
                    message: `Status pintu '${nama_pintu}' berhasil diubah menjadi '${status}'`,
                    data: {
                        id: checkResults[0].id,
                        nama_pintu: nama_pintu,
                        status: status,
                        waktu_perubahan: new Date().toISOString(),
                        action: 'updated'
                    }
                });
            });
        } else {
            // Record tidak ada, lakukan INSERT (pertama kali)
            const insertQuery = `
                INSERT INTO status_pintu (nama_pintu, status, waktu_perubahan, alasan) 
                VALUES (?, ?, NOW(), 'Insert awal status via API')
            `;

            db.query(insertQuery, [nama_pintu, status], (err, result) => {
                if (err) return res.status(500).json({
                    success: false,
                    message: "Database error saat insert",
                    error: err
                });

                res.json({
                    success: true,
                    message: `Status pintu '${nama_pintu}' berhasil dibuat dengan status '${status}'`,
                    data: {
                        id: result.insertId,
                        nama_pintu: nama_pintu,
                        status: status,
                        waktu_perubahan: new Date().toISOString(),
                        action: 'created'
                    }
                });
            });
        }
    });
};

// Trigger buka pintu saat wajah terdeteksi (untuk sistem absensi)
exports.triggerFaceDetected = (req, res) => {
    const { nama_pintu, id_karyawan, api_key, durasi_terbuka } = req.body;

    // Validasi API key
    const validApiKey = process.env.DOOR_API_KEY || 'pintu-secret-2025';
    if (!api_key || api_key !== validApiKey) {
        return res.status(401).json({
            success: false,
            message: "API key tidak valid atau tidak disediakan"
        });
    }

    // Default nama pintu jika tidak disediakan
    const targetPintu = nama_pintu || 'Pintu Utama';
    const durasiMenit = durasi_terbuka || 5; // Default 5 menit

    // VALIDASI: Hanya buka pintu jika wajah dikenali (ada id_karyawan)
    if (!id_karyawan) {
        return res.status(400).json({
            success: false,
            message: "Pintu tidak dibuka - wajah tidak dikenali",
            data: {
                nama_pintu: targetPintu,
                status: "tetap_tertutup",
                alasan: "Wajah terdeteksi tapi tidak dikenali dalam database",
                face_recognized: false
            }
        });
    }

    // Validasi apakah ID karyawan valid (opsional - cek di database)
    const checkKaryawanQuery = 'SELECT id, nama FROM karyawan WHERE id = ? AND deleted_at IS NULL';

    db.query(checkKaryawanQuery, [id_karyawan], (checkErr, karyawanResult) => {
        if (checkErr) {
            return res.status(500).json({
                success: false,
                message: "Error validasi karyawan",
                error: checkErr
            });
        }

        if (karyawanResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pintu tidak dibuka - ID karyawan tidak valid",
                data: {
                    nama_pintu: targetPintu,
                    status: "tetap_tertutup",
                    alasan: `ID Karyawan ${id_karyawan} tidak ditemukan dalam database`,
                    face_recognized: false
                }
            });
        }

        const karyawan = karyawanResult[0];

        // Query untuk insert status pintu terbuka (hanya jika karyawan valid)
        const insertQuery = `
            INSERT INTO status_pintu (nama_pintu, status, id_karyawan_terakhir, waktu_perubahan, alasan) 
            VALUES (?, 'terbuka', ?, NOW(), ?)
        `;

        const alasan = `Wajah dikenali - ${karyawan.nama} (ID: ${id_karyawan})`;

        db.query(insertQuery, [targetPintu, id_karyawan, alasan], (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error saat membuka pintu",
                    error: err
                });
            }

            // Set timeout untuk otomatis tutup pintu setelah durasi tertentu
            setTimeout(() => {
                const closeQuery = `
                    INSERT INTO status_pintu (nama_pintu, status, waktu_perubahan, alasan) 
                    VALUES (?, 'tertutup', NOW(), ?)
                `;

                db.query(closeQuery, [targetPintu, `Auto close setelah ${durasiMenit} menit`], (closeErr) => {
                    if (closeErr) {
                        console.error('Error auto close pintu:', closeErr);
                    } else {
                        console.log(`✅ Pintu ${targetPintu} otomatis tertutup setelah ${durasiMenit} menit`);
                    }
                });
            }, durasiMenit * 60 * 1000); // Convert menit ke milliseconds

            res.json({
                success: true,
                message: `Pintu '${targetPintu}' dibuka untuk ${karyawan.nama}`,
                data: {
                    id: result.insertId,
                    nama_pintu: targetPintu,
                    status: 'terbuka',
                    waktu_perubahan: new Date().toISOString(),
                    alasan: alasan,
                    auto_close_dalam: `${durasiMenit} menit`,
                    id_karyawan: id_karyawan,
                    nama_karyawan: karyawan.nama
                },
                info: {
                    message: `Pintu akan otomatis tertutup dalam ${durasiMenit} menit`,
                    face_detection: true,
                    face_recognized: true,
                    attendance_trigger: true
                }
            });
        });
    }); // Closing bracket untuk query validasi karyawan
};

// Get status Pintu Utama saja (API publik)
exports.getMainDoorStatus = (req, res) => {
    const query = `
        SELECT sp.nama_pintu, sp.status, sp.waktu_perubahan, sp.alasan, k.nama as nama_karyawan
        FROM status_pintu sp
        LEFT JOIN karyawan k ON sp.id_karyawan_terakhir = k.id
        WHERE sp.nama_pintu = 'Pintu Utama' AND sp.deleted_at IS NULL
        ORDER BY sp.waktu_perubahan DESC
        LIMIT 1
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({
            success: false,
            message: "Database error",
            error: err
        });

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Status Pintu Utama tidak ditemukan",
                data: null
            });
        }

        res.json({
            success: true,
            message: "Status Pintu Utama",
            data: results[0],
            timestamp: new Date().toISOString()
        });
    });
};

// Update status Pintu Utama saja (API publik dengan API key)
exports.updateMainDoorOnly = (req, res) => {
    const { status, api_key, alasan } = req.body;

    // Validasi API key
    const validApiKey = process.env.DOOR_API_KEY || 'pintu-secret-2025';
    if (!api_key || api_key !== validApiKey) {
        return res.status(401).json({
            success: false,
            message: "API key tidak valid atau tidak disediakan"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "Status wajib diisi"
        });
    }

    // Validasi status
    if (!['terbuka', 'tertutup'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status harus 'terbuka' atau 'tertutup'"
        });
    }

    // Cek apakah record Pintu Utama sudah ada
    const checkQuery = `
        SELECT id FROM status_pintu 
        WHERE nama_pintu = 'Pintu Utama' AND deleted_at IS NULL 
        ORDER BY waktu_perubahan DESC LIMIT 1
    `;

    db.query(checkQuery, (checkErr, checkResults) => {
        if (checkErr) {
            return res.status(500).json({
                success: false,
                message: "Database error saat mengecek Pintu Utama",
                error: checkErr
            });
        }

        const finalAlasan = alasan || `Update ${status} via API Pintu Utama`;

        if (checkResults.length > 0) {
            // Record ada, lakukan UPDATE
            const updateQuery = `
                UPDATE status_pintu 
                SET status = ?, waktu_perubahan = NOW(), alasan = ?
                WHERE nama_pintu = 'Pintu Utama' AND deleted_at IS NULL
            `;

            db.query(updateQuery, [status, finalAlasan], (err, result) => {
                if (err) return res.status(500).json({
                    success: false,
                    message: "Database error saat update Pintu Utama",
                    error: err
                });

                res.json({
                    success: true,
                    message: `Pintu Utama berhasil diubah menjadi '${status}'`,
                    data: {
                        id: checkResults[0].id,
                        nama_pintu: "Pintu Utama",
                        status: status,
                        waktu_perubahan: new Date().toISOString(),
                        alasan: finalAlasan,
                        action: 'updated'
                    }
                });
            });
        } else {
            // Record tidak ada, lakukan INSERT (pertama kali)
            const insertQuery = `
                INSERT INTO status_pintu (nama_pintu, status, waktu_perubahan, alasan) 
                VALUES ('Pintu Utama', ?, NOW(), ?)
            `;

            db.query(insertQuery, [status, finalAlasan], (err, result) => {
                if (err) return res.status(500).json({
                    success: false,
                    message: "Database error saat insert Pintu Utama",
                    error: err
                });

                res.json({
                    success: true,
                    message: `Pintu Utama berhasil dibuat dengan status '${status}'`,
                    data: {
                        id: result.insertId,
                        nama_pintu: "Pintu Utama",
                        status: status,
                        waktu_perubahan: new Date().toISOString(),
                        alasan: finalAlasan,
                        action: 'created'
                    }
                });
            });
        }
    });
};
