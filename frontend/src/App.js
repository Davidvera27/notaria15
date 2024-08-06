import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CaseForm from './components/CaseForm';
import ProtocolistTable from './components/ProtocolistTable';
import Home from './components/Home';
import './App.css';

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
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Función para alternar el tema
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cases" element={<CaseForm />} />
          <Route path="/protocolists" element={<ProtocolistTable />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
