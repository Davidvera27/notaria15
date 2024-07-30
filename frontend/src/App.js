// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CaseForm from './components/CaseForm';
import ProtocolistTable from './components/ProtocolistTable';
import Home from './components/Home';
import './App.css';

function App() {
  const handleCheckEmails = async () => {
    try {
      const response = await fetch('http://localhost:5000/check-emails', {
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

  return (
    <Router>
      <div>
        <nav className="nav">
          <Link to="/" className="nav-link">Inicio</Link>
          <button onClick={handleCheckEmails} className="nav-button">Procesar Correos</button>
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
