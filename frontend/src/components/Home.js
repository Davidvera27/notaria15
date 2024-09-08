import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Parallax } from 'react-parallax';
import { Tilt } from 'react-tilt'; // Cambio aquí: Named export
import './Home.css';
import logo from './assets/logo_sin_fondo.png';
import background from './assets/notaria_background_2.jpg'; // Ajusta la ruta según tu estructura

const Home = () => {
  return (
    <Parallax bgImage={background} strength={300}>
      <motion.div
        className="home-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="home-title-wrapper"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <h1 className="home-title">
            Bienvenido a Gestión de Rentas - 
            <img src={logo} alt="Notaria 15" className="home-logo" />
          </h1>
        </motion.div>

        <motion.div
          className="home-buttons"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {/* Aplicamos el efecto Tilt en los botones */}
          <Tilt className="Tilt" options={{ max: 25, scale: 1.05 }}>
            <Link to="/cases" className="home-button">Gestión de Rentas</Link>
          </Tilt>
          <Tilt className="Tilt" options={{ max: 25, scale: 1.05 }}>
            <Link to="/protocolist-section" className="home-button">Protocolistas</Link>
          </Tilt>
        </motion.div>
      </motion.div>
    </Parallax>
  );
};

export default Home;
