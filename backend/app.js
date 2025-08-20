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
// API routes
app.use('/api/audio', audioRoutes);

// Serve processed files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Serve frontend static files (HTML, CSS, JS, assets)
// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Catch-all: for any other route, serve the frontend index.html
// Catch-all pour le frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
