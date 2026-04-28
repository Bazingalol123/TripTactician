import api from './api.js';

export const getNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data.notifications;
};

export const markRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.notification;
};

export const markAllRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};
