import { useState } from 'react';
import { Brain, Upload, Search } from 'lucide-react';
import { itemAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';

export default function AIMatch() {
  const { user } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!photo) return;

    if (!user) {
      alert('Please login to use AI matching');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      if (category) formData.append('category', category);
      const res = await itemAPI.findSimilar(formData);
      setResults(res.data.similar);
    } catch (err) {
      alert(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <Brain className="h-12 w-12 text-primary-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold mb-2">AI Image Matching</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a photo to find visually similar lost or found items using AI-powered image analysis.
        </p>
      </div>

      <form onSubmit={handleSearch} className="card p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
            <Upload className="h-4 w-4" /> Upload Photo
          </label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="input-field" required />
        </div>

        {preview && (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Category (optional)</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any category</option>
            {['Electronics', 'ID Card', 'Wallet', 'Keys', 'Books', 'Clothing', 'Accessories', 'Documents', 'Sports', 'Other'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading || !photo}>
          <Search className="h-4 w-4" />
          {loading ? 'Analyzing...' : 'Find Similar Items'}
        </button>
      </form>

      {!user && (
        <div className="text-center card p-4 mb-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-primary-600 hover:underline">Login</Link> to use AI matching
          </p>
        </div>
      )}

      {searched && (
        <div>
          <h2 className="text-lg font-bold mb-4">
            {results.length ? `Found ${results.length} similar item(s)` : 'No similar items found'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map(({ item, score }) => (
              <div key={item._id} className="relative">
                <ItemCard item={item} />
                <span className="absolute top-2 right-2 badge bg-primary-100 text-primary-800">{score}% match</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
