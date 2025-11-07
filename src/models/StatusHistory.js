const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['operational', 'degraded', 'down'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for efficient queries
statusHistorySchema.index({ serviceId: 1, timestamp: -1 });
statusHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);

