const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

// 🔧 Fonction utilitaire pour nettoyer le nom du fichier
const sanitizeFileName = (name) => {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_") // remplace caractères spéciaux par "_"
    .toLowerCase();
};

// 📥 Upload audio vers Supabase
exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    const safeName = sanitizeFileName(req.file.originalname);
    const fileName = `${uuidv4()}-${safeName}`;

    // 🔼 Upload du fichier brut dans Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("audiofiles")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // 💾 Insertion des métadonnées en base
    const { data, error: dbError } = await supabase
      .from("audiofiles")
      .insert([
        {
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
  } catch (err) {
    next(err);
  }
};

// ⚙️ Marquer un fichier comme "traité"
exports.processAudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("audiofiles")
      .update({ processed: true })
      .eq("id", id)
      .select();

    if (error || !data.length) {
      return res.status(404).json({ error: "Fichier introuvable ou erreur de traitement" });
    }

    res.json({
      success: true,
      message: "Fichier marqué comme traité",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};

// 📤 Vérifier statut + générer lien signé
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

    // 🔗 Générer un lien temporaire (1h)
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
  } catch (err) {
    next(err);
  }
};
