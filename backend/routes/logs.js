const express = require('express');
const SyncLog = require('../models/SyncLog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get logs with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Add filters
    if (req.query.operation) filter.operation = req.query.operation;
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.userId) filter.userId = req.query.userId;
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Search in messages
    if (req.query.search) {
      filter.message = { $regex: req.query.search, $options: 'i' };
    }

    const logs = await SyncLog.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SyncLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get log by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const log = await SyncLog.findById(req.params.id)
      .populate('userId', 'username email');
    
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Get log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get log statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get counts for different periods
    const [
      totalLogs,
      todayLogs,
      yesterdayLogs,
      operationStats,
      levelStats,
      recentActivity
    ] = await Promise.all([
      SyncLog.countDocuments(),
      SyncLog.countDocuments({ createdAt: { $gte: today } }),
      SyncLog.countDocuments({ 
        createdAt: { 
          $gte: yesterday, 
          $lt: today 
        } 
      }),
      SyncLog.aggregate([
        {
          $group: {
            _id: '$operation',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      SyncLog.aggregate([
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      SyncLog.find()
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('operation entityType level message createdAt userId username')
    ]);

    res.json({
      overview: {
        total: totalLogs,
        today: todayLogs,
        yesterday: yesterdayLogs,
        change: todayLogs - yesterdayLogs
      },
      operations: operationStats,
      levels: levelStats,
      recentActivity
    });
  } catch (error) {
    console.error('Get log stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get logs by date range for charts
router.get('/stats/timeline', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const timeline = await SyncLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            level: '$level'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          levels: {
            $push: {
              level: '$_id.level',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ timeline });
  } catch (error) {
    console.error('Get timeline stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity logs
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await SyncLog.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SyncLog.countDocuments({ userId: req.params.userId });

    res.json({
      logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export logs as CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const filter = {};
    
    // Apply same filters as main logs endpoint
    if (req.query.operation) filter.operation = req.query.operation;
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.source) filter.source = req.query.source;
    
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const logs = await SyncLog.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(5000); // Limit for performance

    // Create CSV content
    const csvHeader = 'Date,Time,Level,Operation,Entity Type,Message,User,Source,IP Address\n';
    const csvRows = logs.map(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      const time = log.createdAt.toISOString().split('T')[1].split('.')[0];
      const user = log.userId ? log.userId.username : log.username || 'System';
      
      return [
        date,
        time,
        log.level || '',
        log.operation || '',
        log.entityType || '',
        `"${(log.message || '').replace(/"/g, '""')}"`,
        user,
        log.source || '',
        log.ipAddress || ''
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sync-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clean old logs (keep only last 30 days by default)
router.delete('/cleanup', auth, async (req, res) => {
  try {
    // Only allow admin users to clean logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const daysToKeep = parseInt(req.query.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await SyncLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    // Log the cleanup action
    await SyncLog.createLog({
      operation: 'delete',
      entityType: 'system',
      message: `Log cleanup completed: ${result.deletedCount} logs older than ${daysToKeep} days were deleted`,
      level: 'info',
      source: 'web',
      userId: req.user._id,
      username: req.user.username,
      details: { deletedCount: result.deletedCount, daysToKeep },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Log cleanup completed',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Log cleanup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;