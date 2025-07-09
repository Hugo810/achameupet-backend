const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Rota para cadastrar novo usuário
router.post('/', usuariosController.cadastrarUsuario);

module.exports = router;
