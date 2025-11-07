const express = require('express');
const Service = require('../models/Service');
const Incident = require('../models/Incident');
const StatusHistory = require('../models/StatusHistory');
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
    
    // Log initial status to history
    await StatusHistory.create({
      serviceId: service._id,
      status: service.status,
      userId: service.userId,
      timestamp: service.createdAt,
    });
    
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
    
    // Log status change to history if status changed
    if (status && oldStatus !== service.status) {
      await StatusHistory.create({
        serviceId: service._id,
        status: service.status,
        userId: service.userId,
      });
      
      // Emit Socket.io event
      if (req.app.locals.emitServiceUpdate) {
        req.app.locals.emitServiceUpdate(service.userId.toString(), service._id.toString(), service.status);
      }
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

    // Log status change to history
    await StatusHistory.create({
      serviceId: service._id,
      status: service.status,
      userId: service.userId,
    });

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

    // Delete all status history for this service
    await StatusHistory.deleteMany({ serviceId: service._id });

    await Service.deleteOne({ _id: service._id });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get uptime metrics for a service
router.get('/:id/uptime', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query; // 24h, 7d, 30d, 90d

    const service = await Service.findOne({ _id: id, userId: req.user._id });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Calculate time range
    const now = new Date();
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get status history
    const history = await StatusHistory.find({
      serviceId: id,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    // Calculate uptime percentage
    let operationalTime = 0;
    let degradedTime = 0;
    let downTime = 0;
    let totalTime = now.getTime() - Math.max(startDate.getTime(), service.createdAt.getTime());

    if (history.length === 0) {
      // No history, use current status
      const timeSinceCreation = now.getTime() - service.createdAt.getTime();
      if (service.status === 'operational') {
        operationalTime = timeSinceCreation;
      } else if (service.status === 'degraded') {
        degradedTime = timeSinceCreation;
      } else {
        downTime = timeSinceCreation;
      }
    } else {
      // Calculate time for each status period
      for (let i = 0; i < history.length; i++) {
        const current = history[i];
        const next = history[i + 1];
        const periodStart = current.timestamp.getTime();
        const periodEnd = next ? next.timestamp.getTime() : now.getTime();
        const periodDuration = periodEnd - periodStart;

        if (current.status === 'operational') {
          operationalTime += periodDuration;
        } else if (current.status === 'degraded') {
          degradedTime += periodDuration;
        } else {
          downTime += periodDuration;
        }
      }
    }

    const uptimePercentage = totalTime > 0 ? ((operationalTime / totalTime) * 100).toFixed(2) : 100;
    const degradedPercentage = totalTime > 0 ? ((degradedTime / totalTime) * 100).toFixed(2) : 0;
    const downtimePercentage = totalTime > 0 ? ((downTime / totalTime) * 100).toFixed(2) : 0;

    // Get hourly data for the last 24 hours for graph
    const hourlyData = [];
    const hours = period === '24h' ? 24 : (period === '7d' ? 7 * 24 : (period === '30d' ? 30 * 24 : 90 * 24));
    const intervalMs = (now.getTime() - startDate.getTime()) / hours;

    for (let i = 0; i < hours; i++) {
      const hourStart = new Date(startDate.getTime() + i * intervalMs);
      const hourEnd = new Date(startDate.getTime() + (i + 1) * intervalMs);
      
      // Find status at this hour
      const statusAtHour = history
        .filter(h => h.timestamp <= hourEnd)
        .sort((a, b) => b.timestamp - a.timestamp)[0] || { status: service.status };
      
      hourlyData.push({
        time: hourStart.toISOString(),
        status: statusAtHour.status,
        uptime: statusAtHour.status === 'operational' ? 100 : (statusAtHour.status === 'degraded' ? 50 : 0),
      });
    }

    res.json({
      serviceId: id,
      period,
      uptimePercentage: parseFloat(uptimePercentage),
      degradedPercentage: parseFloat(degradedPercentage),
      downtimePercentage: parseFloat(downtimePercentage),
      totalTime,
      operationalTime,
      degradedTime,
      downTime,
      hourlyData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get uptime metrics for all services
router.get('/uptime/all', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const services = await Service.find({ userId: req.user._id });
    
    const uptimeData = await Promise.all(
      services.map(async (service) => {
        const now = new Date();
        let startDate;
        switch (period) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const history = await StatusHistory.find({
          serviceId: service._id,
          timestamp: { $gte: startDate },
        }).sort({ timestamp: 1 });

        let operationalTime = 0;
        let totalTime = now.getTime() - Math.max(startDate.getTime(), service.createdAt.getTime());

        if (history.length === 0) {
          operationalTime = service.status === 'operational' ? totalTime : 0;
        } else {
          for (let i = 0; i < history.length; i++) {
            const current = history[i];
            const next = history[i + 1];
            const periodStart = current.timestamp.getTime();
            const periodEnd = next ? next.timestamp.getTime() : now.getTime();
            const periodDuration = periodEnd - periodStart;

            if (current.status === 'operational') {
              operationalTime += periodDuration;
            }
          }
        }

        const uptimePercentage = totalTime > 0 ? ((operationalTime / totalTime) * 100).toFixed(2) : 100;

        return {
          serviceId: service._id,
          serviceName: service.name,
          uptimePercentage: parseFloat(uptimePercentage),
        };
      })
    );

    res.json({ period, services: uptimeData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

