const express = require("express");
const router = express.Router();
const audioController = require("../controllers/audioController");
const upload = require("../middleware/upload");

// 📥 Upload d'un fichier audio (vers Supabase Storage)
router.post("/upload", upload.single("file"), audioController.uploadAudio);

// ⚙️ (Optionnel) Traiter un fichier déjà uploadé
router.post("/process/:id", audioController.processAudio);

// 📊 Vérifier le statut ou récupérer les infos d'un fichier audio
router.get("/status/:id", audioController.getAudioStatus);

module.exports = router;
