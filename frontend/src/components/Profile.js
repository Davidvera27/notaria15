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

    return (
        <div className="profile-container">
            <div className="profile-avatar">
                <img src={user.picture} alt={user.name} className="avatar-image" />
            </div>
            <div className="profile-details">
                <div className="profile-field">
                    <label>Nombre completo:</label>
                    <input type="text" value={profileData.fullName} readOnly />
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
                    <label>Cumpleaños:</label>
                    <input type="text" value={profileData.birthDate} readOnly />
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
