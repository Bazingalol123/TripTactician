import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import Invite from '../models/Invite.js';
import { createInvite as createInviteService, acceptInvite as acceptInviteService } from '../services/inviteService.js';

export const getInvite = asyncHandler(async (req, res) => {
  const invite = await Invite.findOne({ token: req.params.token })
    .populate('tripId', 'name destination startDate endDate')
    .populate('invitedBy', 'name');
  if (!invite) throw new AppError('Invite not found', 404);
  if (invite.expiresAt < new Date()) throw new AppError('Invite expired', 410);
  res.json({ invite });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const trip = await acceptInviteService({ token: req.params.token, userId: req.user.id });
  res.json({ trip });
});

export const createInvite = asyncHandler(async (req, res) => {
  const { inviteeEmail, inviteeName } = req.body;
  if (!inviteeEmail || !inviteeName) throw new AppError('inviteeEmail and inviteeName required', 400);

  const invite = await createInviteService({
    tripId: req.params.id,
    invitedBy: req.user.id,
    inviteeEmail,
    inviteeName,
  });
  res.status(201).json({ invite });
});

export const resendInvite = asyncHandler(async (req, res) => {
  const { inviteeEmail, inviteeName } = req.body;
  if (!inviteeEmail || !inviteeName) throw new AppError('inviteeEmail and inviteeName required', 400);

  const invite = await createInviteService({
    tripId: req.params.id,
    invitedBy: req.user.id,
    inviteeEmail,
    inviteeName,
  });
  res.json({ invite });
});
