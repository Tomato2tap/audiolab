require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const audioRoutes = require('./routes/audioRoutes');

const app = express();

// 🔧 Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🎵 API audio
app.use('/api/audio', audioRoutes);

// 📂 Serve processed files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// 🌐 Serve frontend (React/Next ou autre)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// 🚦 Catch-all uniquement pour le frontend
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ❌ Gestion des erreurs
app.use(errorHandler);

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
