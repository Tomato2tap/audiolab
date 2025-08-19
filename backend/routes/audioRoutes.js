const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const upload = require('../middleware/upload');

router.post('/upload', upload.single('file'), audioController.uploadAudio);
router.post('/process/:id', audioController.processAudio);
router.get('/status/:id', audioController.getAudioStatus);

module.exports = router;