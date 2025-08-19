const AudioFile = require('../models/AudioFile');
const audioProcessing = require('../services/audioProcessing');
const ApiError = require('../utils/ApiError');
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

    // Simulation de traitement audio (remplacer par un vrai traitement)
    const processedFileName = await audioProcessing.process(audioFile);

    audioFile.processed = true;
    audioFile.processedPath = path.join(config.processedDir, processedFileName);
    await audioFile.save();

    res.json({
      success: true,
      message: 'Traitement audio terminé',
      data: {
        downloadUrl: `/processed/${processedFileName}`,
        outputName: `processed_${audioFile.originalName}`
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
        downloadUrl: audioFile.processed ? `/processed/${path.basename(audioFile.processedPath)}` : null
      }
    });
  } catch (error) {
    next(error);
  }
};