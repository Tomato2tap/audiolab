const mongoose = require('mongoose');

const audioFileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  storedName: {
    type: String,
    required: true,
    unique: true
  },
  path: {
    type: String,
    required: true
  },
  processedPath: String,
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AudioFile', audioFileSchema);