require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const cors = require('cors');
const audioRoutes = require('./routes/audioRoutes');
const { errorHandler } = require('./middleware/errorHandler'); // Importation correcte

// Vérification des variables d'environnement
console.log('✅ Variables d\'environnement:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'défini' : 'non défini');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/audio', audioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler); // Utilisation correcte

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
