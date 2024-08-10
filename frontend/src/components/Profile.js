import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Profile.css';

const Profile = () => {
  const { user, isAuthenticated } = useAuth0();
  const [userProfile, setUserProfile] = useState({
    id: null,
    first_name1: '',
    first_name2: '',
    last_name1: '',
    last_name2: '',
    phone_number: '',
    email: user.email || '',
    birth_date: '',
    username: user.nickname || ''
  });

  // Fetch user profile only if it exists
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`/userprofiles?email=${user.email}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile({
          id: profile.id,
          first_name1: profile.first_name1 || '',
          first_name2: profile.first_name2 || '',
          last_name1: profile.last_name1 || '',
          last_name2: profile.last_name2 || '',
          phone_number: profile.phone_number || '',
          birth_date: profile.birth_date || '',
          username: profile.username || user.nickname || '',
          email: profile.email || user.email || ''
        });
      } else {
        alert('Perfil no encontrado. Por favor, contacte al administrador.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      alert('Hubo un error al recuperar su perfil.');
    }
  }, [user.email, user.nickname]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile]);

  const handleInputChange = (e) => {
    setUserProfile({ ...userProfile, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile.id) {
      alert('No se puede actualizar el perfil porque el ID es nulo.');
      return;
    }
    try {
      const response = await fetch(`/userprofiles/${userProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });

      if (response.ok) {
        alert('¡Perfil actualizado exitosamente!');
      } else {
        alert('No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error actualizando el perfil:', error);
      alert('No se pudo actualizar el perfil');
    }
  };

  return (
    isAuthenticated && (
      <div className="profile-container">
        <div className="profile-header">
          <img src={user.picture} alt="Profile" className="profile-picture" />
          <h2>{`${userProfile.first_name1} ${userProfile.first_name2} ${userProfile.last_name1} ${userProfile.last_name2}`}</h2>
          <p>{userProfile.email}</p>
        </div>
        <form onSubmit={handleFormSubmit}>
          <label>
            Nombre 1:
            <input type="text" name="first_name1" value={userProfile.first_name1} onChange={handleInputChange} />
          </label>
          <label>
            Nombre 2:
            <input type="text" name="first_name2" value={userProfile.first_name2} onChange={handleInputChange} />
          </label>
          <label>
            Apellido 1:
            <input type="text" name="last_name1" value={userProfile.last_name1} onChange={handleInputChange} />
          </label>
          <label>
            Apellido 2:
            <input type="text" name="last_name2" value={userProfile.last_name2} onChange={handleInputChange} />
          </label>
          <label>
            Número telefónico:
            <input type="text" name="phone_number" value={userProfile.phone_number} onChange={handleInputChange} />
          </label>
          <label>
            Fecha de nacimiento:
            <input type="date" name="birth_date" value={userProfile.birth_date} onChange={handleInputChange} />
          </label>
          <label>
            Nombre de usuario:
            <input type="text" name="username" value={userProfile.username} onChange={handleInputChange} />
          </label>
          <button type="submit">Guardar Cambios</button>
        </form>
      </div>
    )
  );
};

export default Profile;
