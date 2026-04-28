import api from './api.js';

export const searchPlaces = async (tripId, params) => {
  const { data } = await api.get(`/trips/${tripId}/places/search`, { params });
  return data.places;
};

export const getPlaceDetail = async (tripId, placeId) => {
  const { data } = await api.get(`/trips/${tripId}/places/${placeId}`);
  return data.place;
};
