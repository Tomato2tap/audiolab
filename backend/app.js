require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import du middleware d'erreur correctement
const { errorHandler } = require('./middleware/errorHandler');

// Import des routes audio
const audioRoutes = require('./routes/audioRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/audio', audioRoutes);

// Serve static files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
