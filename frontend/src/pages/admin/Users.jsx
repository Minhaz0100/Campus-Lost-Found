import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    adminAPI.getUsers({ search })
      .then((res) => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleUser = async (id) => {
    await adminAPI.toggleUser(id);
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      <div className="flex gap-2 mb-4">
        <input className="input-field max-w-sm" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={fetchUsers} className="btn-primary">Search</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3">
                    <span className={`badge ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleUser(user._id)} className="text-sm text-primary-600 hover:underline">
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
