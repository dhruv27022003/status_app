const express = require('express');
const Service = require('../models/Service');
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all services for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new service
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const service = new Service({
      name,
      description: description || '',
      status: status || 'operational',
      userId: req.user._id,
    });

    await service.save();
    
    // Emit Socket.io event
    if (req.app.locals.emitServiceUpdate) {
      req.app.locals.emitServiceUpdate(service.userId.toString(), service._id.toString(), service.status);
    }
    
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a service
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const service = await Service.findOne({ _id: req.params.id, userId: req.user._id });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const oldStatus = service.status;
    
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (status) {
      if (!['operational', 'degraded', 'down'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      service.status = status;
    }

    await service.save();
    
    // Emit Socket.io event if status changed
    if (status && oldStatus !== service.status && req.app.locals.emitServiceUpdate) {
      req.app.locals.emitServiceUpdate(service.userId.toString(), service._id.toString(), service.status);
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update service status only
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['operational', 'degraded', 'down'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (operational, degraded, down)' });
    }

    const service = await Service.findOne({ _id: req.params.id, userId: req.user._id });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.status = status;
    await service.save();

    // Emit Socket.io event
    if (req.app.locals.emitServiceUpdate) {
      req.app.locals.emitServiceUpdate(service.userId.toString(), service._id.toString(), service.status);
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a service
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, userId: req.user._id });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Delete all incidents associated with this service
    await Incident.deleteMany({ serviceId: service._id });

    await Service.deleteOne({ _id: service._id });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

