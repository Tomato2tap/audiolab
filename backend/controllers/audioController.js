const AudioFile = require('../models/AudioFile');
const audioProcessing = require('../services/audioProcessing');
const ApiError = require('../middleware/ApiError');
const path = require('path');
const config = require('../config/config');

exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Aucun fichier téléchargé');
    }

    const audioFile = new AudioFile({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    await audioFile.save();

    // Renvoie JSON avec l'ID pour traitement ultérieur
    res.status(201).json({
      success: true,
      message: 'Fichier téléchargé avec succès',
      data: {
        id: audioFile._id,
        originalName: audioFile.originalName
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.processAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audioFile = await AudioFile.findById(id);

    if (!audioFile) {
      throw new ApiError(404, 'Fichier audio non trouvé');
    }

    // Traitement audio (remplacer par ton vrai traitement)
    const processedFileName = await audioProcessing.process(audioFile);

    audioFile.processed = true;
    audioFile.processedPath = path.join(config.processedDir, processedFileName);
    await audioFile.save();

    // Retour JSON compatible frontend
    res.json({
      success: true,
      message: 'Traitement audio terminé',
      data: {
        download_url: `/processed/${processedFileName}`,
        output_name: `processed_${audioFile.originalName}`
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAudioStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audioFile = await AudioFile.findById(id);

    if (!audioFile) {
      throw new ApiError(404, 'Fichier audio non trouvé');
    }

    res.json({
      success: true,
      data: {
        status: audioFile.processed ? 'processed' : 'processing',
        download_url: audioFile.processed ? `/processed/${path.basename(audioFile.processedPath)}` : null
      }
    });
  } catch (error) {
    next(error);
  }
};
