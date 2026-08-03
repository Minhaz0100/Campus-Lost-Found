import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => {
    adminAPI.getItems()
      .then((res) => setItems(res.data.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const approve = async (id) => { await adminAPI.approveItem(id); fetchItems(); };
  const remove = async (id) => { if (confirm('Remove this item?')) { await adminAPI.removeItem(id); fetchItems(); } };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Items</h1>
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.photos?.[0] && <img src={item.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <Link to={`/items/${item._id}`} className="font-semibold hover:text-primary-600">{item.name}</Link>
                  <p className="text-sm text-gray-500">{item.postedBy?.name} · {item.type} · {item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${item.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.isApproved ? 'Approved' : 'Removed'}
                </span>
                {!item.isApproved && <button onClick={() => approve(item._id)} className="btn-primary text-sm">Approve</button>}
                {item.isApproved && <button onClick={() => remove(item._id)} className="btn-danger text-sm">Remove</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
