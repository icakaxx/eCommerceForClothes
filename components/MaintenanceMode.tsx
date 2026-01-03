'use client';

export default function MaintenanceMode() {
  // Try to get language from localStorage (fallback to 'bg' since DB is configured to Bulgarian)
  const getLanguage = () => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'en' || savedLanguage === 'bg') {
        return savedLanguage;
      }
    }
    return 'bg';
  };

  const language = getLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'bg' ? 'Режим на поддръжка' : 'Maintenance Mode'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {language === 'bg' 
              ? 'Тази страница в момента не работи. Моля, опитайте отново по-късно.'
              : 'This page is currently not working. Please try again later.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {language === 'bg' ? 'Опитайте отново' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
}

