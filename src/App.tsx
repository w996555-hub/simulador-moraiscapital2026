import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Index from './pages/Index';
import AdminPage from './pages/AdminPage';
import PropostaPage from './pages/PropostaPage';

function AppRoutes({ isAuthenticated, setIsAuthenticated }: { isAuthenticated: boolean; setIsAuthenticated: (val: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = (path: string) => {
    navigate(path);
  };

  const isPublicRoute = location.pathname.startsWith('/proposta/');

  if (!isAuthenticated && !isPublicRoute) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const user = sessionStorage.getItem('usuario') ? JSON.parse(sessionStorage.getItem('usuario')!) : null;
  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Index navigateTo={navigateTo} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={() => setIsAuthenticated(true)} />
          )
        } 
      />
      <Route 
        path="/admin" 
        element={
          isAuthenticated ? (
            isAdmin ? (
              <AdminPage navigateTo={navigateTo} />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route path="/proposta/:id" element={<PropostaPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('usuario')
  );

  return (
    <BrowserRouter>
      <AppRoutes isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
    </BrowserRouter>
  );
}

export default App;