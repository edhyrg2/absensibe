const db = require('../db');
const fs = require('fs');
const path = require('path');

// Helper function untuk update status pintu otomatis saat wajah terdeteksi
function updateStatusPintuOtomatis(id_karyawan, alasan) {
    // Query untuk mendapatkan nama karyawan
    const getKaryawanSql = 'SELECT nama FROM karyawan WHERE id = ? AND deleted_at IS NULL';
    db.query(getKaryawanSql, [id_karyawan], (err, karyawanResults) => {
        const namaKaryawan = (err || karyawanResults.length === 0) ?
            `ID: ${id_karyawan}` : karyawanResults[0].nama;

        const detailAlasan = `${alasan} - ${namaKaryawan} (ID: ${id_karyawan})`;

        // Cek apakah record Pintu Utama sudah ada
        const checkStatusSql = 'SELECT id FROM status_pintu WHERE nama_pintu ="Pintu Utama" AND deleted_at IS NULL ORDER BY waktu_perubahan DESC LIMIT 1';
        db.query(checkStatusSql, ['Pintu Utama'], (err, statusResults) => {
            if (err) {
                console.error('Error checking status pintu:', err);
                return;
            }

            if (statusResults.length > 0) {
                // UPDATE existing record
                const updateStatusSql = 'UPDATE status_pintu SET status =? , waktu_perubahan = NOW(), alasan =?, id_karyawan_terakhir = ? WHERE id=1 AND deleted_at IS NULL';
                db.query(updateStatusSql, ['terbuka', detailAlasan, id_karyawan], (err) => {
                    if (!err) {
                        console.log(`✅ Pintu dibuka otomatis: ${detailAlasan}`);

                        // Auto close setelah 5 menit
                        setTimeout(() => {
                            const closeStatusSql = 'UPDATE status_pintu SET status ="tertutup", waktu_perubahan = NOW(), alasan = ?, id_karyawan_terakhir = NULL WHERE  deleted_at IS NULL';
                            db.query(closeStatusSql, ['tertutup', 'Auto close setelah absensi', 'Pintu Utama'], (err) => {
                                if (!err) console.log('🔒 Pintu otomatis tertutup setelah 5 menit');
                            });
                        }, 5 * 60 * 1000); // 5 menit
                    } else {
                        console.error('Error updating status pintu:', err);
                    }
                });
            } else {
                // INSERT new record (first time)
                const insertStatusSql = 'INSERT INTO status_pintu (nama_pintu, status, id_karyawan_terakhir, waktu_perubahan, alasan) VALUES (?, ?, ?, NOW(), ?)';
                db.query(insertStatusSql, ['Pintu Utama', 'terbuka', id_karyawan, detailAlasan], (err) => {
                    if (!err) {
                        console.log(`✅ Pintu dibuka otomatis (first time): ${detailAlasan}`);

                        // Auto close setelah 5 menit
                        setTimeout(() => {
                            const updateStatusSql = 'UPDATE status_pintu SET status = ?, waktu_perubahan = NOW(), alasan = ?, id_karyawan_terakhir = NULL WHERE nama_pintu = ? AND deleted_at IS NULL';
                            db.query(updateStatusSql, ['tertutup', 'Auto close setelah absensi', 'Pintu Utama'], (err) => {
                                if (!err) console.log('🔒 Pintu otomatis tertutup setelah 5 menit');
                            });
                        }, 5 * 60 * 1000); // 5 menit
                    } else {
                        console.error('Error inserting status pintu:', err);
                    }
                });
            }
        });
    });
}

// Fungsi untuk mencatat absensi
exports.absenMasuk = (req, res) => {
    const { id_karyawan, foto, id_waktu } = req.body;
    const now = new Date();
    const tanggal = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const waktu = now.toTimeString().split(' ')[0]; // "HH:mm:ss"

    // Ambil nama dari pengaturan_waktu
    const waktuSql = 'SELECT * FROM pengaturan_waktu WHERE id = ?';
    db.query(waktuSql, [id_waktu], (err, waktuResults) => {
        if (err || waktuResults.length === 0) {
            return res.status(400).json({ error: true, message: 'Waktu tidak valid' });
        }

        const namaWaktu = waktuResults[0].nama;

        // Cek apakah sudah absen hari ini
        const cekSql = 'SELECT * FROM absensi WHERE id_karyawan = ? AND DATE(tanggal) = ?';
        db.query(cekSql, [id_karyawan, tanggal], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            // Simpan foto base64 ke file di folder uploads/absensi
            let fotoPath = null;
            if (foto) {
                const base64Data = foto.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');

                const folderPath = path.join(__dirname, '..', 'uploads', 'absensi');
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                const waktuFormatted = `${tanggal}-${now.toTimeString().split(' ')[0].replace(/:/g, '-')}`;

                const filename = `${id_karyawan}-${waktuFormatted}.jpg`;
                fotoPath = path.join('uploads', 'absensi', filename);

                fs.writeFileSync(path.join(__dirname, '..', fotoPath), buffer);
            }

            if (namaWaktu === 'Jam Pulang') {
                if (results.length === 0) {
                    // Tidak ada absen masuk, INSERT dengan waktu_keluar
                    const insertSql = 'INSERT INTO absensi (id_karyawan, tanggal, waktu_keluar, foto_keluar) VALUES (?, ?, ?, ?)';
                    db.query(insertSql, [id_karyawan, tanggal, waktu, fotoPath], (err) => {
                        if (err) return res.status(500).json({ error: err.message });

                        // Update status pintu otomatis setelah absen pulang berhasil
                        updateStatusPintuOtomatis(id_karyawan, 'Absen Pulang');

                        return res.json({
                            message: 'Absen pulang berhasil dicatat meskipun tanpa absen masuk',
                            fotoPath,
                            door_status: 'Pintu dibuka otomatis selama 5 menit'
                        });
                    });
                } else {
                    const absen = results[0];
                    if (absen.waktu_keluar) {
                        // SUDAH ABSEN PULANG - tetap buka pintu untuk akses
                        updateStatusPintuOtomatis(id_karyawan, 'Akses Ulang - Sudah Absen Pulang');

                        return res.status(200).json({
                            message: 'Anda sudah melakukan absen pulang hari ini.',
                            door_status: 'Pintu dibuka otomatis selama 5 menit untuk akses'
                        });
                    }
                    // Belum absen pulang, update waktu_keluar
                    const updateSql = 'UPDATE absensi SET waktu_keluar = ?, foto_keluar = ? WHERE id_karyawan = ? AND tanggal = ?';
                    db.query(updateSql, [waktu, fotoPath, id_karyawan, tanggal], (err) => {
                        if (err) return res.status(500).json({ error: err.message });

                        // Update status pintu otomatis setelah absen pulang berhasil
                        updateStatusPintuOtomatis(id_karyawan, 'Absen Pulang');

                        res.json({
                            message: 'Absen pulang berhasil dicatat',
                            fotoPath,
                            door_status: 'Pintu dibuka otomatis selama 5 menit'
                        });
                    });
                }
            } else {
                // INSERT absen masuk
                if (results.length > 0) {
                    // SUDAH ABSEN MASUK - tetap buka pintu untuk akses
                    updateStatusPintuOtomatis(id_karyawan, 'Akses Ulang - Sudah Absen Masuk');

                    return res.status(200).json({
                        error: true,
                        message: 'Sudah absen masuk hari ini',
                        door_status: 'Pintu dibuka otomatis selama 5 menit untuk akses'
                    });
                }

                const insertSql = 'INSERT INTO absensi (id_karyawan, tanggal, waktu_masuk, foto_masuk) VALUES (?, ?, ?, ?)';
                db.query(insertSql, [id_karyawan, tanggal, waktu, fotoPath], (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    // Update status pintu otomatis setelah absen masuk berhasil
                    updateStatusPintuOtomatis(id_karyawan, 'Absen Masuk');

                    res.json({
                        message: 'Absen masuk berhasil dicatat',
                        fotoPath,
                        door_status: 'Pintu dibuka otomatis selama 5 menit'
                    });
                });
            }
        });
    });
};


// Fungsi untuk mendapatkan rekap absensi semua karyawan
exports.getRekapAbsensi = (req, res) => {
    let { start, end } = req.query;
    let sql = `
      SELECT 
            a.id,
            a.id_karyawan,
            k.nama,
            DATE_FORMAT(a.tanggal, '%Y-%m-%d') AS tanggal,
            a.waktu_masuk,
            a.waktu_keluar,
            a.foto_masuk,
            a.foto_keluar,
            k.tim,
            a.note
      FROM absensi a
      JOIN karyawan k ON a.id_karyawan = k.id
    `;

    const params = [];

    if (start && end) {
        start = `${start} 00:00:00`;
        end = `${end} 23:59:59`;
        sql += ' WHERE a.tanggal BETWEEN ? AND ?';
        params.push(start, end);
    }

    sql += ' ORDER BY a.tanggal DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.createAbsen = (req, res) => {
    const { tanggal, waktu_masuk, waktu_keluar, note, id_karyawan } = req.body;

    if (!tanggal || !waktu_masuk || !waktu_keluar || !note || !id_karyawan) {
        return res.status(400).json({ message: "tanggal, waktu masuk, waktu keluar, note dan karyawan wajib diisi" });
    }

    const query = "INSERT INTO absensi (id_karyawan, tanggal, waktu_masuk, waktu_keluar, note) VALUES (?, ?, ?, ?,?)";
    db.query(query, [id_karyawan, tanggal, waktu_masuk, waktu_keluar, note], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json({ message: "Absensi berhasil ditambah", id: result.insertId });
    });
};


exports.updateAbsen = (req, res) => {
    const id = req.params.id;
    let { waktu_masuk, waktu_keluar, note } = req.body;
    waktu_masuk = formatTime(waktu_masuk);
    waktu_keluar = formatTime(waktu_keluar);

    // Validasi input minimal, bisa dikembangkan sesuai kebutuhan
    if (!waktu_masuk && !waktu_keluar && !note) {
        return res.status(400).json({ error: true, message: 'Minimal satu data harus diupdate' });
    }

    // Siapkan query dan params dinamis agar fleksibel update apa saja yang diinginkan
    const fields = [];
    const params = [];

    if (waktu_masuk) {
        fields.push('waktu_masuk = ?');
        params.push(waktu_masuk);
    }

    if (waktu_keluar) {
        fields.push('waktu_keluar = ?');
        params.push(waktu_keluar);
    }
    if (note !== undefined) {
        fields.push('note = ?');
        params.push(note);
    }

    params.push(id);

    const sql = `UPDATE absensi SET ${fields.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: 'Data absensi tidak ditemukan' });
        }
        res.json({ message: 'Data absensi berhasil diperbarui' });
    });
};
function formatTime(timeStr) {
    // Jika sudah mengandung detik, kembalikan apa adanya
    if (!timeStr) return null;
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // Jika hanya jam:menit, tambahkan detik ":00"
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr + ':00';
    return null; // format tidak valid
}

