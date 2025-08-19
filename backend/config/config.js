const path = require("path");
const os = require("os");

module.exports = {
  // 📂 Dossiers de stockage
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, "../uploads"),
  processedDir: process.env.PROCESSED_DIR || path.join(__dirname, "../processed"),
  OUTPUT_DIR: process.env.OUTPUT_DIR || path.join(__dirname, "../outputs"),

  // ✅ Extensions autorisées
  allowedExtensions: new Set([".mp3", ".MP3"]),

  // ✅ Types MIME autorisés
  allowedMimeTypes: new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/x-mpeg",
    "audio/x-mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/x-flac",
    "audio/aac",
    "audio/x-m4a",
  ]),

  // 📦 Taille max des fichiers
  maxFileSize: process.env.MAX_FILE_SIZE || 50 * 1024 * 1024, // 50MB

  // ⚙️ Configuration du traitement audio
  audioProcessing: {
    BITRATE: "192k",
    SAMPLE_RATE: 44100,
    CHANNELS: 2,
  },
};
