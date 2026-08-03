import { Link, useNavigate } from 'react-router-dom';
import {
  Search, PlusCircle, Map, Brain, Bell, User, LogOut, Moon, Sun,
  Menu, X, Shield, Home,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      notificationAPI.getAll({ limit: 1 }).then((res) => setUnread(res.data.unreadCount)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/items', label: 'Browse', icon: Search },
    { to: '/map', label: 'Map', icon: Map },
    { to: '/ai-match', label: 'AI Match', icon: Brain },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <Home className="h-6 w-6" />
            <span className="hidden sm:inline">Campus Lost & Found</span>
            <span className="sm:hidden">CLF</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {user && (
              <Link
                to="/report"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition ml-1"
              >
                <PlusCircle className="h-4 w-4" />
                Report Item
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                <Link to="/profile" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Admin">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </Link>
                )}
                <Link to="/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/report" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white">
                  <PlusCircle className="h-4 w-4" /> Report Item
                </Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link to="/my-claims" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  My Claims
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
