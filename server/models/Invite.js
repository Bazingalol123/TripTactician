import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteeEmail: { type: String, required: true },
  inviteeName: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'resent'],
    default: 'pending',
  },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('Invite', InviteSchema);
