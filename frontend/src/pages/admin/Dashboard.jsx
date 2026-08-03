import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, FileCheck, Flag, TrendingUp, CheckCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!data) return <div>Failed to load dashboard</div>;

  const { stats, categoryStats, recentItems } = data;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', to: '/admin/users' },
    { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'text-green-600', to: '/admin/items' },
    { label: 'Pending Claims', value: stats.pendingClaims, icon: FileCheck, color: 'text-yellow-600', to: '/admin/claims' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'text-red-600', to: '/admin/reports' },
    { label: 'Return Rate', value: `${stats.returnRate}%`, icon: CheckCircle, color: 'text-primary-600' },
    { label: 'Returned Items', value: stats.returnedItems, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          to ? (
            <Link key={label} to={to} className="card p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
            </Link>
          ) : (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
            </div>
          )
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-bold mb-4">Items by Category</h2>
          <div className="space-y-2">
            {categoryStats.map(({ _id, count }) => (
              <div key={_id} className="flex items-center justify-between text-sm">
                <span>{_id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.totalItems) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold mb-4">Recent Items</h2>
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">{item.postedBy?.name} · {item.type}</p>
                </div>
                <span className="badge capitalize">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Link to="/admin/users" className="btn-secondary">Manage Users</Link>
        <Link to="/admin/items" className="btn-secondary">Manage Items</Link>
        <Link to="/admin/claims" className="btn-secondary">Review Claims</Link>
        <Link to="/admin/reports" className="btn-secondary">View Reports</Link>
      </div>
    </div>
  );
}
