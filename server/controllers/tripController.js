import asyncHandler from '../utils/asyncHandler.js';
import Trip from '../models/Trip.js';
import Activity from '../models/Activity.js';
import Preference from '../models/Preference.js';
import AppError from '../utils/AppError.js';
import { fetchDestinationPhoto } from '../services/placesService.js';

const buildDays = (startDate, endDate) => {
  const days = [];
  const d = new Date(startDate);
  const end = new Date(endDate);
  let dayNumber = 1;
  while (d <= end) {
    days.push({ dayNumber, date: new Date(d), label: '', ordered: false });
    d.setDate(d.getDate() + 1);
    dayNumber++;
  }
  return days;
};

const isParticipant = (trip, userId) =>
  trip.participants.some((p) => {
    const id = p.userId?._id || p.userId;
    return id.toString() === userId.toString();
  });

export const createTrip = asyncHandler(async (req, res) => {
  const { name, destination, startDate, endDate, currency } = req.body;
  const photoUrl = destination?.placeId
    ? await fetchDestinationPhoto(destination.placeId).catch(() => null)
    : null;
  const autoName = name || `${destination?.name || 'My trip'} · ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  const trip = await Trip.create({
    name: autoName,
    destination: { ...destination, photoUrl },
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: 'generating',
    participants: [{ userId: req.user.id, role: 'owner' }],
    days: buildDays(startDate, endDate),
    currency: currency || 'USD',
    lastModifiedBy: req.user.id,
  });

  res.status(201).json({ trip });

  // Fire and forget — response already sent
  import('../services/generationService.js')
    .then(({ runGeneration }) => {
      console.log('[generation] auto-starting for new trip', trip._id);
      return runGeneration(trip._id);
    })
    .catch((err) => {
      console.error('[generation] auto-generation failed for trip', trip._id, err.message);
      Trip.findByIdAndUpdate(trip._id, { status: 'active' }).catch(() => {});
    });
});

export const getMyTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ 'participants.userId': req.user.id })
    .populate('participants.userId', 'name email')
    .sort({ createdAt: -1 });
  res.json({ trips });
});

export const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('participants.userId', 'name email');
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!isParticipant(trip, req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  res.json({ trip });
});

export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!isParticipant(trip, req.user.id)) return res.status(403).json({ error: 'Forbidden' });

  const { startDate, endDate, ...rest } = req.body;
  const updates = { ...rest, lastModifiedBy: req.user.id };

  if (startDate || endDate) {
    const newStart = startDate ? new Date(startDate) : trip.startDate;
    const newEnd = endDate ? new Date(endDate) : trip.endDate;
    const datesChanged =
      newStart.getTime() !== trip.startDate.getTime() ||
      newEnd.getTime() !== trip.endDate.getTime();
    if (datesChanged) {
      updates.startDate = newStart;
      updates.endDate = newEnd;
      updates.days = buildDays(newStart, newEnd);
      // TODO Phase 3: write ChangeLog entry { action: 'changed_dates', payload: { from, to } }
    }
  }

  const updated = await Trip.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ trip: updated });
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!isParticipant(trip, req.user.id)) return res.status(403).json({ error: 'Forbidden' });

  await Activity.deleteMany({ tripId: req.params.id });
  await Preference.deleteMany({ tripId: req.params.id });
  // TODO Phase 3: deleteMany Invite, Notification where tripId
  await Trip.findByIdAndDelete(req.params.id);
  res.json({ message: 'Trip deleted' });
});

export const setPreferences = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const userId = req.user.id;
  const { pace, interests, morningPerson, hardAvoids } = req.body;

  const preference = await Preference.findOneAndUpdate(
    { userId, tripId },
    { pace, interests, morningPerson, hardAvoids: hardAvoids || '' },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  // Update trip participant's preferencesId
  await Trip.updateOne(
    { _id: tripId, 'participants.userId': userId },
    { $set: { 'participants.$.preferencesId': preference._id } }
  );

  // Check if both participants have preferences — if so, update status
  const trip = await Trip.findById(tripId);
  const allPrefsSet = await Promise.all(
    trip.participants.map((p) => Preference.exists({ userId: p.userId, tripId }))
  );
  if (allPrefsSet.every(Boolean) && trip.status === 'solo') {
    // solo trip owner just set prefs — leave as solo until partner joins
  }
  if (allPrefsSet.every(Boolean) && trip.status === 'pending_partner') {
    await Trip.findByIdAndUpdate(tripId, { status: 'generating' });
    import('../services/generationService.js')
      .then(({ runGeneration }) => runGeneration(tripId))
      .catch((err) => console.error('[generation] regen after partner joined failed', tripId, err.message));
  }

  res.json({ preference });
});

export const getMyPreferences = asyncHandler(async (req, res) => {
  const preference = await Preference.findOne({ userId: req.user.id, tripId: req.params.id });
  if (!preference) throw new AppError('Preferences not set', 404);
  res.json({ preference });
});

export const getPartnerPreferences = asyncHandler(async (req, res) => {
  const trip = req.trip; // attached by participantCheck
  const partner = trip.participants.find((p) => !p.userId.equals(req.user.id));
  if (!partner) throw new AppError('No partner on this trip', 404);
  const preference = await Preference.findOne({ userId: partner.userId, tripId: req.params.id });
  if (!preference) throw new AppError('Partner has not set preferences yet', 404);
  res.json({ preference });
});

export const triggerGeneration = asyncHandler(async (req, res) => {
  const trip = req.trip;
  if (trip.status === 'generating') throw new AppError('Generation already in progress', 409);

  await Trip.findByIdAndUpdate(trip._id, { status: 'generating' });
  res.json({ message: 'Generation started', status: 'generating' });

  // Fire-and-forget — response already sent
  import('../services/generationService.js')
    .then(({ runGeneration }) => {
      console.log('[generation] starting for trip', trip._id);
      return runGeneration(trip._id);
    })
    .then(() => console.log('[generation] complete for trip', trip._id))
    .catch((err) => console.error('[generation] FAILED for trip', trip._id, '—', err.message, err.stack));
});

export const getGenerationStatus = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id).select('status generatedAt');
  if (!trip) throw new AppError('Trip not found', 404);
  res.json({ status: trip.status, generatedAt: trip.generatedAt || null });
});
