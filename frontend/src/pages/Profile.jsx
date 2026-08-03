import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, notificationAPI } from '../services/api';
import { Bell, Award } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', studentId: '', department: '', batch: '', phone: '',
  });
  const [photo, setPhoto] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        studentId: user.studentId || '',
        department: user.department || '',
        batch: user.batch || '',
        phone: user.phone || '',
      });
    }
    notificationAPI.getAll().then((res) => setNotifications(res.data.notifications)).catch(console.error);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const data = { ...form };
      if (photo) data.profilePicture = photo;
      const res = await userAPI.updateProfile(data);
      updateUser(res.data.user);
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
                {user.name[0]}
              </div>
            )}
            <div>
              <h2 className="font-bold text-lg">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Reputation: {user.reputation || 0}</span>
              </div>
            </div>
          </div>

          {user.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.badges.map((badge) => (
                <span key={badge} className="badge bg-yellow-100 text-yellow-800">{badge}</span>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            <input className="input-field" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <input className="input-field" placeholder="Batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="input-field" />
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && <p className="text-green-600 text-sm text-center">Profile updated!</p>}
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h2>
            <button onClick={markAllRead} className="text-sm text-primary-600 hover:underline">Mark all read</button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`p-3 rounded-lg text-sm ${n.isRead ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-gray-600 dark:text-gray-400">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
