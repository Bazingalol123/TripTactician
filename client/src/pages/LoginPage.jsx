import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>Sign in</Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
          {' · '}
          <Link to="/signup" className="text-blue-600 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
