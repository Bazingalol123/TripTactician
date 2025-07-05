const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  photos: [String],
  notes: String,
  rating: Number,
  location: {
    lat: Number,
    lng: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memory', MemorySchema); 