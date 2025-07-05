const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/authMiddleware');
const { tripRateLimit } = require('../middleware/rateLimiter');
const tripController = require('../controllers/tripController');

// Get all trips for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({ trips });
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get a specific trip by ID
router.get('/:id', authMiddleware, tripRateLimit, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Invalid trip ID format: ${req.params.id}`);
      return res.status(400).json({ error: 'Invalid trip ID format' });
    }

    const trip = await Trip.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!trip) {
      console.log(`Trip not found: ${req.params.id} for user: ${req.user.id}`);
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json({ trip });
  } catch (error) {
    console.error('Failed to fetch trip:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }
    
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create a new trip
router.post('/', authMiddleware, async (req, res) => {
  const createStartTime = Date.now();
  console.log('💾 === TRIP CREATION REQUEST STARTED ===');
  console.log('⏰ Request received at:', new Date().toISOString());
  console.log('👤 User ID:', req.user.id);
  console.log('📋 Request body size:', JSON.stringify(req.body).length, 'characters');
  
  // Log basic trip info without overwhelming the logs
  const basicTripInfo = {
    title: req.body.title,
    destination: req.body.destination,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    dailyItinerariesCount: req.body.dailyItineraries?.length || 0,
    totalActivities: req.body.dailyItineraries?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0
  };
  console.log('📊 Trip summary:', basicTripInfo);
  
  try {
    console.log('🔄 Preparing trip data for database...');
    const tripData = {
      ...req.body,
      userId: req.user.id,
      status: 'planning', // Default status
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Creating new Trip document...');
    const dbStartTime = Date.now();
    
    const trip = new Trip(tripData);
    
    console.log('💾 Saving trip to MongoDB...');
    await trip.save();
    
    const dbEndTime = Date.now();
    const dbTime = dbEndTime - dbStartTime;
    console.log(`⏱️ Database save completed in ${dbTime}ms`);
    
    const createEndTime = Date.now();
    const totalTime = createEndTime - createStartTime;
    console.log(`⏱️ === TOTAL TRIP CREATION TIME: ${totalTime}ms ===`);
    console.log('✅ === TRIP CREATION COMPLETED SUCCESSFULLY ===');
    console.log('🆔 Created trip ID:', trip._id);
    
    res.status(201).json({ 
      success: true, 
      trip,
      message: 'Trip created successfully',
      processingTimeMs: totalTime,
      dbTimeMs: dbTime
    });
  } catch (error) {
    const createEndTime = Date.now();
    const totalTime = createEndTime - createStartTime;
    
    console.error('❌ === TRIP CREATION FAILED ===');
    console.error('❌ Error after', totalTime, 'ms:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Check for specific MongoDB errors
    if (error.name === 'ValidationError') {
      console.error('❌ MongoDB Validation Error:', error.errors);
      return res.status(400).json({ 
        error: 'Trip validation failed', 
        details: error.message,
        validationErrors: error.errors,
        processingTimeMs: totalTime
      });
    }
    
    if (error.code === 11000) {
      console.error('❌ MongoDB Duplicate Key Error');
      return res.status(400).json({ 
        error: 'Duplicate trip data', 
        details: error.message,
        processingTimeMs: totalTime
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create trip', 
      details: error.message,
      processingTimeMs: totalTime
    });
  }
});

// Update a trip
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json({ 
      success: true, 
      trip,
      message: 'Trip updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete a trip
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Trip deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// NEW ROUTES FOR RECOMMENDATIONS EDITING

// Add recommendation to trip
router.post('/:id/add-recommendation', authMiddleware, tripController.addRecommendationToTrip);

// Replace activity with recommendation
router.put('/:id/replace-activity', authMiddleware, tripController.replaceActivityWithRecommendation);

// Remove activity from trip
router.delete('/:id/remove-activity', authMiddleware, tripController.removeActivity);

// Reorder activities
router.put('/:id/reorder-activities', authMiddleware, tripController.reorderActivities);

module.exports = router; 