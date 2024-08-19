import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth0();
    const [profileData, setProfileData] = useState({
        fullName: '',
        phoneNumber: '',
        birthDate: '',
        username: '',
        age: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editField, setEditField] = useState({});

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/profile/${user.email}`);
                setProfileData({
                    fullName: response.data.fullName || `${user.given_name} ${user.family_name}`,
                    phoneNumber: response.data.phoneNumber || '',
                    birthDate: response.data.birthDate || '',
                    username: response.data.username || '',
                    age: calculateAge(response.data.birthDate) || ''
                });
            } catch (error) {
                console.error("Error fetching profile data", error);
            }
        };

        fetchProfileData();
    }, [user]);

    const calculateAge = (birthDate) => {
        if (!birthDate) return '';
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDifference = today.getMonth() - birthDateObj.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        return age;
    };

    const getNextBirthday = (birthDate) => {
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        birthDateObj.setFullYear(today.getFullYear());

        if (birthDateObj < today) {
            birthDateObj.setFullYear(today.getFullYear() + 1);
        }

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return birthDateObj.toLocaleDateString(undefined, options);
    };

    const handleEditClick = (field) => {
        setIsEditing(true);
        setEditField({ ...editField, [field]: profileData[field] });
    };

    const handleSaveClick = async (field) => {
        try {
            await axios.put(`http://localhost:5000/api/profile/${user.email}`, {
                [field]: editField[field]
            });
            setProfileData({ ...profileData, [field]: editField[field] });
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving profile data", error);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-avatar">
                <img src={user.picture} alt={user.name} className="avatar-image" />
            </div>
            <div className="profile-details">
                <div className="profile-field">
                    <label>Nombre completo:</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={editField.fullName} 
                            onChange={(e) => setEditField({ ...editField, fullName: e.target.value })} 
                        />
                    ) : (
                        <input type="text" value={profileData.fullName} readOnly />
                    )}
                    <button onClick={() => handleEditClick('fullName')}>Editar</button>
                    <button onClick={() => handleSaveClick('fullName')}>Guardar</button>
                </div>
                <div className="profile-field">
                    <label>Correo Electrónico:</label>
                    <input type="email" value={user.email} readOnly />
                </div>
                <div className="profile-field">
                    <label>Nombre de usuario:</label>
                    <input type="text" value={profileData.username} readOnly />
                </div>
                <div className="profile-field">
                    <label>Teléfono:</label>
                    <input type="text" value={profileData.phoneNumber} readOnly />
                </div>
                <div className="profile-field">
                    <label>Próximo Cumpleaños:</label>
                    <input type="text" value={getNextBirthday(profileData.birthDate)} readOnly />
                </div>
                <div className="profile-field">
                    <label>Edad:</label>
                    <input type="text" value={profileData.age} readOnly />
                </div>
            </div>
        </div>
    );
};

export default Profile;
