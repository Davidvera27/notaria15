import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  return (
    <motion.div
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="title-wrapper"
        initial={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h1
          className="home-title"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Bienvenido a Gestión de Rentas - Notaria 15
        </motion.h1>
      </motion.div>
      <motion.div
        className="home-buttons"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <Link to="/cases" className="home-button">Gestión de Casos</Link>
        <Link to="/protocolists" className="home-button">Gestión de Protocolistas</Link>
      </motion.div>
    </motion.div>
  );
};

export default Home;
