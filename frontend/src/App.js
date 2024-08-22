import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import socketIOClient from 'socket.io-client';
import './App.css';
import Loader from './components/Loader';
import FinishedCaseTable from './components/FinishedCaseTable';
import logo from './components/assets/logo_sin_fondo.png'; // Importación del logo

const ENDPOINT = "http://127.0.0.1:5000";  // Cambia esto según tu configuración

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
  const [userSettings, setUserSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : { theme: 'light' };
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on('new_case', data => {
      toast.success(`Nuevo caso creado: ${data.radicado}`);
      // Aquí podrías actualizar el estado de los casos o manejar la actualización de la UI
    });

    socket.on('update_case', data => {
      toast.info(`Caso actualizado: ${data.radicado}`);
      // Aquí podrías actualizar el estado de los casos o manejar la actualización de la UI
    });

    return () => socket.disconnect();
  }, []);

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

  const handleDropdownToggle = (e) => {
    e.stopPropagation(); // Prevents the event from propagating to the document
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen) {
        closeDropdown();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
            <Link to="/" className="nav-link logo-container" onClick={() => setMenuOpen(false)}>
              <img src={logo} alt="Logo" className="logo" /> {/* Logo añadido */}
            </Link>
            <div className="nav-link" onClick={handleDropdownToggle}>
              Impuesto de Liquidación de Rentas
              <div className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
                <Link to="/cases" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Gestión de Casos</Link>
                <Link to="/protocolists" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Gestión de Protocolistas</Link>
                <Link to="/finished-cases" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Casos Finalizados</Link>
              </div>
            </div>
            <Link to="/register" className="nav-link" onClick={() => setMenuOpen(false)}>Registrar Usuario</Link>
            <button onClick={() => { toggleTheme(); setMenuOpen(false); }} className="nav-button">
              Cambiar a {userSettings.theme === 'light' ? 'Oscuro' : 'Claro'}
            </button>
            <div className="nav-user-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {user?.name}
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
              <Route path="/finished-cases" element={<FinishedCaseTable />} />
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
