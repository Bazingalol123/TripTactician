import { Resend } from 'resend';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const send = async (payload) => {
  if (!resend) {
    logger.warn('Email not sent — RESEND_API_KEY not configured');
    return;
  }
  await resend.emails.send(payload);
};

export const sendInviteEmail = async ({ invite, trip }) => {
  const inviteUrl = `${env.CLIENT_URL}/invite/${invite.token}`;
  const ownerName = trip.participants.find((p) => p.role === 'owner')?.userId?.name || 'Your partner';

  await send({
    from: env.EMAIL_FROM,
    to: invite.inviteeEmail,
    subject: `${ownerName} invited you to plan a trip to ${trip.destination.name}`,
    html: buildInviteEmailHtml({ invite, trip, inviteUrl, ownerName }),
  });
};

export const sendTripReadyEmail = async ({ trip, userId, conflictCount, activityCount }) => {
  const participant = trip.participants.find((p) => p.userId.equals(userId));
  const partnerName =
    trip.participants.find((p) => !p.userId.equals(userId))?.userId?.name || 'your partner';

  await send({
    from: env.EMAIL_FROM,
    to: participant?.userId?.email,
    subject: `Your ${trip.destination.name} trip is ready`,
    html: buildTripReadyEmailHtml({ trip, partnerName, conflictCount, activityCount }),
  });
};

const buildInviteEmailHtml = ({ invite, trip, inviteUrl, ownerName }) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
    <p style="font-size:13px;font-weight:500;">TripTactician</p>
    <h2>${ownerName} invited you to plan a trip to ${trip.destination.name}</h2>
    <p>${trip.destination.name} · ${new Date(trip.startDate).toDateString()} – ${new Date(trip.endDate).toDateString()}</p>
    <p>Set your travel preferences and we'll build a shared itinerary for both of you.</p>
    <a href="${inviteUrl}" style="display:block;background:#185FA5;color:#fff;padding:12px;text-align:center;border-radius:8px;text-decoration:none;">Join the trip →</a>
    <p style="font-size:11px;color:#888;">This link expires in 7 days. If you didn't expect this, ignore it.</p>
  </div>
`;

const buildTripReadyEmailHtml = ({ trip, partnerName, conflictCount, activityCount }) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
    <p style="font-size:13px;font-weight:500;">TripTactician</p>
    <h2>Your ${trip.destination.name} trip is ready</h2>
    <p>${activityCount} activities · ${conflictCount} conflicts to review with ${partnerName}</p>
    <a href="${env.CLIENT_URL}/trips/${trip._id}" style="display:block;background:#185FA5;color:#fff;padding:12px;text-align:center;border-radius:8px;text-decoration:none;">View your trip →</a>
  </div>
`;
