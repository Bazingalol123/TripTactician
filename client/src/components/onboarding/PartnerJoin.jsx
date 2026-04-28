import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import PreferencesForm from './PreferencesForm.jsx';
import api from '../../services/api.js';
import { formatDateRange } from '../../utils/dates.js';

// ─── Main component ───────────────────────────────────────────────────────────

export default function PartnerJoin() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Which form is visible: 'register' | 'login'
  const [mode, setMode] = useState('register');

  // Set after successful auth + accept — drives showing the preferences form
  const [joined, setJoined] = useState(false);
  const [tripId, setTripId] = useState(null);

  // ── 1. Load invite details ──────────────────────────────────────────────────
  const { data: inviteData, isLoading, error: inviteError } = useQuery({
    queryKey: ['invite', token],
    queryFn: async () => {
      const { data } = await api.get(`/invites/${token}`);
      return data.invite;
    },
    retry: false,
  });

  // ── 2. Register → accept invite ────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }) => {
      // Register new account
      const { data: authData } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', authData.token);

      // Immediately accept the invite using the same token we're on
      const { data: acceptData } = await api.post(`/invites/${token}/accept`);
      return acceptData.trip;
    },
    onSuccess: (trip) => {
      setTripId(trip._id);
      setJoined(true);
    },
  });

  // ── 3. Login → accept invite ───────────────────────────────────────────────
  // This is the missing path — existing users were hitting a dead end.
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      // Log in with existing credentials
      const { data: authData } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', authData.token);

      // Accept the invite now that we're authenticated
      const { data: acceptData } = await api.post(`/invites/${token}/accept`);
      return acceptData.trip;
    },
    onSuccess: (trip) => {
      setTripId(trip._id);
      setJoined(true);
    },
  });

  // ── 4. Set preferences + trigger generation ────────────────────────────────
  const prefsMutation = useMutation({
    mutationFn: async (prefs) => {
      await api.post(`/trips/${tripId}/preferences`, prefs);
      await api.post(`/trips/${tripId}/generate`);
    },
    onSuccess: () => {
      // Hard reload so AuthContext re-reads the token set during login/register
      window.location.href = `/trips/${tripId}`;
    },
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <FullPageMessage>Loading invite…</FullPageMessage>;
  }

  // Handle expired / not found / already used
  if (inviteError || !inviteData) {
    const status = inviteError?.response?.status;
    if (status === 410) {
      return (
        <FullPageCard>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl">✕</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">This invite has expired</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ask your partner to resend the invite from inside the trip.
            </p>
            <Button onClick={() => navigate('/signup')} fullWidth>Create my own trip instead</Button>
            <p className="mt-4 text-center text-xs text-gray-400">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">Sign in</button>
            </p>
          </div>
        </FullPageCard>
      );
    }
    if (status === 409) {
      return (
        <FullPageCard>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">You're already on this trip</h2>
            <p className="text-sm text-gray-500 mb-6">Sign in to view the trip.</p>
            <Button onClick={() => navigate('/login')} fullWidth>Sign in to view trip →</Button>
          </div>
        </FullPageCard>
      );
    }
    return <FullPageMessage className="text-red-600">Invite not found or expired.</FullPageMessage>;
  }

  // Show preferences form after joining
  if (joined) {
    return (
      <FullPageCard>
        <h2 className="text-lg font-semibold mb-1">What do you like?</h2>
        <p className="text-xs text-gray-400 mb-6">
          Your partner already set theirs. Now it's your turn.
        </p>
        <PreferencesForm
          onSubmit={prefsMutation.mutate}
          submitLabel="Build our trip →"
          loading={prefsMutation.isPending}
          error={prefsMutation.error?.response?.data?.error}
        />
      </FullPageCard>
    );
  }

  // Active invite — show register or login form
  const { tripId: inviteTrip, invitedBy } = inviteData;
  const activeMutation = mode === 'register' ? registerMutation : loginMutation;

  return (
    <FullPageCard>
      {/* Trip context hero */}
      {inviteTrip && (
        <div className="mb-6 rounded-xl bg-blue-50 px-4 py-3 text-sm">
          <p className="font-medium text-blue-900">
            {invitedBy?.name} invited you to plan{' '}
            <span className="font-semibold">{inviteTrip.destination?.name ?? inviteTrip.name}</span>
          </p>
          <p className="text-blue-600 mt-0.5 text-xs">
            {formatDateRange(inviteTrip.startDate, inviteTrip.endDate)}
          </p>
        </div>
      )}

      {/* Mode toggle tabs */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'register'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-white text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setMode('register')}
        >
          Create account
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium border-l border-gray-200 transition-colors ${
            mode === 'login'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-white text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setMode('login')}
        >
          Sign in
        </button>
      </div>

      {/* Forms — swap without navigating away */}
      {mode === 'register' ? (
        <RegisterForm
          onSubmit={registerMutation.mutate}
          loading={registerMutation.isPending}
          error={registerMutation.error?.response?.data?.error}
        />
      ) : (
        <LoginForm
          onSubmit={loginMutation.mutate}
          loading={loginMutation.isPending}
          error={loginMutation.error?.response?.data?.error}
        />
      )}
    </FullPageCard>
  );
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function RegisterForm({ onSubmit, loading, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, password }); }}
      className="flex flex-col gap-4"
    >
      <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Password" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" fullWidth loading={loading}>Join the trip →</Button>
    </form>
  );
}

function LoginForm({ onSubmit, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ email, password }); }}
      className="flex flex-col gap-4"
    >
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" fullWidth loading={loading}>Sign in and join →</Button>
    </form>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function FullPageCard({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {children}
      </div>
    </div>
  );
}

function FullPageMessage({ children, className = 'text-gray-400' }) {
  return (
    <div className={`p-8 text-sm ${className}`}>{children}</div>
  );
}