const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/auth');

router.post('/login', userController.login);
router.post('/', userController.createUser);
router.get('/verify-token', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Token valid', user: req.user });
});
router.use(verifyToken);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
module.exports = router;
