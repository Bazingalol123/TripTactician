import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import Notification from '../models/Notification.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new AppError('Notification not found', 404);
  res.json({ notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});
