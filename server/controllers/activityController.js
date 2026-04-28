import asyncHandler from '../utils/asyncHandler.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';

export const getActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ tripId: req.params.id }).sort({ dayNumber: 1, order: 1 });
  res.json({ activities });
});

export const addActivity = asyncHandler(async (req, res) => {
  const { dayNumber, placeId, name, category, priceLevel, estimatedCostPerPerson,
          rating, photos, website, coords, bookingType, viatorProductId, timeOfDay } = req.body;

  const activity = await Activity.create({
    tripId: req.params.id,
    dayNumber,
    placeId,
    name,
    category,
    priceLevel,
    estimatedCostPerPerson,
    rating,
    photos,
    website,
    coords,
    bookingType,
    viatorProductId,
    timeOfDay,
    source: 'manual',
    addedBy: req.user.id,
    conflict: { flagged: false, partner: null, reason: null, overridden: false },
  });

  res.status(201).json({ activity });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.activityId, tripId: req.params.id },
    { ...req.body },
    { new: true, runValidators: true }
  );
  if (!activity) throw new AppError('Activity not found', 404);
  res.json({ activity });
});

export const removeActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOneAndDelete({
    _id: req.params.activityId,
    tripId: req.params.id,
  });
  if (!activity) throw new AppError('Activity not found', 404);
  res.json({ message: 'Activity removed' });
});

export const reorderActivities = asyncHandler(async (req, res) => {
  const { dayNumber, orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) throw new AppError('orderedIds must be an array', 400);

  await Promise.all(
    orderedIds.map((id, index) =>
      Activity.findByIdAndUpdate(id, { order: index + 1 })
    )
  );

  const activities = await Activity.find({ tripId: req.params.id, dayNumber }).sort({ order: 1 });
  res.json({ activities });
});

export const fillGaps = asyncHandler(async (req, res) => {
  // TODO Phase 3.5: implement via generationService.fillDayGaps
  res.status(501).json({ error: 'Not implemented yet' });
});
