import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { itemAPI } from '../services/api';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Electronics', 'ID Card', 'Wallet', 'Keys', 'Books', 'Clothing', 'Accessories', 'Documents', 'Sports', 'Other'];
const TYPES = ['', 'lost', 'found'];
const STATUSES = ['', 'lost', 'found', 'claimed', 'returned', 'closed'];

export default function Items() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '', type: '', category: '', status: '', serialNumber: '', page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    const params = { ...filters, limit: 12 };
    if (params.category === 'All') delete params.category;
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);

    itemAPI
      .getAll(params)
      .then((res) => {
        setItems(res.data.items);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [filters.page, filters.type, filters.category, filters.status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchItems();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Browse Items</h1>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2 sm:hidden">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by keyword..."
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className={`lg:w-64 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="card p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select className="input-field" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}>
                <option value="">All</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="input-field" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c === 'All' ? '' : c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="input-field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
                <option value="">All</option>
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Serial Number</label>
              <input className="input-field" value={filters.serialNumber} onChange={(e) => setFilters({ ...filters, serialNumber: e.target.value })} placeholder="Search serial..." />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No items found</div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{pagination.total} items found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((item) => (
                  <ItemCard key={item._id} item={item} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    className="btn-secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    className="btn-secondary"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
