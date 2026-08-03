import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  );
}
