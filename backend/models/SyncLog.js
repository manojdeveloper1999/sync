const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  operation: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'sync', 'error', 'info', 'warning']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['product', 'user', 'system', 'auth']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  source: {
    type: String,
    enum: ['api', 'web', 'system', 'sync'],
    default: 'web'
  },
  ipAddress: String,
  userAgent: String,
  duration: Number, // in milliseconds
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for better query performance
syncLogSchema.index({ createdAt: -1 });
syncLogSchema.index({ operation: 1, createdAt: -1 });
syncLogSchema.index({ entityType: 1, createdAt: -1 });
syncLogSchema.index({ level: 1, createdAt: -1 });
syncLogSchema.index({ userId: 1, createdAt: -1 });

// Static method to create log entry
syncLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating log entry:', error);
    throw error;
  }
};

module.exports = mongoose.model('SyncLog', syncLogSchema);