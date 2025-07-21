const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  images: [{
    url: String,
    alt: String
  }],
  tags: [String],
  vendor: {
    type: String,
    trim: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  syncSource: {
    type: String,
    enum: ['manual', 'api', 'csv', 'xml'],
    default: 'manual'
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error'],
    default: 'synced'
  },
  syncErrors: [{
    field: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ lastSyncedAt: 1 });

module.exports = mongoose.model('Product', productSchema);