import mongoose from 'mongoose';

const ChangeLogSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: ['added_activity', 'removed_activity', 'reordered_day', 'swapped_activity', 'changed_dates', 'joined_trip'],
    required: true,
  },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

ChangeLogSchema.index({ tripId: 1, createdAt: -1 });

export default mongoose.model('ChangeLog', ChangeLogSchema);
