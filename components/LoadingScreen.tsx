'use client';

export default function LoadingScreen() {
  // Get language from localStorage (defaults to 'bg' to match DB configuration)
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
  const loadingText = language === 'bg' ? 'Зареждане...' : 'Loading...';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
          {loadingText}
        </p>
      </div>
    </div>
  );
}

