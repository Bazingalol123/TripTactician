import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, tripId, type, payload = {} }) => {
  return Notification.create({ userId, tripId, type, payload });
};

export const notifyBothPartners = async (trip, type, payload = {}) => {
  const notifications = trip.participants.map((p) =>
    createNotification({ userId: p.userId, tripId: trip._id, type, payload })
  );
  return Promise.all(notifications);
};
