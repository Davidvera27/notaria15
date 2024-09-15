import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);

  // Obtener la información del usuario (id = 6 en este caso)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/userdata/6');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Calcular la edad del usuario
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  return (
    <div className="profile-container">
      {user ? (
        <div>
          <h1>Perfil de Usuario</h1>
          <p><strong>Nombre completo:</strong> {user.full_name} {user.last_name}</p>
          <p><strong>Correo Electrónico:</strong> {user.email}</p>
          <p><strong>Teléfono:</strong> {user.phone_number}</p>
          <p><strong>Nombre de Usuario:</strong> {user.username}</p>
          <p><strong>Fecha de Nacimiento:</strong> {user.birth_date}</p>
          <p><strong>Edad:</strong> {calculateAge(user.birth_date)} años</p>
          <p><strong>Rol:</strong> {user.role}</p>
          <p><strong>Creado en:</strong> {new Date(user.created_at).toLocaleString()}</p>
        </div>
      ) : (
        <p>Cargando datos del usuario...</p>
      )}
    </div>
  );
};

export default Profile;
