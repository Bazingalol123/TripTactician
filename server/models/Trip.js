import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  destination: {
    name: String,
    placeId: String,
    coords: { lat: Number, lng: Number },
    country: String,
    timezone: String,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending_partner', 'generating', 'active', 'solo', 'archived'],
    default: 'solo',
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'partner'] },
    joinedAt: { type: Date, default: Date.now },
    preferencesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Preference' },
  }],
  candidates: [{
    placeId: String,
    name: String,
    coords: { lat: Number, lng: Number },
    category: String,
    priceLevel: Number,
    rating: Number,
    openingHours: mongoose.Schema.Types.Mixed,
    photos: [String],
    website: String,
    reservationsUrl: String,
    viatorProductId: String,
    bookingType: {
      type: String,
      enum: ['experience', 'restaurant', 'attraction', 'none'],
      default: 'none',
    },
  }],
  days: [{
    dayNumber: Number,
    date: Date,
    label: String,
    ordered: { type: Boolean, default: false },
  }],
  currency: { type: String, default: 'USD' },
  generatedAt: Date,
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Trip', TripSchema);
