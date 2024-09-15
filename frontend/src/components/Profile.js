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
        <>
          <div className="profile-item">
            <strong>Nombre completo:</strong>
            <p>{user.full_name} {user.last_name}</p>
          </div>
          <div className="profile-item">
            <strong>Correo Electrónico:</strong>
            <p>{user.email}</p>
          </div>
          <div className="profile-item">
            <strong>Teléfono:</strong>
            <p>{user.phone_number}</p>
          </div>
          <div className="profile-item">
            <strong>Nombre de Usuario:</strong>
            <p>{user.username}</p>
          </div>
          <div className="profile-item">
            <strong>Fecha de Nacimiento:</strong>
            <p>{new Date(user.birth_date).toDateString()}</p>
          </div>
          <div className="profile-item">
            <strong>Edad:</strong>
            <p>{calculateAge(user.birth_date)} años</p>
          </div>
          <div className="profile-item">
            <strong>Rol:</strong>
            <p>{user.role}</p>
          </div>
          <div className="profile-item">
            <strong>Creado en:</strong>
            <p>{new Date(user.created_at).toLocaleString()}</p>
          </div>
        </>
      ) : (
        <p>Cargando datos del usuario...</p>
      )}
    </div>
  );
};

export default Profile;
