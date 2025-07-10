// src/config/multerConfig.js
const multer = require('multer');

const MAX_UPLOAD_FILES = 5;
const UPLOAD_FILE_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ✅ Armazena os arquivos em memória (evita erro ENOENT)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (UPLOAD_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use apenas JPEG ou PNG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_UPLOAD_FILES }
});

// Middleware para tratamento de erros do multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: err.code === 'LIMIT_FILE_SIZE'
        ? `Tamanho máximo do arquivo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        : `Erro no upload: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors,
  MAX_UPLOAD_FILES
};
