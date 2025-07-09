const express = require('express');
const router = express.Router();
const animaisController = require('../controllers/animaisController');
const authMiddleware = require('../config/authMiddleware');
const upload = require('../config/multerConfig');

// Rotas existentes
router.post('/', 
  authMiddleware,
  upload.array('fotos', 3),
  animaisController.cadastrarAnimal
);

router.get('/proximos', 
  authMiddleware,
  animaisController.buscarAnimaisProximos
);

// Nova rota que estava causando o erro - VERIFIQUE:
router.get('/:id', 
  authMiddleware,
  animaisController.buscarAnimalPorId // Certifique-se que este método existe no controller
);

module.exports = router;