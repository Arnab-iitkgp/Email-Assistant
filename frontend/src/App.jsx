// src/App.jsx
import Sidebar from './components/Sidebar';
import Inbox from './components/Inbox';
import DigestHistory from './components/DigestHistory';
import AlertsPanel from './components/AlertsPanel';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [view, setView] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Attempt to fetch data from an authenticated endpoint
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emails/today`, { withCredentials: true });
        // If successful, user is authenticated and should be redirected to dashboard if on landing page
        if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
          setView('inbox'); // Set initial view to inbox if authenticated
        }
      } catch (error) {
        // If not authenticated, ensure we are on the landing page
        if (error.response && error.response.status === 401 && window.location.pathname !== '/') {
          window.location.href = '/'; // Redirect to landing page
        }
        setView('landing'); // Ensure landing page is shown if not authenticated
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const renderContent = () => {
    switch(view) {
      case 'landing': return <LandingPage setView={setView} />;
      case 'inbox': return <Inbox setView={setView} />;
      case 'digest': return <DigestHistory />;
      case 'alerts': return <AlertsPanel />;
      case 'settings': return <Settings />;
      default: return <LandingPage setView={setView} />;
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {view === 'landing' ? (
        <LandingPage setView={setView} />
      ) : (
        <div className="flex">
          <Sidebar setView={setView} currentView={view} />
          <main className="flex-1 lg:ml-72">
            <div className="min-h-screen">
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
