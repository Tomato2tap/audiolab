const express = require("express");
const router = express.Router();

const audioController = require("../controllers/audioController");
const upload = require("../middleware/upload");

// Upload d'un fichier audio
router.post("/upload", upload.single("file"), audioController.uploadAudio);

// Lancer le traitement
router.post("/process/:id", audioController.processAudio);

// Vérifier le statut
router.get("/status/:id", audioController.getAudioStatus);

module.exports = router;
