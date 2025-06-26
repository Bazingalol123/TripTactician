const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: String,
  data: mongoose.Schema.Types.Mixed, // Store trip data as a flexible object
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  trips: [tripSchema]
});

module.exports = mongoose.model('User', userSchema); 