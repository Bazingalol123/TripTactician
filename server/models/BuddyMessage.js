const mongoose = require('mongoose');

const BuddyMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  sender: { type: String, enum: ['user', 'buddy'], required: true },
  message: { type: String, required: true },
  context: String,
  suggestions: [String],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BuddyMessage', BuddyMessageSchema); 