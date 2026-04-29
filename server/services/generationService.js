import Trip from '../models/Trip.js';
import Activity from '../models/Activity.js';
import Preference from '../models/Preference.js';
import { fetchCandidates } from './placesService.js';
import { generateItinerary, generateItineraryNoPlaces } from './llmService.js';
import { notifyBothPartners } from './notificationService.js';
import logger from '../utils/logger.js';

const PRICE_ESTIMATES = { 0: 0, 1: 15, 2: 35, 3: 70, 4: 150 };

export const runGeneration = async (tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new Error('Trip not found');

  await Trip.findByIdAndUpdate(tripId, { status: 'generating' });

  try {
    const prefs = await Promise.all(
      trip.participants.map((p) => Preference.findOne({ userId: p.userId, tripId }))
    );
    const validPrefs = prefs.filter(Boolean);

    // Build merged profile from whatever preferences exist.
    // If none, use sensible defaults so Places API / LLM still gets useful context.
    const defaultInterests = ['food', 'culture', 'nature', 'adventure'];
    const mergedProfile = validPrefs.length > 0 ? {
      interests: [...new Set(validPrefs.flatMap((p) => p.interests || []))],
      hardAvoidsA: validPrefs[0]?.hardAvoids || '',
      hardAvoidsB: validPrefs[1]?.hardAvoids || '',
    } : {
      interests: defaultInterests,
      hardAvoidsA: '',
      hardAvoidsB: '',
    };

    const profileA = validPrefs[0] || { pace: 'moderate', interests: defaultInterests, morningPerson: true, hardAvoids: '' };
    const profileB = validPrefs[1] || profileA;

    logger.info({ tripId }, 'Starting place retrieval');
    const candidates = await fetchCandidates({
      destination: trip.destination,
      interests: mergedProfile.interests,
      hardAvoidsA: mergedProfile.hardAvoidsA,
      hardAvoidsB: mergedProfile.hardAvoidsB,
    });

    let itinerary;
    let activityDocs;

    if (candidates.length === 0) {
      // No Places API key — let the LLM generate both places and itinerary
      logger.info({ tripId }, 'No candidates from Places API, using LLM-only generation');
      console.log('[generation] calling Ollama/LLM — this may take 1-3 min...');
      itinerary = await generateItineraryNoPlaces({ profileA, profileB, trip });
      console.log('[generation] LLM returned', itinerary?.days?.length, 'days');

      await Activity.deleteMany({ tripId });

      activityDocs = itinerary.days.flatMap((day) =>
        day.activities.map((a) => ({
          tripId,
          dayNumber: day.dayNumber,
          placeId: a.placeId,
          name: a.name,
          category: a.category,
          priceLevel: a.priceLevel,
          estimatedCostPerPerson: PRICE_ESTIMATES[a.priceLevel] ?? 25,
          rating: null,
          photos: [],
          website: null,
          coords: a.coords,
          bookingType: a.bookingType,
          viatorProductId: null,
          order: a.order,
          timeOfDay: a.timeOfDay,
          source: 'ai_generated',
          conflict: a.conflict,
        }))
      );
    } else {
      await Trip.findByIdAndUpdate(tripId, { candidates });

      logger.info({ tripId, candidateCount: candidates.length }, 'Starting LLM generation');
      itinerary = await generateItinerary({ candidates, profileA, profileB, trip });

      const validPlaceIds = new Set(candidates.map((c) => c.placeId));
      const allValid = itinerary.days.every((day) =>
        day.activities.every((a) => validPlaceIds.has(a.placeId))
      );
      if (!allValid) throw new Error('LLM returned invalid place_id — retry');

      await Activity.deleteMany({ tripId });

      activityDocs = itinerary.days.flatMap((day) =>
        day.activities.map((a) => {
          const candidate = candidates.find((c) => c.placeId === a.placeId);
          return {
            tripId,
            dayNumber: day.dayNumber,
            placeId: a.placeId,
            name: candidate.name,
            category: candidate.category,
            priceLevel: candidate.priceLevel,
            estimatedCostPerPerson: PRICE_ESTIMATES[candidate.priceLevel] ?? 25,
            rating: candidate.rating,
            photos: candidate.photos,
            website: candidate.website,
            coords: candidate.coords,
            bookingType: candidate.bookingType,
            viatorProductId: candidate.viatorProductId,
            order: a.order,
            timeOfDay: a.timeOfDay,
            source: 'ai_generated',
            conflict: a.conflict,
          };
        })
      );
    }
    await Activity.insertMany(activityDocs);

    // Merge LLM-generated labels into the original days array (which has the
    // correct count from startDate/endDate). Never replace days entirely —
    // the LLM may return fewer days than the trip has.
    const labelMap = Object.fromEntries(itinerary.days.map((d) => [d.dayNumber, d.label]));
    const updatedDays = trip.days.map((d) => ({
      ...d,
      label: labelMap[d.dayNumber] || d.label || '',
      ordered: false,
    }));

    await Trip.findByIdAndUpdate(tripId, {
      status: 'active',
      days: updatedDays,
      generatedAt: new Date(),
    });

    const conflictCount = activityDocs.filter((a) => a.conflict?.flagged).length;
    await notifyBothPartners(trip, 'trip_ready', {
      conflictCount,
      activityCount: activityDocs.length,
    });

    logger.info({ tripId }, 'Generation complete');
  } catch (err) {
    logger.error({ err, tripId }, 'Generation failed');
    await Trip.findByIdAndUpdate(tripId, { status: 'active' });
    throw err;
  }
};
