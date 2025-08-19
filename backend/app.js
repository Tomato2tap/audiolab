require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const audioRoutes = require('./routes/audioRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🎵 API audio
app.use('/api/audio', audioRoutes);

// 📂 Serve processed files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// ❌ Pas de frontend → on supprime le catch-all

// 🔧 Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
