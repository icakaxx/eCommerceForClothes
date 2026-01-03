import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Page Not Found
        </h2>
        <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

