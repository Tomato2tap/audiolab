const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { ApiError } = require('../middleware/errorHandler');

class FileService {
  constructor() {
    this.ensureDirectoriesExist();
  }

  async ensureDirectoriesExist() {
    try {
      await fs.mkdir(config.UPLOAD_DIR, { recursive: true });
      await fs.mkdir(config.OUTPUT_DIR, { recursive: true });
      console.log('📁 Dossiers de stockage créés avec succès');
    } catch (error) {
      console.error('❌ Erreur création des dossiers:', error);
      throw ApiError.internalError('Erreur configuration du stockage');
    }
  }

  async validateFileSize(filePath, maxSize = config.MAX_FILE_SIZE) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > maxSize) {
        await this.deleteFile(filePath);
        throw ApiError.badRequest(`Fichier trop volumineux. Maximum: ${maxSize / 1024 / 1024}MB`);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  async validateAudioFile(filePath) {
    // Ici vous pourriez ajouter une validation du fichier audio
    // en utilisant une librairie comme music-metadata
    try {
      // Simulation de validation
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw ApiError.badRequest('Fichier audio corrompu ou vide');
      }
      return true;
    } catch (error) {
      await this.deleteFile(filePath);
      throw error;
    }
  }

  async processFile(inputPath, originalName) {
    try {
      // Validation du fichier
      await this.validateFileSize(inputPath);
      await this.validateAudioFile(inputPath);

      // Génération d'un nom de fichier unique
      const fileExt = path.extname(originalName) || '.mp3';
      const baseName = path.parse(originalName).name;
      const uid = uuidv4().substring(0, 8);
      const outputName = `${this.sanitizeFileName(baseName)}_${uid}${fileExt}`;
      const outputPath = path.join(config.OUTPUT_DIR, outputName);

      // Traitement du fichier (simulation - à remplacer par du vrai traitement)
      await this.copyFileWithProcessing(inputPath, outputPath);

      // Nettoyage du fichier temporaire d'upload
      await this.deleteFile(inputPath);

      console.log(`✅ Fichier traité: ${outputName}`);
      return outputPath;

    } catch (error) {
      // Nettoyage en cas d'erreur
      await this.cleanupOnError(inputPath);
      throw error;
    }
  }

  async copyFileWithProcessing(sourcePath, destPath) {
    try {
      // Simulation de traitement audio
      // Dans une vraie implémentation, utilisez FFmpeg ou une lib audio
      const fileData = await fs.readFile(sourcePath);
      
      // Ici vous pourriez ajouter du traitement audio réel
      // Ex: const processedData = await this.processAudio(fileData);
      
      await fs.writeFile(destPath, fileData);
      
      return destPath;
    } catch (error) {
      throw ApiError.internalError('Erreur lors du traitement du fichier audio');
    }
  }

  async processAudio(audioBuffer) {
    // Placeholder pour le traitement audio réel
    // À implémenter avec FFmpeg, WebAudio API, ou une lib spécialisée
    return audioBuffer; // Retourne les données non modifiées pour l'instant
  }

  async deleteFile(filePath) {
    try {
      if (await this.fileExists(filePath)) {
        await fs.unlink(filePath);
        console.log(`🗑️ Fichier supprimé: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de supprimer le fichier:', error.message);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      throw ApiError.notFound('Fichier non trouvé');
    }
  }

  async cleanupOnError(filePath) {
    try {
      if (filePath && await this.fileExists(filePath)) {
        await this.deleteFile(filePath);
      }
    } catch (cleanupError) {
      console.error('❌ Erreur lors du nettoyage:', cleanupError);
    }
  }

  sanitizeFileName(name) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars
      .substring(0, 100); // Limit length
  }

  async getAvailableDiskSpace() {
    try {
      const stats = await fs.statfs(config.UPLOAD_DIR);
      return stats.bsize * stats.bfree;
    } catch (error) {
      console.warn('⚠️ Impossible de vérifier l\'espace disque:', error);
      return null;
    }
  }
}

// Instance singleton
module.exports = new FileService();