const fileService = require('../services/fileService');
const { ApiError } = require('../middleware/errorHandler');

console.log('✅ audioController chargé');

const processAudio = async (req, res, next) => {
  try {
    console.log('📤 Process audio appelé');
    
    if (!req.file) {
      throw ApiError.badRequest('Aucun fichier reçu');
    }

    // Vérifier que le fichier a un buffer
    if (!req.file.buffer) {
      throw ApiError.badRequest('Fichier corrompu ou vide');
    }

    const originalName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    console.log(`📁 Fichier reçu: ${originalName}, taille: ${fileBuffer.length} bytes`);

    // Traitement du fichier
    const outputFileName = await fileService.processFile(fileBuffer, originalName);
    
    // Générer l'URL de téléchargement
    const downloadUrl = await fileService.getSignedUrl('processed', outputFileName);

    // Réponse JSON VALIDE
    const responseData = {
      success: true,
      data: {
        download_url: downloadUrl,
        output_name: outputFileName,
        message: process.env.SUPABASE_URL ? 'Fichier traité avec Supabase' : 'Mode simulation activé'
      }
    };

    console.log('✅ Réponse:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Erreur processAudio:', error.message);
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const fileName = req.params.filename;
    console.log('📥 Download appelé:', fileName);

    // Simulation de contenu audio
    const audioContent = 'RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x08\x00\x00';
    const buffer = Buffer.from(audioContent, 'binary');

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);

  } catch (error) {
    console.error('❌ Erreur downloadFile:', error.message);
    next(error);
  }
};

// Route de test
const testAPI = (req, res) => {
  res.json({ 
    message: 'API AudioLab fonctionne!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

module.exports = {
  processAudio,
  downloadFile,
  testAPI
};
