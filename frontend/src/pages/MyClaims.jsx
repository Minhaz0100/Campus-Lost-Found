import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { claimAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    claimAPI.getMy()
      .then((res) => setClaims(res.data.claims))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Claims</h1>

      {claims.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p>You haven't submitted any claims yet.</p>
          <Link to="/items" className="text-primary-600 hover:underline mt-2 inline-block">Browse items</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim._id} className="card p-4 flex gap-4">
              {claim.item?.photos?.[0] && (
                <img src={claim.item.photos[0]} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <Link to={`/items/${claim.item?._id}`} className="font-semibold hover:text-primary-600">
                    {claim.item?.name}
                  </Link>
                  <span className={`badge capitalize ${
                    claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                    claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {claim.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 capitalize mt-1">{claim.item?.type} · {claim.item?.category}</p>
                {claim.item?.status && <StatusBadge status={claim.item.status} />}
                <p className="text-xs text-gray-400 mt-2">{new Date(claim.createdAt).toLocaleString()}</p>
                {claim.quizScore !== undefined && (
                  <p className="text-xs mt-1">Quiz score: {claim.quizScore}% {claim.quizPassed ? '✓ Passed' : '✗ Failed'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
