const path = require('path');
const os = require('os');

module.exports = {
  // Dossiers de stockage
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
  OUTPUT_DIR: process.env.OUTPUT_DIR || path.join(__dirname, '../outputs'),
  
  // Extensions autorisées
  ALLOWED_EXTENSIONS: new Set(['.mp3', '.MP3']),
  
  // Taille maximale des fichiers (20MB)
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 20 * 1024 * 1024,
  
  // Types MIME autorisés
  ALLOWED_MIME_TYPES: new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/x-mpeg',
    'audio/x-mp3'
  ]),
  
  // Configuration du traitement audio
  AUDIO_PROCESSING: {
    BITRATE: '192k',
    SAMPLE_RATE: 44100,
    CHANNELS: 2
  }
};
