import { v4 as uuidv4 } from 'uuid';
import Invite from '../models/Invite.js';
import Trip from '../models/Trip.js';
import { sendInviteEmail } from './emailService.js';
import AppError from '../utils/AppError.js';

const INVITE_EXPIRES_DAYS = 7;

export const createInvite = async ({ tripId, invitedBy, inviteeEmail, inviteeName }) => {
  await Invite.updateMany({ tripId, inviteeEmail, status: 'pending' }, { status: 'expired' });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  const invite = await Invite.create({ tripId, invitedBy, inviteeEmail, inviteeName, token, expiresAt });

  const trip = await Trip.findById(tripId).populate('participants.userId', 'name');
  await sendInviteEmail({ invite, trip });

  await Trip.findByIdAndUpdate(tripId, { status: 'pending_partner' });

  return invite;
};

export const validateToken = async (token) => {
  const invite = await Invite.findOne({ token }).populate('tripId');
  if (!invite) throw new AppError('Invite not found', 404);
  if (invite.status === 'accepted') throw new AppError('Invite already used', 409);
  if (invite.expiresAt < new Date()) {
    await Invite.findByIdAndUpdate(invite._id, { status: 'expired' });
    throw new AppError('Invite expired', 410);
  }
  return invite;
};

export const acceptInvite = async ({ token, userId }) => {
  const invite = await validateToken(token);
  const trip = await Trip.findById(invite.tripId);

  const alreadyParticipant = trip.participants.some((p) => p.userId.equals(userId));
  if (!alreadyParticipant) {
    trip.participants.push({ userId, role: 'partner' });
    await trip.save();
  }

  await Invite.findByIdAndUpdate(invite._id, { status: 'accepted' });
  return trip;
};
