import { Link } from 'react-router-dom';
import { MapPin, Calendar, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const CATEGORIES = {
  Electronics: '📱',
  'ID Card': '🪪',
  Wallet: '👛',
  Keys: '🔑',
  Books: '📚',
  Clothing: '👕',
  Accessories: '⌚',
  Documents: '📄',
  Sports: '⚽',
  Other: '📦',
};

export default function ItemCard({ item }) {
  const photo = item.photos?.[0];
  const emoji = CATEGORIES[item.category] || '📦';

  return (
    <Link to={`/items/${item._id}`} className="card overflow-hidden hover:shadow-md transition group">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">{emoji}</div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className={`badge ${item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {item.type === 'lost' ? 'Lost' : 'Found'}
          </span>
          {item.isEmergency && (
            <span className="badge bg-orange-100 text-orange-800 flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" /> Urgent
            </span>
          )}
        </div>
        {item.reward > 0 && (
          <span className="absolute top-2 right-2 badge bg-yellow-100 text-yellow-800">
            ${item.reward} Reward
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{item.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.location?.name || 'Unknown'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(item.dateTime).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
