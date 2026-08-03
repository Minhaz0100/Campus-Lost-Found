import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto card p-8 text-center">
        <p className="text-red-600 mb-4">Invalid reset link</p>
        <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="password" className="input-field" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <input type="password" className="input-field" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
