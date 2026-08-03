import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { itemAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const CAMPUS_CENTER = [23.8103, 90.4125];

const lostIcon = new L.DivIcon({
  html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>',
  className: '',
  iconSize: [12, 12],
});

const foundIcon = new L.DivIcon({
  html: '<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>',
  className: '',
  iconSize: [12, 12],
});

function HeatmapLayer({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data.length) return;

    import('leaflet.heat').then(() => {
      const points = data.map((d) => [d.lat, d.lng, d.weight]);
      const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
      return () => map.removeLayer(heat);
    });
  }, [data, map]);

  return null;
}

export default function MapView() {
  const [items, setItems] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('markers');

  useEffect(() => {
    Promise.all([
      itemAPI.getAll({ limit: 100 }),
      itemAPI.getHeatmap(),
    ])
      .then(([itemsRes, heatRes]) => {
        const withCoords = itemsRes.data.items.filter((i) => i.location?.lat && i.location?.lng);
        setItems(withCoords);
        setHeatmap(heatRes.data.heatmap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Campus Map</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('markers')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'markers' ? 'bg-primary-600 text-white' : 'btn-secondary'}`}
          >
            Markers
          </button>
          <button
            onClick={() => setView('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'heatmap' ? 'bg-primary-600 text-white' : 'btn-secondary'}`}
          >
            Heatmap
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Lost</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Found</span>
      </div>

      <div className="card overflow-hidden" style={{ height: '500px' }}>
        <MapContainer center={CAMPUS_CENTER} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {view === 'heatmap' && <HeatmapLayer data={heatmap} />}
          {view === 'markers' && items.map((item) => (
            <Marker
              key={item._id}
              position={[item.location.lat, item.location.lng]}
              icon={item.type === 'lost' ? lostIcon : foundIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-gray-500 capitalize">{item.type} · {item.category}</p>
                  <Link to={`/items/${item._id}`} className="text-primary-600 hover:underline">View details</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
