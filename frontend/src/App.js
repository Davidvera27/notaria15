import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import './App.css';
import Loader from './components/Loader';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailsToSendCount, setEmailsToSendCount] = useState(0);
  const [userSettings, setUserSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : { theme: 'light' };
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const checkEmailsToSend = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/cases');
      const cases = await response.json();
      const pendingEmails = cases.filter(c => c.hasPdf).length;
      setEmailsToSendCount(pendingEmails);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  }, []);

  useEffect(() => {
    checkEmailsToSend();
  }, [checkEmailsToSend]);

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
        <div className="app-container">
          <div className={`hamburger-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Inicio</Link>
            <Link to="/cases" className="nav-link" onClick={() => setMenuOpen(false)}>Gestión de Casos</Link>
            <Link to="/protocolists" className="nav-link" onClick={() => setMenuOpen(false)}>Gestión de Protocolistas</Link>
            <Link to="/register" className="nav-link" onClick={() => setMenuOpen(false)}>Registrar Usuario</Link>
            <button onClick={() => { handleCheckEmails(); setMenuOpen(false); }} className="nav-button">
              Procesar Correos {emailsToSendCount > 0 && <span className="notification-badge">{emailsToSendCount}</span>}
            </button>
            <button onClick={() => { toggleTheme(); setMenuOpen(false); }} className="nav-button">
              Cambiar a {userSettings.theme === 'light' ? 'Oscuro' : 'Claro'}
            </button>
            <div className="nav-user-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {user?.name} {/* Muestra el nombre del usuario */}
              <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>Información de perfil</Link>
                <button onClick={() => logout({ returnTo: window.location.origin })} className="dropdown-item">Cerrar Sesión</button>
              </div>
            </div>
          </nav>
          <Suspense fallback={<Loader />}>
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
