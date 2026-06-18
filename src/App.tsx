import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Index from './pages/Index';
import AdminPage from './pages/AdminPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('usuario')
  );
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const user = sessionStorage.getItem('usuario') ? JSON.parse(sessionStorage.getItem('usuario')!) : null;
  const isAdmin = user?.role === 'admin';

  if (currentPath === '/admin') {
    if (!isAdmin) {
      window.history.replaceState({}, '', '/');
      return <Index navigateTo={navigateTo} />;
    }
    return <AdminPage navigateTo={navigateTo} />;
  }

  return <Index navigateTo={navigateTo} />;
}

export default App;