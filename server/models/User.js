const mongoose = require('mongoose');

const CompletedActivitySchema = new mongoose.Schema({
  activityId: String,
  tripId: String,
  rating: Number,
  notes: String,
  completedAt: Date
}, { _id: false });

const AccessibilitySchema = new mongoose.Schema({
  mobilityAssistance: { type: Boolean, default: false },
  visualImpairment: { type: Boolean, default: false },
  hearingImpairment: { type: Boolean, default: false }
}, { _id: false });

const FriendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String // pending, accepted
}, { _id: false });

const UserSchema = new mongoose.Schema({
  // Basic Info
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profilePicture: { type: String, default: null },
  dateOfBirth: { type: Date },
  country: { type: String },
  phoneNumber: { type: String },

  // Travel Preferences
  travelStyle: {
    type: String,
    enum: ['luxury', 'budget', 'mid-range', 'backpacker', 'family', 'business'],
    default: 'mid-range'
  },
  interests: [{
    type: String,
    enum: ['museums', 'food', 'nightlife', 'outdoor', 'shopping', 'culture', 'history', 'art', 'sports', 'wellness']
  }],
  dietaryRestrictions: [String],
  accessibility: AccessibilitySchema,

  // Travel Buddy Personality
  buddyPersonality: {
    type: String,
    enum: ['enthusiastic', 'calm', 'adventurous', 'practical', 'funny', 'informative'],
    default: 'enthusiastic'
  },
  communicationStyle: {
    type: String,
    enum: ['casual', 'formal', 'friendly', 'professional'],
    default: 'friendly'
  },

  // App Usage & Learning
  totalTrips: { type: Number, default: 0 },
  totalDestinations: { type: Number, default: 0 },
  favoriteDestinations: [String],
  completedActivities: [CompletedActivitySchema],

  // Social Features
  friends: [FriendSchema],
  isPublicProfile: { type: Boolean, default: false },
  shareTripsPublically: { type: Boolean, default: false },

  // Account Management
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLoginAt: Date,
  loginStreak: { type: Number, default: 0 },

  // Subscription & Features
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  subscriptionExpiresAt: Date,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema); 