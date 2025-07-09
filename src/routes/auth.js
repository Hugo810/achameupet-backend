const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const usuarioValidator = require('../utils/validators/usuarioValidator');

// Rota de registro
router.post('/registro', 
  // usuarioValidator.validateCadastro, // Descomente depois de criar
  authController.registrar
);

// Rota de login
router.post('/login', authController.login);

module.exports = router;