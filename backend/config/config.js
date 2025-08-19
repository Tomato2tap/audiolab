module.exports = {
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  processedDir: process.env.PROCESSED_DIR || 'processed',
  allowedAudioTypes: [
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'audio/x-wav', // WAV
    'audio/flac', // FLAC
    'audio/x-flac', // FLAC
    'audio/aac', // AAC
    'audio/x-m4a' // M4A
  ],
  maxFileSize: 50 * 1024 * 1024 // 50MB
};