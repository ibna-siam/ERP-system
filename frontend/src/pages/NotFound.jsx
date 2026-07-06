import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <p className="text-gray-600 mt-2 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition">
        Back to Dashboard
      </Link>
    </div>
  );
}
