const express = require('express');
const router = express.Router();
const muralController = require('../controllers/muralController');
const authMiddleware = require('../config/authMiddleware');

router.post('/', authMiddleware, muralController.postarMensagem);
router.get('/', muralController.listarMensagens);
router.get('/usuario/:usuarioId', muralController.listarMensagensPorUsuario);

module.exports = router;