const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { ApiError } = require('../middleware/errorHandler');

class FileService {
  constructor() {
    this.supabase = createClient(
      config.SUPABASE.URL,
      config.SUPABASE.ANON_KEY
    );
    this.initialized = this.initializeBuckets();
  }

  async initializeBuckets() {
    try {
      // Vérifier et créer les buckets si nécessaire
      const { data: buckets, error } = await this.supabase
        .storage
        .listBuckets();

      if (error) throw error;

      const bucketNames = buckets.map(b => b.name);
      
      if (!bucketNames.includes(config.SUPABASE.UPLOAD_BUCKET)) {
        await this.createBucket(config.SUPABASE.UPLOAD_BUCKET);
      }

      if (!bucketNames.includes(config.SUPABASE.OUTPUT_BUCKET)) {
        await this.createBucket(config.SUPABASE.OUTPUT_BUCKET);
      }

      console.log('✅ Buckets Supabase initialisés');
    } catch (error) {
      console.error('❌ Erreur initialisation Supabase:', error);
      throw ApiError.internalError('Erreur configuration du stockage');
    }
  }

  async createBucket(bucketName) {
    const { error } = await this.supabase
      .storage
      .createBucket(bucketName, {
        public: false,
        fileSizeLimit: config.MAX_FILE_SIZE
      });

    if (error) throw error;
    console.log(`✅ Bucket créé: ${bucketName}`);
  }

  async uploadFile(bucketName, fileBuffer, fileName, mimeType = 'audio/mpeg') {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Erreur upload Supabase:', error);
      throw ApiError.internalError('Erreur lors de l\'upload du fichier');
    }
  }

  async downloadFile(bucketName, fileName) {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .download(fileName);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Erreur download Supabase:', error);
      throw ApiError.notFound('Fichier non trouvé');
    }
  }

  async getSignedUrl(bucketName, fileName, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Erreur génération URL signée:', error);
      throw ApiError.internalError('Erreur génération lien de téléchargement');
    }
  }

  async deleteFile(bucketName, fileName) {
    try {
      const { error } = await this.supabase
        .storage
        .from(bucketName)
        .remove([fileName]);

      if (error) throw error;

      console.log(`🗑️ Fichier supprimé: ${fileName}`);
      return true;
    } catch (error) {
      console.warn('⚠️ Impossible de supprimer le fichier:', error.message);
      return false;
    }
  }

  async fileExists(bucketName, fileName) {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .list('', {
          limit: 1,
          offset: 0,
          search: fileName
        });

      if (error) throw error;

      return data.length > 0 && data.some(file => file.name === fileName);
    } catch {
      return false;
    }
  }

  async processFile(fileBuffer, originalName) {
    try {
      // Validation du fichier
      if (fileBuffer.length > config.MAX_FILE_SIZE) {
        throw ApiError.badRequest(`Fichier trop volumineux. Maximum: ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Génération d'un nom de fichier unique
      const fileExt = '.mp3'; // Forcer l'extension MP3 pour la sortie
      const baseName = this.sanitizeFileName(originalName.replace(/\.[^/.]+$/, ""));
      const uid = uuidv4().substring(0, 8);
      const outputName = `${baseName}_${uid}${fileExt}`;

      // Traitement du fichier (simulation)
      const processedBuffer = await this.processAudio(fileBuffer);

      // Upload vers Supabase
      await this.uploadFile(
        config.SUPABASE.OUTPUT_BUCKET, 
        processedBuffer, 
        outputName,
        'audio/mpeg'
      );

      console.log(`✅ Fichier traité et uploadé: ${outputName}`);
      return outputName;

    } catch (error) {
      console.error('❌ Erreur traitement fichier:', error);
      throw error;
    }
  }

  async processAudio(audioBuffer) {
    // Simulation de traitement audio
    // Dans une vraie implémentation, utilisez FFmpeg ou une lib audio
    // Pour l'instant, on retourne le buffer tel quel
    return audioBuffer;
  }

  sanitizeFileName(name) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 100);
  }

  async getFileInfo(bucketName, fileName) {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .list('', {
          search: fileName
        });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Fichier non trouvé');

      return data[0];
    } catch (error) {
      throw ApiError.notFound('Information fichier non disponible');
    }
  }
}

// Instance singleton
module.exports = new FileService();
