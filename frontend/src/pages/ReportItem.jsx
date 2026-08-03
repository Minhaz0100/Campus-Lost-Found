import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin } from 'lucide-react';
import { itemAPI } from '../services/api';

const CATEGORIES = ['Electronics', 'ID Card', 'Wallet', 'Keys', 'Books', 'Clothing', 'Accessories', 'Documents', 'Sports', 'Other'];

export default function ReportItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'lost',
    name: '',
    category: 'Other',
    description: '',
    locationName: '',
    lat: '',
    lng: '',
    dateTime: new Date().toISOString().slice(0, 16),
    reward: '',
    serialNumber: '',
    barcode: '',
    isAnonymous: false,
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState(null);

  const handlePhotoChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'locationName' || key === 'lat' || key === 'lng') return;
        formData.append(key, val);
      });

      formData.append(
        'location',
        JSON.stringify({
          name: form.locationName,
          lat: form.lat ? parseFloat(form.lat) : undefined,
          lng: form.lng ? parseFloat(form.lng) : undefined,
        })
      );

      photos.forEach((photo) => formData.append('photos', photo));

      const res = await itemAPI.create(formData);
      setMatches(res.data.matches);

      if (res.data.duplicateWarning) {
        alert('Warning: A similar item was posted recently. Your post has been created anyway.');
      }

      setTimeout(() => navigate(`/items/${res.data.item._id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  if (matches) {
    return (
      <div className="max-w-lg mx-auto card p-8 text-center">
        <h2 className="text-xl font-bold text-green-600 mb-2">Item Reported Successfully!</h2>
        {matches.length > 0 && (
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Found {matches.length} potential match(es). Redirecting...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Report an Item</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="flex gap-3">
          {['lost', 'found'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t })}
              className={`flex-1 py-3 rounded-lg font-medium capitalize transition ${
                form.type === t
                  ? t === 'lost' ? 'bg-red-100 text-red-800 ring-2 ring-red-300' : 'bg-green-100 text-green-800 ring-2 ring-green-300'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time *</label>
            <input type="datetime-local" className="input-field" value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Location *
            </label>
            <input className="input-field" placeholder="e.g. Library Building, 2nd Floor" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Latitude (optional)</label>
            <input className="input-field" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="23.8103" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude (optional)</label>
            <input className="input-field" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="90.4125" />
          </div>
          {form.type === 'lost' && (
            <div>
              <label className="block text-sm font-medium mb-1">Reward ($)</label>
              <input className="input-field" type="number" min="0" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Serial Number</label>
            <input className="input-field" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Barcode</label>
            <input className="input-field" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
            <Upload className="h-4 w-4" /> Photos (up to 5)
          </label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="input-field" />
          {photos.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{photos.length} photo(s) selected. OCR will extract text from ID cards automatically.</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />
          Post anonymously
        </label>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Submitting...' : `Report ${form.type} Item`}
        </button>
      </form>
    </div>
  );
}
