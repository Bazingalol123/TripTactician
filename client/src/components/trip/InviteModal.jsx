import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../services/api.js';

export default function InviteModal({ tripId, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const invite = useMutation({
    mutationFn: () => api.post(`/invites/trips/${tripId}`, {
      inviteeName: name.trim(),
      inviteeEmail: email.trim(),
    }),
    onSuccess: () => setSent(true),
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Invite a partner</h2>
          <button onClick={onClose}>
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-medium mb-1">✓ Invite sent to {email}</p>
            <p className="text-xs text-gray-400 mt-2">
              They'll get an email with a link to join and set their preferences.
              Once they do, we'll regenerate the trip for both of you.
            </p>
            <button
              onClick={onClose}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); invite.mutate(); }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-gray-500">
              They'll set their preferences and we'll rebuild the trip to work for both of you.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Their name</label>
              <input
                type="text"
                placeholder="Sam"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Their email</label>
              <input
                type="email"
                placeholder="sam@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            {invite.error && (
              <p className="text-xs text-red-600">
                {invite.error?.response?.data?.error || 'Something went wrong'}
              </p>
            )}
            <button
              type="submit"
              disabled={invite.isPending}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {invite.isPending ? 'Sending…' : 'Send invite →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
