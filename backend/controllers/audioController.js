const audioProcessing = require('../services/audioProcessing');
const ApiError = require('../middleware/ApiError');
const path = require('path');
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

// 📥 Upload audio (stockage direct dans Supabase Storage + metadata)
exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Aucun fichier téléchargé");
    }

    const fileName = `${uuidv4()}-${req.file.originalname}`;

    // Upload dans Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("audiofiles")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Enregistrement metadata dans table "audiofiles"
    const { data, error: dbError } = await supabase
      .from("audiofiles")
      .insert([
        {
          id: uuidv4(),
          original_name: req.file.originalname,
          stored_name: fileName,
          mimetype: req.file.mimetype,
          size: req.file.size,
          processed: false,
        },
      ])
      .select();

    if (dbError) throw dbError;

    res.status(201).json({
      success: true,
      message: "Fichier uploadé avec succès",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// ⚙️ Traitement audio
exports.processAudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer metadata
    const { data: file, error } = await supabase
      .from("audiofiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !file) {
      throw new ApiError(404, "Fichier audio non trouvé");
    }

    // Simuler un traitement audio
    const processedFileName = `processed_${file.stored_name}`;
    await audioProcessing.process(file); // ton service custom

    // Mettre à jour la table
    const { data: updated, error: updateError } = await supabase
      .from("audiofiles")
      .update({ processed: true, processed_path: processedFileName })
      .eq("id", id)
      .select();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: "Traitement audio terminé",
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// 📤 Vérifier statut + générer lien temporaire
exports.getAudioStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("audiofiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    // Générer un lien temporaire (1h)
    let download_url = null;
    if (data.processed_path || data.stored_name) {
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
