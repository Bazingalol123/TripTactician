import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  dayNumber: { type: Number, required: true },
  placeId: { type: String, required: true },
  name: { type: String, required: true },
  category: String,
  priceLevel: Number,
  estimatedCostPerPerson: Number,
  rating: Number,
  photos: [String],
  website: String,
  openingHours: mongoose.Schema.Types.Mixed,
  coords: { lat: Number, lng: Number },
  bookingType: {
    type: String,
    enum: ['experience', 'restaurant', 'attraction', 'none'],
    default: 'none',
  },
  viatorProductId: String,
  order: { type: Number, default: null },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', null],
    default: null,
  },
  source: {
    type: String,
    enum: ['ai_generated', 'ai_suggested', 'manual'],
    required: true,
  },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  conflict: {
    flagged: { type: Boolean, default: false },
    partner: { type: String, default: null },
    reason: { type: String, default: null },
    overridden: { type: Boolean, default: false },
  },
}, { timestamps: true });

ActivitySchema.index({ tripId: 1, dayNumber: 1 });

export default mongoose.model('Activity', ActivitySchema);
