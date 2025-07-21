const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Add filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.vendor) filter.vendor = req.query.vendor;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new product
router.post('/', [
  auth,
  body('name').notEmpty().trim().escape(),
  body('sku').notEmpty().trim().escape(),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('category').notEmpty().trim().escape(),
  body('stock').isNumeric().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: req.body.sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    const product = new Product({
      ...req.body,
      lastSyncedAt: new Date(),
      syncSource: 'manual'
    });

    await product.save();

    // Log product creation
    await SyncLog.createLog({
      operation: 'create',
      entityType: 'product',
      entityId: product._id,
      message: `Product created: ${product.name} (SKU: ${product.sku})`,
      level: 'success',
      source: 'web',
      userId: req.user._id,
      username: req.user.username,
      details: { sku: product.sku, name: product.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/:id', [
  auth,
  body('name').optional().trim().escape(),
  body('sku').optional().trim().escape(),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('category').optional().trim().escape(),
  body('stock').optional().isNumeric().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if new SKU already exists (if SKU is being changed)
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    const originalData = { ...product.toObject() };
    
    // Update product
    Object.assign(product, req.body);
    product.lastSyncedAt = new Date();
    
    await product.save();

    // Log product update with changes
    const changes = {};
    Object.keys(req.body).forEach(key => {
      if (originalData[key] !== req.body[key]) {
        changes[key] = {
          from: originalData[key],
          to: req.body[key]
        };
      }
    });

    await SyncLog.createLog({
      operation: 'update',
      entityType: 'product',
      entityId: product._id,
      message: `Product updated: ${product.name} (SKU: ${product.sku})`,
      level: 'success',
      source: 'web',
      userId: req.user._id,
      username: req.user.username,
      details: { changes, sku: product.sku, name: product.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Log product deletion
    await SyncLog.createLog({
      operation: 'delete',
      entityType: 'product',
      message: `Product deleted: ${product.name} (SKU: ${product.sku})`,
      level: 'warning',
      source: 'web',
      userId: req.user._id,
      username: req.user.username,
      details: { sku: product.sku, name: product.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk sync products
router.post('/sync', auth, async (req, res) => {
  try {
    const { products, source = 'api' } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: 'Products must be an array' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      total: products.length
    };

    const startTime = Date.now();

    // Log sync start
    await SyncLog.createLog({
      operation: 'sync',
      entityType: 'product',
      message: `Bulk sync started for ${products.length} products`,
      level: 'info',
      source,
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    for (const productData of products) {
      try {
        const existingProduct = await Product.findOne({ sku: productData.sku });
        
        if (existingProduct) {
          // Update existing product
          Object.assign(existingProduct, productData);
          existingProduct.lastSyncedAt = new Date();
          existingProduct.syncSource = source;
          existingProduct.syncStatus = 'synced';
          await existingProduct.save();
          results.updated++;

          await SyncLog.createLog({
            operation: 'update',
            entityType: 'product',
            entityId: existingProduct._id,
            message: `Product synced (updated): ${productData.name} (SKU: ${productData.sku})`,
            level: 'success',
            source,
            userId: req.user._id,
            username: req.user.username
          });
        } else {
          // Create new product
          const newProduct = new Product({
            ...productData,
            lastSyncedAt: new Date(),
            syncSource: source,
            syncStatus: 'synced'
          });
          await newProduct.save();
          results.created++;

          await SyncLog.createLog({
            operation: 'create',
            entityType: 'product',
            entityId: newProduct._id,
            message: `Product synced (created): ${productData.name} (SKU: ${productData.sku})`,
            level: 'success',
            source,
            userId: req.user._id,
            username: req.user.username
          });
        }
      } catch (error) {
        results.errors++;
        await SyncLog.createLog({
          operation: 'error',
          entityType: 'product',
          message: `Sync error for product SKU ${productData.sku}: ${error.message}`,
          level: 'error',
          source,
          userId: req.user._id,
          username: req.user.username,
          details: { error: error.message, productData }
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log sync completion
    await SyncLog.createLog({
      operation: 'sync',
      entityType: 'product',
      message: `Bulk sync completed: ${results.created} created, ${results.updated} updated, ${results.errors} errors`,
      level: results.errors > 0 ? 'warning' : 'success',
      source,
      userId: req.user._id,
      username: req.user.username,
      details: results,
      duration,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Sync completed',
      results,
      duration
    });
  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({ message: 'Server error during sync' });
  }
});

// Get product categories
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product vendors
router.get('/vendors/list', auth, async (req, res) => {
  try {
    const vendors = await Product.distinct('vendor');
    res.json({ vendors: vendors.filter(v => v) }); // Filter out null/undefined
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;