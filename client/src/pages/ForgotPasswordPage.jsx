import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await forgotPassword(email); setSent(true); }
    catch (err) { setError(err.response?.data?.error || 'Failed to send reset email'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {sent ? (
          <div className="text-center">
            <p className="text-2xl mb-3">📬</p>
            <h1 className="font-semibold text-gray-900 mb-1">Check your email</h1>
            <p className="text-sm text-gray-400">We sent a reset link to {email}</p>
            <Link to="/login" className="mt-4 block text-sm text-blue-600 hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-gray-400 mb-6">We'll send you a reset link</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" fullWidth loading={loading}>Send reset link</Button>
            </form>
            <Link to="/login" className="mt-4 block text-center text-xs text-blue-600 hover:underline">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
