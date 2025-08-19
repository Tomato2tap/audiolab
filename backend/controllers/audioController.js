const AudioFile = require('../models/AudioFile');
const audioProcessing = require('../services/audioProcessing');
const ApiError = require('../middleware/ApiError');
const path = require('path');
const config = require('../config/config');
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

// 📥 Upload audio
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

// ⚙️ Traitement audio
exports.processAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audioFile = await AudioFile.findById(id);

    if (!audioFile) {
      throw new ApiError(404, 'Fichier audio non trouvé');
    }

    const fileName = `${uuidv4()}-${req.file.originalname}`;

    // Upload vers Supabase
    const { error: uploadError } = await supabase.storage
      .from("audiofiles")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Traitement audio (exemple)
    const processedFileName = await audioProcessing.process(audioFile);

    // Sauvegarde metadata dans la table
    const { data, error: dbError } = await supabase
      .from("audiofiles")
      .insert([{
        original_name: req.file.originalname,
        stored_name: fileName,
        mimetype: req.file.mimetype,
        size: req.file.size,
        processed: false,
      }])
      .select();

    if (dbError) throw dbError;

    audioFile.processed = true;
    audioFile.processedPath = path.join(config.processedDir, processedFileName);
    await audioFile.save();

    // Retour JSON
    res.status(201).json({
      success: true,
      message: 'Traitement audio terminé',
      data: {
        download_url: `/processed/${processedFileName}`,
        output_name: `processed_${audioFile.originalName}`,
        supabase_entry: data[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// 📤 Vérifier statut + générer lien
exports.getAudioStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audioFile = await AudioFile.findById(id);

    if (!audioFile) {
      throw new ApiError(404, 'Fichier audio non trouvé');
    }

    // Vérifie en base Supabase
    const { data, error } = await supabase
      .from("audiofiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    // Génère un lien temporaire (1h)
    let download_url = null;
    if (data.processed || data.stored_name) {
      const { data: signedUrl } = await supabase.storage
        .from("audiofiles")
        .createSignedUrl(data.processed_path || data.stored_name, 3600);
      download_url = signedUrl?.signedUrl || null;
    }

    res.json({
      success: true,
      data: {
        status: data.processed ? "processed" : "processing",
        download_url,
      },
    });
  } catch (error) {
    next(error);
  }
};
