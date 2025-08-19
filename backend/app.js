require('dotenv').config({ path: '../.env' }); // Chemin correct pour le .env
const express = require('express');
const path = require('path');
const cors = require('cors');
const audioRoutes = require('./routes/audioRoutes');
const { errorHandler } = require('./middleware/errorHandler');

// Vérification des variables d'environnement REQUISES
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingEnvVars);
  console.error('💡 Assurez-vous de les définir dans Render > Environment');
  process.exit(1);
}

console.log('✅ Variables d\'environnement chargées:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'défini' : 'non défini',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'défini' : 'non défini'
});

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
    timestamp: new Date().toISOString(),
    supabase: process.env.SUPABASE_URL ? 'configuré' : 'non configuré'
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
