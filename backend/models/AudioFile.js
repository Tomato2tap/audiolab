// backend/models/AudioFile.js
// ✅ Version sans mongoose (compatible Supabase)

class AudioFile {
  constructor({
    id,
    original_name,
    stored_name,
    path,
    processed_path = null,
    size,
    mimetype,
    processed = false,
    created_at = new Date(),
  }) {
    this.id = id;
    this.original_name = original_name;
    this.stored_name = stored_name;
    this.path = path;
    this.processed_path = processed_path;
    this.size = size;
    this.mimetype = mimetype;
    this.processed = processed;
    this.created_at = created_at;
  }
}

module.exports = AudioFile;
