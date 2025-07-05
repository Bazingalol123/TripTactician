const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  rating: Number,
  photos: [String],
  completed: { type: Boolean, default: false },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema); 