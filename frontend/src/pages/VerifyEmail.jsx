import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    authAPI
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto card p-8 text-center">
      {status === 'loading' && <LoadingSpinner />}
      {status === 'success' && (
        <>
          <h2 className="text-xl font-bold text-green-600 mb-2">Email Verified!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h2 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
          <Link to="/register" className="btn-primary">Register Again</Link>
        </>
      )}
    </div>
  );
}
