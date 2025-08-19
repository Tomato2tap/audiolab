const fileService = require('../services/fileService');
const { ApiError } = require('../middleware/errorHandler');

exports.processAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('Aucun fichier reçu');
    }

    // Lire le buffer du fichier
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    // Traiter le fichier avec Supabase
    const outputFileName = await fileService.processFile(fileBuffer, originalName);

    // Générer une URL signée pour le téléchargement
    const downloadUrl = await fileService.getSignedUrl(
      process.env.SUPABASE_OUTPUT_BUCKET || 'processed',
      outputFileName,
      3600 // 1 heure d'expiration
    );

    res.json({
      success: true,
      data: {
        download_url: downloadUrl,
        output_name: outputFileName,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadFile = async (req, res, next) => {
  try {
    const fileName = req.params.filename;

    // Vérifier si le fichier existe
    const fileExists = await fileService.fileExists(
      process.env.SUPABASE_OUTPUT_BUCKET || 'processed',
      fileName
    );

    if (!fileExists) {
      throw ApiError.notFound('Fichier non trouvé');
    }

    // Télécharger le fichier depuis Supabase
    const fileBuffer = await fileService.downloadFile(
      process.env.SUPABASE_OUTPUT_BUCKET || 'processed',
      fileName
    );

    // Envoyer le fichier
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileBuffer.size
    });

    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

exports.getFileStatus = async (req, res, next) => {
  try {
    const fileName = req.params.filename;

    const fileInfo = await fileService.getFileInfo(
      process.env.SUPABASE_OUTPUT_BUCKET || 'processed',
      fileName
    );

    res.json({
      success: true,
      data: {
        name: fileInfo.name,
        size: fileInfo.metadata.size,
        created_at: fileInfo.created_at,
        last_accessed: fileInfo.last_accessed_at
      }
    });
  } catch (error) {
    next(error);
  }
};
