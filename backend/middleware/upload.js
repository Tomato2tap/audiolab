const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const ApiError = require('../middleware/ApiError');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, (file.fieldname || 'file') + '-' + uniqueSuffix + ext);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new ApiError(400, '❌ Aucun fichier ou mimetype invalide'), false);
  }

  const ext = path.extname(file.originalname || '');
  const isMimeAllowed = config.ALLOWED_MIME_TYPES.has(file.mimetype);
  const isExtAllowed = config.ALLOWED_EXTENSIONS.has(ext);

  if (isMimeAllowed && isExtAllowed) {
    cb(null, true);
  } else {
    cb(new ApiError(
      400,
      `❌ Type de fichier non supporté: mimetype=${file.mimetype}, extension=${ext}`
    ), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

module.exports = upload;
