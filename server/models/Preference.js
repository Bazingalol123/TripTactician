import mongoose from 'mongoose';

const PreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  pace: { type: String, enum: ['relaxed', 'moderate', 'packed'] },
  interests: [String],
  morningPerson: Boolean,
  hardAvoids: { type: String, default: '' },
}, { timestamps: true });

PreferenceSchema.index({ userId: 1, tripId: 1 }, { unique: true });

export default mongoose.model('Preference', PreferenceSchema);
