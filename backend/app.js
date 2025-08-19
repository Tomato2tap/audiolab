require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { errorHandler } = require("./middleware/errorHandler");
const audioRoutes = require("./routes/audioRoutes");

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API routes
app.use("/api/audio", audioRoutes);

// ✅ (Optionnel) Serve processed files (si tu continues à les garder en local)
// ⚠️ Si tout passe par Supabase Storage, tu peux supprimer cette ligne
app.use("/processed", express.static(path.join(__dirname, "processed")));

// ✅ Serveur frontend (si ton frontend est build dans /frontend)
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// ✅ Catch-all → sert index.html pour React/Next.js/Vue SPA
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendPath, "index.html"));
  }
});

// ✅ Error handler middleware
app.use(errorHandler);

// ✅ Lancement serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
