const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const ApiError = require('../middleware/ApiError');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, (file.fieldname || 'file') + '-' + uniqueSuffix + ext);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  // Vérification de sécurité : multer peut parfois envoyer un "file" incomplet
  if (!file || !file.mimetype) {
    return cb(new ApiError(400, '❌ Aucun fichier ou mimetype invalide'), false);
  }

  if (config.allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `❌ Type de fichier non supporté: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize || 20 * 1024 * 1024 // fallback 20 MB
  }
});

module.exports = upload;
