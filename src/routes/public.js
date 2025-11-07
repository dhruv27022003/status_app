const express = require('express');
const Service = require('../models/Service');
const Incident = require('../models/Incident');
const User = require('../models/User');

const router = express.Router();

// Get public status page data for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all services for this user
    const services = await Service.find({ userId }).select('name description status createdAt').sort({ createdAt: -1 });

    // Get all active incidents (not resolved) for this user
    const incidents = await Incident.find({ 
      userId, 
      status: { $ne: 'resolved' } 
    })
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });

    // Calculate overall status
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'operational';

    res.json({
      user: {
        id: user._id,
        name: user.name,
      },
      overallStatus,
      services,
      incidents,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

