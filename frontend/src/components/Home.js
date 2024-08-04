import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1 className="home-title">Bienvenido a Gestión de Rentas - Notaria 15</h1>
      <div className="home-buttons">
        <Link to="/cases" className="home-button">Gestión de Casos</Link>
        <Link to="/protocolists" className="home-button">Gestión de Protocolistas</Link>
      </div>
    </div>
  );
};

export default Home;
