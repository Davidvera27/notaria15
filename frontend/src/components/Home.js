// Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import './Home.css';

const Home = () => {
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translate3d(0,-50px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    config: { duration: 1000 },
  });

  return (
    <animated.div style={fadeIn} className="home-container">
      <h1 className="home-title">Bienvenido a Gestión de Rentas - Notaria 15</h1>
      <div className="home-buttons">
        <Link to="/cases" className="home-button">Gestión de Casos</Link>
        <Link to="/protocolists" className="home-button">Gestión de Protocolistas</Link>
      </div>
    </animated.div>
  );
};

export default Home;
