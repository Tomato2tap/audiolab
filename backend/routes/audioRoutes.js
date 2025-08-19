const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// Debug: Vérifier que le middleware upload existe
console.log('Middleware upload:', typeof upload.single);

// Importation avec vérification
let audioController;
try {
  audioController = require('../controllers/audioController');
  console.log('✅ audioController chargé:', Object.keys(audioController));
} catch (error) {
  console.error('❌ Erreur chargement audioController:', error);
  process.exit(1);
}

// Vérification que les fonctions existent
if (!audioController.processAudio) {
  console.error('❌ processAudio non trouvé dans audioController');
  process.exit(1);
}

if (!audioController.downloadFile) {
  console.error('❌ downloadFile non trouvé dans audioController');
}

// Routes avec vérification
router.post('/process', upload.single('file'), audioController.processAudio);
router.get('/download/:filename', audioController.downloadFile);

// Route de test
router.get('/test', (req, res) => {
  res.json({ message: 'API fonctionne!', timestamp: new Date().toISOString() });
});

module.exports = router;
