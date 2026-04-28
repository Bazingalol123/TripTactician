import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  type: {
    type: String,
    enum: ['partner_joined', 'trip_ready', 'partner_changed', 'invite_expiring', 'trip_starting', 'partner_left'],
    required: true,
  },
  read: { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model('Notification', NotificationSchema);
