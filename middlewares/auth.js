const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    // Format header biasanya: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token tidak valid' });
        }

        // Simpan data user hasil decode token ke req.user supaya bisa dipakai di controller
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
