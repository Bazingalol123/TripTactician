export const queryKeys = {
  trips: {
    all: ['trips'],
    detail: (id) => ['trips', id],
    activities: (id) => ['trips', id, 'activities'],
    expenses: (id) => ['trips', id, 'expenses'],
    changelog: (id) => ['trips', id, 'changelog'],
  },
  preferences: {
    mine: (tripId) => ['preferences', tripId, 'mine'],
    partner: (tripId) => ['preferences', tripId, 'partner'],
  },
  places: {
    search: (tripId, params) => ['places', tripId, params],
    detail: (placeId) => ['places', placeId],
  },
  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread'],
  },
};
