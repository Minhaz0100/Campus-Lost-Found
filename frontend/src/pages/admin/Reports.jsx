import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    adminAPI.getReports()
      .then((res) => setReports(res.data.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const review = async (id, status) => {
    const adminNotes = window.prompt('Add admin notes (optional):') || '';
    const removeItem = status === 'resolved' ? window.confirm('Remove the reported item as well?') : false;
    await adminAPI.reviewReport(id, { status, adminNotes, removeItem });
    fetchReports();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Reports</h1>
      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <p className="text-gray-500">No pending reports</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{report.item?.name || 'Reported item'}</h3>
                  <p className="text-sm text-gray-500">
                    Reported by {report.reportedBy?.name || 'Unknown'} ({report.reportedBy?.email || 'unknown'})
                  </p>
                </div>
                <span className="badge bg-red-100 text-red-800">Pending</span>
              </div>

              <p className="text-sm mb-2">{report.reason || 'No reason provided.'}</p>
              <p className="text-sm text-gray-600 mb-4">{report.description || ''}</p>

              <div className="flex gap-2">
                <button onClick={() => review(report._id, 'resolved')} className="btn-primary text-sm">Resolve</button>
                <button onClick={() => review(report._id, 'dismissed')} className="btn-danger text-sm">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
