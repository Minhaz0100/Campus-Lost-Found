import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">Campus Lost & Found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Helping students find and return lost items across campus with AI-powered matching.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/items" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Browse Items</Link></li>
              <li><Link to="/map" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Campus Map</Link></li>
              <li><Link to="/ai-match" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">AI Match</Link></li>
              <li><Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Contact Admin</Link></li>
              <li><Link to="/report" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Report an Item</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Campus Lost & Found. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
