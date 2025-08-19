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

// API routes
app.use('/api/audio', audioRoutes);

// Serve processed files
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Catch-all pour le frontend
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
