const express = require('express');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all incidents for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.user._id })
      .populate('serviceId', 'name description')
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new incident
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, status, serviceId } = req.body;

    if (!title || !message || !serviceId) {
      return res.status(400).json({ message: 'Title, message, and serviceId are required' });
    }

    // Verify service belongs to user
    const service = await Service.findOne({ _id: serviceId, userId: req.user._id });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const incident = new Incident({
      title,
      message,
      status: status || 'investigating',
      serviceId,
      userId: req.user._id,
    });

    await incident.save();
    await incident.populate('serviceId', 'name description');
    
    // Emit Socket.io event
    if (req.app.locals.emitIncidentUpdate) {
      req.app.locals.emitIncidentUpdate(incident.userId.toString(), incident);
    }
    
    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an incident
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, message, status } = req.body;
    const incident = await Incident.findOne({ _id: req.params.id, userId: req.user._id });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (title) incident.title = title;
    if (message) incident.message = message;
    if (status) {
      if (!['investigating', 'identified', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      incident.status = status;
    }

    await incident.save();
    await incident.populate('serviceId', 'name description');
    
    // Emit Socket.io event
    if (req.app.locals.emitIncidentUpdate) {
      req.app.locals.emitIncidentUpdate(incident.userId.toString(), incident);
    }
    
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an incident
router.delete('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findOne({ _id: req.params.id, userId: req.user._id });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await Incident.deleteOne({ _id: incident._id });
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

