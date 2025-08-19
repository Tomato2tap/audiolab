require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import du middleware d'erreur
const { errorHandler } = require('./middleware/errorHandler');

// Import des routes audio
const audioRoutes = require('./routes/audioRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/audio', audioRoutes);

// Serve processed files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Ensure CSS, JS, assets are accessible
app.use('/css', express.static(path.join(frontendPath, 'css')));
app.use('/js', express.static(path.join(frontendPath, 'js')));
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// For any other route, send the frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
