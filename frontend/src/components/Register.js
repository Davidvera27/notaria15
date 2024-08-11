import React, { useState } from 'react';
import axios from 'axios';
import './Register.css'; // Importando el nuevo archivo de estilos

const Register = () => {
  const [form, setForm] = useState({
    first_name1: '',
    first_name2: '',
    last_name1: '',
    last_name2: '',
    phone_number: '',
    email: '',
    birth_date: '',
    username: '',
  });

  const handleChange = (e) => {
    // Convertir a mayúsculas sostenidas si no es el campo de correo electrónico
    const value = e.target.name !== 'email' ? e.target.value.toUpperCase() : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:5000/userprofiles', form);
      alert('Usuario creado exitosamente');
      setForm({
        first_name1: '',
        first_name2: '',
        last_name1: '',
        last_name2: '',
        phone_number: '',
        email: '',
        birth_date: '',
        username: '',
      });
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      alert('Hubo un problema al crear el usuario');
    }
  };

  return (
    <div className="register-container">
      <h2>Registrar Nuevo Usuario</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Primer Nombre:
          <input type="text" name="first_name1" value={form.first_name1} onChange={handleChange} required />
        </label>
        <label>
          Segundo Nombre:
          <input type="text" name="first_name2" value={form.first_name2} onChange={handleChange} />
        </label>
        <label>
          Primer Apellido:
          <input type="text" name="last_name1" value={form.last_name1} onChange={handleChange} required />
        </label>
        <label>
          Segundo Apellido:
          <input type="text" name="last_name2" value={form.last_name2} onChange={handleChange} />
        </label>
        <label>
          Número telefónico:
          <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange} required />
        </label>
        <label>
          Correo Electrónico:
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Fecha de nacimiento:
          <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} required />
        </label>
        <label>
          Nombre de usuario:
          <input type="text" name="username" value={form.username} onChange={handleChange} required />
        </label>
        <button type="submit">Crear Usuario</button>
      </form>
    </div>
  );
};

export default Register;
