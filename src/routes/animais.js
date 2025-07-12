const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const { upload, handleUploadErrors, MAX_UPLOAD_FILES } = require('../config/multerConfig');
const { validateWithPhotos } = require('../utils/validators/animalValidator');
const animaisController = require('../controllers/animaisController');

// Healthcheck (sempre primeiro)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Animais API',
    timestamp: new Date().toISOString()
  });
});

// Rotas fixas antes das dinâmicas
router.get('/meus', authMiddleware, animaisController.listarAnimaisDoUsuario);

router.get('/proximos',
  authMiddleware,
  (req, res, next) => {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros latitude e longitude são obrigatórios'
      });
    }
    next();
  },
  animaisController.buscarAnimaisProximos
);

// POST / - Cadastrar animal
router.post('/',
  authMiddleware,
  upload.array('fotos', MAX_UPLOAD_FILES),
  handleUploadErrors,
  (req, res, next) => {
    const { error } = validateWithPhotos(req.body, req.files || []);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map(detail => detail.message)
      });
    }
    next();
  },
  animaisController.cadastrarAnimal
);

// PUT /:id - Atualizar animal
router.put('/:id',
  authMiddleware,
  upload.array('fotos', MAX_UPLOAD_FILES),
  handleUploadErrors,
  (req, res, next) => {
    const { error } = validateWithPhotos(req.body, req.files || []);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map(detail => detail.message)
      });
    }
    next();
  },
  animaisController.atualizarAnimal
);

// GET /:id - Buscar animal por ID
router.get('/:id',
  authMiddleware,
  (req, res, next) => {
    if (!req.params.id || req.params.id.length !== 28) {
      return res.status(400).json({
        success: false,
        error: 'ID deve conter exatamente 28 caracteres'
      });
    }
    next();
  },
  animaisController.buscarAnimalPorId
);

// DELETE /:id - Remover animal
router.delete('/:id',
  authMiddleware,
  (req, res, next) => {
    if (!req.params.id || req.params.id.length !== 28) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    next();
  },
  animaisController.removerAnimal
);

module.exports = router;
