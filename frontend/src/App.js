import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import './App.css';

// Importación de componentes
const CaseForm = React.lazy(() => {
  NProgress.start();
  return import('./components/CaseForm').finally(NProgress.done);
});
const ProtocolistTable = React.lazy(() => {
  NProgress.start();
  return import('./components/ProtocolistTable').finally(NProgress.done);
});
const Home = React.lazy(() => {
  NProgress.start();
  return import('./components/Home').finally(NProgress.done);
});
const Profile = React.lazy(() => {
  NProgress.start();
  return import('./components/Profile').finally(NProgress.done);
});
const Register = React.lazy(() => {
  NProgress.start();
  return import('./components/Register').finally(NProgress.done);
});

function App() {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading } = useAuth0();

  const [userSettings, setUserSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : { theme: 'light' };
  });

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  const handleCheckEmails = async () => {
    try {
      const response = await fetch('https://notaria15-backend.vercel.app/check-emails', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const toggleTheme = () => {
    setUserSettings(prevSettings => {
      const newTheme = prevSettings.theme === 'light' ? 'dark' : 'light';
      return { ...prevSettings, theme: newTheme };
    });
  };

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    document.body.className = userSettings.theme;
  }, [userSettings.theme]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    isAuthenticated && (
      <Router>
        <div>
          <nav className="nav">
            <Link to="/" className="nav-link">Inicio</Link>
            <Link to="/cases" className="nav-link">Gestión de Casos</Link>
            <Link to="/protocolists" className="nav-link">Gestión de Protocolistas</Link>
            <Link to="/register" className="nav-link">Registrar Usuario</Link>
            <button onClick={handleCheckEmails} className="nav-button">Procesar Correos</button>
            <button onClick={toggleTheme} className="nav-button">
              Cambiar a {userSettings.theme === 'light' ? 'Oscuro' : 'Claro'}
            </button>
            <Link to="/profile" className="nav-link">Perfil</Link>
            <button onClick={() => logout({ returnTo: window.location.origin })} className="nav-button">Logout</button>
          </nav>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cases" element={<CaseForm />} />
              <Route path="/protocolists" element={<ProtocolistTable />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Suspense>
          <ToastContainer />
        </div>
      </Router>
    )
  );
}

export default App;
