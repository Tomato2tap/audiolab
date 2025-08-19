const AudioFile = require("../models/AudioFile");
const audioProcessing = require("../services/audioProcessing");
const ApiError = require("../middleware/ApiError");
const path = require("path");
const config = require("../config/config");
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

// 📥 Upload audio
exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier téléchargé",
      });
    }

    const audioFile = new AudioFile({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    await audioFile.save();

    res.status(201).json({
      success: true,
      message: "Fichier téléchargé avec succès",
      data: {
        id: audioFile._id,
        originalName: audioFile.originalName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 📊 Traitement audio
exports.processAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audioFile = await AudioFile.findById(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: "Fichier audio non trouvé",
      });
    }

    const fileName = `${uuidv4()}-${audioFile.originalName}`;

    // Upload sur Supabase
    const { error: uploadError } = await supabase.storage
      .from("audiofiles")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({
        success: false,
        message: "Erreur upload Supabase",
        details: uploadError.message,
      });
    }

    // Traitement audio fictif
    const processedFileName = await audioProcessing.process(audioFile);

    // Sauvegarde en base Supabase
    const { data, error: dbError } = await supabase
      .from("audiofiles")
      .insert([
        {
          original_name: req.file.originalname,
          stored_name: fileName,
          mimetype: req.file.mimetype,
          size: req.file.size,
          processed: true,
        },
      ])
      .select();

    if (dbError) {
      return res.status(500).json({
        success: false,
        message: "Erreur d'insertion Supabase",
        details: dbError.message,
      });
    }

    audioFile.processed = true;
    audioFile.processedPath = path.join(config.processedDir, processedFileName);
    await audioFile.save();

    res.status(201).json({
      success: true,
      message: "Traitement audio terminé",
      data: {
        download_url: `/processed/${processedFileName}`,
        output_name: `processed_${audioFile.originalName}`,
        supabase_entry: data[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// 📤 Vérifier statut
exports.getAudioStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const audioFile = await AudioFile.findById(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        message: "Fichier audio non trouvé",
      });
    }

    const { data, error } = await supabase
      .from("audiofiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Fichier introuvable dans Supabase",
      });
    }

    // Générer un lien temporaire
    let download_url = null;
    if (data.stored_name) {
      const { data: signedUrl } = await supabase.storage
        .from("audiofiles")
        .createSignedUrl(data.stored_name, 3600);
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
