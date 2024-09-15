import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react';
import './Register.css';

const Register = () => {
  const { user, isAuthenticated } = useAuth0();
  const [form, setForm] = useState({
    full_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    birth_date: '',
    username: '',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const [firstName, ...lastNameParts] = user.name.split(' ');
      const lastName = lastNameParts.join(' ');
      setForm({
        full_name: firstName || '',
        last_name: lastName || '',
        phone_number: '',
        email: user.email || '',
        birth_date: '',
        username: '',
      });
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const value = e.target.name !== 'email' ? e.target.value.toUpperCase() : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (!form.full_name || !form.last_name || !form.phone_number || !form.email || !form.birth_date) {
            toast.error('Todos los campos son obligatorios.');
            return;
        }
        
        await axios.post('http://127.0.0.1:5000/userprofiles', form);
        toast.success('Usuario creado exitosamente');
        
        // Reset form after successful submission
        setForm({
            full_name: '',
            last_name: '',
            phone_number: '',
            email: '',
            birth_date: '',
            username: '',
        });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        toast.error('Hubo un problema al crear el usuario. Por favor, inténtelo de nuevo más tarde.');
    }
};


  return (
    <div className="register-container">
      <h2>Registrar Nuevo Usuario</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre completo:
          <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
        </label>
        <label>
          Apellido completo:
          <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required />
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
          <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} />
        </label>
        <button type="submit">Crear Usuario</button>
      </form>
    </div>
  );
};

export default Register;
