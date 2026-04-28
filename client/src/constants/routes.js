export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  DASHBOARD: '/',
TRIP: '/trips/:id',
  TRIP_EXPENSES: '/trips/:id/expenses',
  INVITE: '/invite/:token',
  NOT_FOUND: '*',
};

export const tripPath = (id) => `/trips/${id}`;
export const tripExpensesPath = (id) => `/trips/${id}/expenses`;
export const invitePath = (token) => `/invite/${token}`;
export const resetPasswordPath = (token) => `/reset-password/${token}`;
