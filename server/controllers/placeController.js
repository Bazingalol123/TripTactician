import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const searchPlaces = asyncHandler(async (req, res) => {
  // TODO Phase 3.5: implement via placesService.fetchCandidates
  res.status(501).json({ error: 'Not implemented yet' });
});

export const getPlaceDetail = asyncHandler(async (req, res) => {
  // TODO Phase 3.5: implement via placesService
  res.status(501).json({ error: 'Not implemented yet' });
});
