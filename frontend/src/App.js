import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const CaseForm = React.lazy(() => import('./components/CaseForm'));
const ProtocolistTable = React.lazy(() => import('./components/ProtocolistTable'));
const Home = React.lazy(() => import('./components/Home'));

function App() {
  const [userSettings, setUserSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : { theme: 'light' };
  });

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

  return (
    <Router>
      <div>
        <nav className="nav">
          <Link to="/" className="nav-link">Inicio</Link>
          <button onClick={handleCheckEmails} className="nav-button">Procesar Correos</button>
          <button onClick={toggleTheme} className="nav-button">
            Cambiar a {userSettings.theme === 'light' ? 'Oscuro' : 'Claro'}
          </button>
        </nav>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cases" element={<CaseForm />} />
            <Route path="/protocolists" element={<ProtocolistTable />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
