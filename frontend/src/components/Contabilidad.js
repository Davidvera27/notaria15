// src/components/Contabilidad.js
import React from 'react';
import './Contabilidad.css';  // Estilos específicos para la sección de Contabilidad

const Contabilidad = () => {
  return (
    <div className="contabilidad-container">
      <h1>Gestión de Contabilidad</h1>
      <p>Aquí puedes gestionar todas las funciones relacionadas con la contabilidad.</p>
      {/* Elimina el botón de navegación a "Rentas" ya que ahora está en el submenú */}
    </div>
  );
};

export default Contabilidad;
