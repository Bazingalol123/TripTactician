import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const participantCheck = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw new AppError('Trip not found', 404);
  const isParticipant = trip.participants.some((p) => p.userId.equals(req.user.id));
  if (!isParticipant) throw new AppError('Forbidden', 403);
  req.trip = trip;
  next();
});
