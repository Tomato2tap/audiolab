// backend/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const audioRoutes = require("./routes/audioRoutes");
const ApiError = require("./middleware/ApiError");

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/audio", audioRoutes);

// Middleware pour 404
app.use((req, res, next) => {
  next(new ApiError(404, "Route non trouvée"));
});

// Middleware global d'erreurs
app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err);

  // Si c’est une ApiError, on garde son code + message
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});

module.exports = app;
