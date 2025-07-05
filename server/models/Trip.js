const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: String,
  time: String,
  duration: String,
  cost: String,
  tips: String,
  category: String,
  latitude: Number,
  longitude: Number,
  rating: { type: Number, default: 0 },
  photos: [String],
  completed: { type: Boolean, default: false },
  completedAt: Date,
  // Enhanced fields for better UX
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags: [String],
  bookingRequired: { type: Boolean, default: false },
  bookingUrl: String,
  contactInfo: String,
  estimatedWaitTime: String,
  bestTimeToVisit: String,
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    childFriendly: { type: Boolean, default: true },
    petFriendly: { type: Boolean, default: false }
  }
}); // ✅ Removed { _id: false } to enable MongoDB ID generation

const DaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: String, required: true },
  theme: String,
  activities: [ActivitySchema],
  transportation: String,
  meals: String,
  accommodation: String,
  // Enhanced fields
  weather: String,
  budget: Number,
  notes: String,
  totalDistance: String,
  estimatedWalkingTime: String
}); // ✅ Removed { _id: false } to enable MongoDB ID generation

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  dailyItineraries: [DaySchema],
  notes: String,
  isPublic: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Enhanced trip metadata
  status: { type: String, enum: ['planning', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'planning' },
  totalBudget: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  groupSize: { type: Number, default: 1 },
  travelStyle: { type: String, enum: ['budget', 'mid-range', 'luxury'], default: 'mid-range' },
  tags: [String],
  coverImage: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  completedActivities: { type: Number, default: 0 },
  totalActivities: { type: Number, default: 0 },
  lastViewedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ userId: 1, status: 1 });
TripSchema.index({ destination: 1 });

// Pre-save middleware to calculate totals
TripSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total activities and completed activities
  let totalActivities = 0;
  let completedActivities = 0;
  
  this.dailyItineraries.forEach(day => {
    if (day.activities) {
      totalActivities += day.activities.length;
      completedActivities += day.activities.filter(activity => activity.completed).length;
    }
  });
  
  this.totalActivities = totalActivities;
  this.completedActivities = completedActivities;
  
  next();
});

module.exports = mongoose.model('Trip', TripSchema);