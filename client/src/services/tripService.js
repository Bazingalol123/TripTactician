import api from './api.js';

export const getTrips = async () => {
  const { data } = await api.get('/trips');
  return data.trips;
};

export const getTrip = async (id) => {
  const { data } = await api.get(`/trips/${id}`);
  return data.trip;
};

export const createTrip = async (tripData) => {
  const { data } = await api.post('/trips', tripData);
  return data.trip;
};

export const updateTrip = async (id, updates) => {
  const { data } = await api.patch(`/trips/${id}`, updates);
  return data.trip;
};

export const deleteTrip = async (id) => {
  const { data } = await api.delete(`/trips/${id}`);
  return data;
};

export const setPreferences = async (tripId, preferences) => {
  const { data } = await api.post(`/trips/${tripId}/preferences`, preferences);
  return data.preference;
};

export const getMyPreferences = async (tripId) => {
  const { data } = await api.get(`/trips/${tripId}/preferences/me`);
  return data.preference;
};

export const getPartnerPreferences = async (tripId) => {
  const { data } = await api.get(`/trips/${tripId}/preferences/partner`);
  return data.preference;
};

export const triggerGeneration = async (tripId) => {
  const { data } = await api.post(`/trips/${tripId}/generate`);
  return data;
};

export const getGenerationStatus = async (tripId) => {
  const { data } = await api.get(`/trips/${tripId}/generate/status`);
  return data;
};
