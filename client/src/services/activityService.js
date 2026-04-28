import api from './api.js';

export const getActivities = async (tripId) => {
  const { data } = await api.get(`/trips/${tripId}/activities`);
  return data.activities;
};

export const addActivity = async (tripId, activityData) => {
  const { data } = await api.post(`/trips/${tripId}/activities`, activityData);
  return data.activity;
};

export const updateActivity = async (tripId, activityId, updates) => {
  const { data } = await api.patch(`/trips/${tripId}/activities/${activityId}`, updates);
  return data.activity;
};

export const removeActivity = async (tripId, activityId) => {
  const { data } = await api.delete(`/trips/${tripId}/activities/${activityId}`);
  return data;
};

export const reorderActivities = async (tripId, dayNumber, orderedIds) => {
  const { data } = await api.post(`/trips/${tripId}/activities/reorder`, { dayNumber, orderedIds });
  return data.activities;
};

export const fillGaps = async (tripId, dayNumber) => {
  const { data } = await api.post(`/trips/${tripId}/activities/fill-gaps`, { dayNumber });
  return data.activities;
};
