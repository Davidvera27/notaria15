import React from 'react';
import { Puff } from 'react-loader-spinner';  // Cambia TailSpin por Puff
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <Puff color="#007bff" height={100} width={100} />
    </div>
  );
};

export default Loader;
