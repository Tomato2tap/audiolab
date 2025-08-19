const path = require('path');

// Vérification des variables d'environnement
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase non définies, utilisation des valeurs par défaut');
}

module.exports = {
  // Configuration Supabase avec valeurs par défaut sécurisées
  SUPABASE: {
    URL: process.env.SUPABASE_URL || 'https://default.supabase.co',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || 'default-anon-key',
    BUCKET_NAME: process.env.SUPABASE_BUCKET || 'audio-files',
    UPLOAD_BUCKET: process.env.SUPABASE_UPLOAD_BUCKET || 'uploads',
    OUTPUT_BUCKET: process.env.SUPABASE_OUTPUT_BUCKET || 'processed'
  },
  
  // Extensions autorisées
  ALLOWED_EXTENSIONS: new Set(['.mp3', '.MP3']),
  
  // Taille maximale des fichiers (20MB)
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024,
  
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
