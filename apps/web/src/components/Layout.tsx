import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearToken, setLanguage } from '../lib/auth';
import { trpc } from '../lib/trpc';

export function Layout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const updateLanguage = trpc.auth.updateLanguage.useMutation();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const handleLanguageChange = (lang: 'cs' | 'en') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    updateLanguage.mutate({ language: lang });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              {t('common.appName')}
            </Link>
            <div className="flex items-center gap-4">
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value as 'cs' | 'en')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:border-blue-500 focus:outline-none"
              >
                <option value="cs">{t('common.czech')}</option>
                <option value="en">{t('common.english')}</option>
              </select>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
