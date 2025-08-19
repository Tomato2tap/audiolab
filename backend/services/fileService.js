const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { ApiError } = require('../middleware/errorHandler');

class FileService {
  constructor() {
    // Vérification des credentials Supabase
    if (!config.SUPABASE.URL || !config.SUPABASE.ANON_KEY || 
        config.SUPABASE.URL === 'https://default.supabase.co') {
      console.warn('⚠️ Configuration Supabase manquante - Mode simulation activé');
      this.supabase = null;
      this.isSimulationMode = true;
    } else {
      this.supabase = createClient(
        config.SUPABASE.URL,
        config.SUPABASE.ANON_KEY
      );
      this.isSimulationMode = false;
      this.initializeBuckets();
    }
  }

  async initializeBuckets() {
    if (this.isSimulationMode) return;
    
    try {
      const { data: buckets, error } = await this.supabase
        .storage
        .listBuckets();

      if (error) {
        console.warn('⚠️ Impossible de lister les buckets:', error.message);
        return;
      }

      const bucketNames = buckets.map(b => b.name);
      
      // Créer les buckets si nécessaire
      for (const bucket of [config.SUPABASE.UPLOAD_BUCKET, config.SUPABASE.OUTPUT_BUCKET]) {
        if (!bucketNames.includes(bucket)) {
          await this.createBucket(bucket);
        }
      }

      console.log('✅ Buckets Supabase initialisés');
    } catch (error) {
      console.error('❌ Erreur initialisation Supabase:', error.message);
    }
  }

  async createBucket(bucketName) {
    if (this.isSimulationMode) return;
    
    try {
      const { error } = await this.supabase
        .storage
        .createBucket(bucketName, {
          public: false,
          fileSizeLimit: config.MAX_FILE_SIZE
        });

      if (error) throw error;
      console.log(`✅ Bucket créé: ${bucketName}`);
    } catch (error) {
      console.warn('⚠️ Impossible de créer le bucket:', error.message);
    }
  }

  async uploadFile(bucketName, fileBuffer, fileName, mimeType = 'audio/mpeg') {
    if (this.isSimulationMode) {
      console.log(`📤 Simulation upload: ${fileName} to ${bucketName}`);
      return { path: fileName };
    }

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
      console.error('❌ Erreur upload Supabase:', error.message);
      throw ApiError.internalError('Erreur lors de l\'upload du fichier');
    }
  }

  async downloadFile(bucketName, fileName) {
    if (this.isSimulationMode) {
      console.log(`📥 Simulation download: ${fileName} from ${bucketName}`);
      // Retourner un buffer vide pour la simulation
      return Buffer.from('SIMULATION_CONTENT');
    }

    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .download(fileName);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur download Supabase:', error.message);
      throw ApiError.notFound('Fichier non trouvé');
    }
  }

  async getSignedUrl(bucketName, fileName, expiresIn = 3600) {
    if (this.isSimulationMode) {
      console.log(`🔗 Simulation signed URL: ${fileName}`);
      return `https://simulation.com/download/${fileName}`;
    }

    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Erreur génération URL signée:', error.message);
      throw ApiError.internalError('Erreur génération lien de téléchargement');
    }
  }

  // ... (le reste des méthodes reste similaire mais avec des checks de simulationMode)

  async processFile(fileBuffer, originalName) {
    try {
      if (fileBuffer.length > config.MAX_FILE_SIZE) {
        throw ApiError.badRequest(`Fichier trop volumineux. Maximum: ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      const fileExt = '.mp3';
      const baseName = this.sanitizeFileName(originalName.replace(/\.[^/.]+$/, ""));
      const uid = uuidv4().substring(0, 8);
      const outputName = `${baseName}_${uid}${fileExt}`;

      // Simulation de traitement
      const processedBuffer = await this.processAudio(fileBuffer);

      await this.uploadFile(
        config.SUPABASE.OUTPUT_BUCKET, 
        processedBuffer, 
        outputName,
        'audio/mpeg'
      );

      console.log(`✅ Fichier traité: ${outputName}`);
      return outputName;

    } catch (error) {
      console.error('❌ Erreur traitement fichier:', error.message);
      throw error;
    }
  }

  // ... autres méthodes
}

module.exports = new FileService();
