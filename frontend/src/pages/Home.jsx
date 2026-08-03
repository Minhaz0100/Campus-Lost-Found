import { Link } from 'react-router-dom';
import { Search, PlusCircle, Map, Brain, Shield, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { itemAPI, userAPI } from '../services/api';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const [finders, setFinders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([itemAPI.getRecent(), userAPI.getLeaderboard()])
      .then(([itemsRes, findersRes]) => {
        setRecentItems(itemsRes.data.items);
        setFinders(findersRes.data.finders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: Search, title: 'Search & Filter', desc: 'Find items by category, location, date, or keyword', to: '/items' },
    { icon: Brain, title: 'AI Matching', desc: 'Smart image and keyword matching for lost & found items', to: '/ai-match' },
    { icon: Map, title: 'Campus Map', desc: 'View lost item hotspots on an interactive campus map', to: '/map' },
    { icon: Shield, title: 'Secure Claims', desc: 'Verification quiz and admin approval for safe returns', to: '/faq' },
  ];

  return (
    <div>
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white mb-10">
        <div className="px-8 py-16 md:py-24 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Lost Something on Campus?
          </h1>
          <p className="text-lg text-primary-100 mb-8">
            Report, search, and recover lost items with AI-powered matching, campus maps, and secure verification.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/items" className="bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition">
              Browse Items
            </Link>
            <Link to="/report" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Report Item
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {features.map(({ icon: Icon, title, desc, to }) => (
          <Link key={title} to={to} className="card p-5 hover:shadow-md transition group">
            <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Items</h2>
          <Link to="/items" className="text-primary-600 hover:underline text-sm font-medium">View all</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {finders.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold">Top Finders</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {finders.map((finder, i) => (
              <div key={finder._id} className="card p-4 text-center">
                <div className="relative inline-block mb-2">
                  {finder.profilePicture ? (
                    <img src={finder.profilePicture} alt="" className="h-14 w-14 rounded-full object-cover mx-auto" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto text-primary-600 font-bold text-lg">
                      {finder.name[0]}
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-sm">{finder.name}</h3>
                <p className="text-xs text-gray-500">{finder.itemsReturned} returns</p>
                {finder.badges?.length > 0 && (
                  <p className="text-xs text-primary-600 mt-1">{finder.badges[0]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
