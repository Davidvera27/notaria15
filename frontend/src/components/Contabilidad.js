import React, { useState, useEffect } from 'react';
import './Contabilidad.css';
import axios from 'axios';

const Contabilidad = () => {
  const [formData, setFormData] = useState({
    protocolista: '',
    facturaNo: '',
    esc: '',
    factCanceladas: 0,  // Inicializar con 0
    factSinCancelar: 0, // Inicializar con 0
    totalFactSinCancelar: 0,
    totalFactCanceladas: 0,
    fecha: '',
    rentasPse: 0,
    rentasEfectivo: 0,
    registroPse: 0,
    registroEfectivo: 0,
    totalRYR: 0,
    devolucion: 0,
    excedentes: 0,
    totalRentasRegistro: 0,
    observaciones: ''
  });

  const [registros, setRegistros] = useState([]);
  const [protocolists, setProtocolists] = useState([]); // New state for protocolists
  const [error, setError] = useState('');

  // Función para formatear los valores numéricos en formato de moneda local (COP)
  const formatToCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '';
    return Number(value).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0, // Sin decimales
      maximumFractionDigits: 0, // Sin decimales
    }).replace(/COP\s/g, ''); // Para remover el símbolo de moneda y dejar solo el valor.
  };

  // Fetch protocolistas from the backend
  useEffect(() => {
    const fetchProtocolists = async () => {
      try {
        const response = await axios.get('http://localhost:5000/protocolists');
        setProtocolists(response.data); // Update the protocolist state with fetched data
      } catch (error) {
        console.error('Error fetching protocolists', error);
        setError('Error al obtener los protocolistas');
      }
    };
    fetchProtocolists();
  }, []);

  // Handle change event
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value // Update form data with user input
    });
  };

  // Formatear el campo solo cuando el usuario sale del input.
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const cleanedValue = value.replace(/,/g, '');
    if (!isNaN(cleanedValue) && cleanedValue !== '') {
      setFormData({
        ...formData,
        [name]: formatToCurrency(cleanedValue) // Usamos formatToCurrency para formatear el valor
      });
    }
  };

  const fetchRegistros = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/contabilidad');
      setRegistros(response.data);
    } catch (error) {
      console.error('Error fetching data', error);
      setError('Error al obtener los registros');
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { protocolista, facturaNo, esc, fecha } = formData;
    
    if (!protocolista || !facturaNo || !esc || !fecha) {
      setError('Por favor completa todos los campos obligatorios y asegúrate de ingresar una fecha válida');
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/contabilidad', formData);
      console.log('Registro añadido', response.data);
      fetchRegistros(); // Fetch updated records
      setError(''); // Clear any errors
    } catch (error) {
      console.error('Error añadiendo datos', error);
      setError('Error al añadir el registro');
    }
  };

  return (
    <div className="contabilidad-container">
      <h2>Gestión Contable</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Etiquetas y campos del formulario */}
        <label>Protocolista:</label>
        <select
          name="protocolista"
          value={formData.protocolista}
          onChange={handleChange}
        >
          <option value="">Selecciona un protocolista</option>
          {protocolists.map(protocolista => (
            <option key={protocolista.id} value={protocolista.nombre}>
              {protocolista.nombre}
            </option>
          ))}
        </select>

        <label>Factura No.:</label>
        <input
          type="text"
          name="facturaNo"
          value={formData.facturaNo}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
        />

        <label>ESC:</label>
        <input
          type="text"
          name="esc"
          value={formData.esc}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
        />

        {/* Inputs numéricos con formato contable */}
        <label>Fact. Canceladas:</label>
        <input
          type="text"
          name="factCanceladas"
          value={formData.factCanceladas}
          onChange={handleChange}
          onBlur={handleBlur} // Formatear al salir del input
          onFocus={(e) => e.target.select()}
        />

        <label>Fact. Sin Cancelar:</label>
        <input
          type="text"
          name="factSinCancelar"
          value={formData.factSinCancelar}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Total Fact. Sin Cancelar:</label>
        <input
          type="text"
          name="totalFactSinCancelar"
          value={formData.totalFactSinCancelar}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Total Fact. Canceladas:</label>
        <input
          type="text"
          name="totalFactCanceladas"
          value={formData.totalFactCanceladas}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Fecha:</label>
        <input
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
        />

        <label>Rentas PSE:</label>
        <input
          type="text"
          name="rentasPse"
          value={formData.rentasPse}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Rentas Efectivo:</label>
        <input
          type="text"
          name="rentasEfectivo"
          value={formData.rentasEfectivo}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Registro PSE:</label>
        <input
          type="text"
          name="registroPse"
          value={formData.registroPse}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Registro Efectivo:</label>
        <input
          type="text"
          name="registroEfectivo"
          value={formData.registroEfectivo}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Total R YR:</label>
        <input
          type="text"
          name="totalRYR"
          value={formData.totalRYR}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Devolución:</label>
        <input
          type="text"
          name="devolucion"
          value={formData.devolucion}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Excedentes:</label>
        <input
          type="text"
          name="excedentes"
          value={formData.excedentes}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Total Rentas y Registro:</label>
        <input
          type="text"
          name="totalRentasRegistro"
          value={formData.totalRentasRegistro}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
        />

        <label>Observaciones:</label>
        <input
          type="text"
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
        />

        <button type="submit">Añadir Registro</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Protocolista</th>
            <th>Factura No.</th>
            <th>ESC</th>
            <th>Fact. Canceladas</th>
            <th>Fact. Sin Cancelar</th>
          </tr>
        </thead>
        <tbody>
          {registros.length > 0 ? (
            registros.map((registro) => (
              <tr key={registro.id}>
                <td>{registro.protocolista}</td>
                <td>{registro.factura_no}</td>
                <td>{registro.esc}</td>
                <td>{formatToCurrency(registro.fact_canceladas)}</td>
                <td>{formatToCurrency(registro.fact_sin_cancelar)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No hay registros disponibles</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Contabilidad;
