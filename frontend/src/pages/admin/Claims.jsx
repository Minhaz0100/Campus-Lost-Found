import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = () => {
    adminAPI.getClaims()
      .then((res) => setClaims(res.data.claims))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, []);

  const review = async (id, status) => {
    const rewardPaid = status === 'approved' ? confirm('Has the reward been paid?') : false;
    await adminAPI.review(id, { status, rewardPaid });
    fetchClaims();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Claims</h1>
      {loading ? <LoadingSpinner /> : claims.length === 0 ? (
        <p className="text-gray-500">No pending claims</p>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim._id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{claim.item?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Claimed by {claim.claimant?.name} ({claim.claimant?.email})
                  </p>
                </div>
                <span className="badge bg-yellow-100 text-yellow-800">Quiz: {claim.quizScore}%</span>
              </div>
              <p className="text-sm mb-3">{claim.proofDescription}</p>
              <div className="flex gap-2">
                <button onClick={() => review(claim._id, 'approved')} className="btn-primary text-sm">Approve</button>
                <button onClick={() => review(claim._id, 'rejected')} className="btn-danger text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
