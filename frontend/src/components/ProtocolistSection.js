import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProtocolistSection.css';

const ProtocolistSection = () => {
    const [protocolists, setProtocolists] = useState([]);
    const [selectedProtocolist, setSelectedProtocolist] = useState(null);
    const [cases, setCases] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/protocolists')
            .then(response => {
                console.log(response.data); // Muestra la respuesta en la consola para depuración
                setProtocolists(response.data);
            })
            .catch(error => {
                console.error('Error fetching protocolists:', error);
            });
    }, []);

    const handleSelectProtocolist = (nombre) => {
        const selected = protocolists.find(protocolist => protocolist.nombre === nombre);
        if (selected) {
            setSelectedProtocolist(selected);
            axios.get(`/api/david_restrepo_cases/${selected.id}`)
                .then(response => setCases(response.data))
                .catch(error => console.error('Error al obtener los casos:', error));
        }
    };

    return (
        <div className="protocolist-section">
            <h2>SECCIÓN DE PROTOCOLISTA</h2>
            <select onChange={(e) => handleSelectProtocolist(e.target.value)}>
                <option value="">Selecciona un protocolista</option>
                {protocolists.map(protocolist => (
                    <option key={protocolist.id} value={protocolist.nombre}>{protocolist.nombre}</option>
                ))}
            </select>

            {selectedProtocolist && (
                <div>
                    <h3>Protocolista Seleccionado: {selectedProtocolist.nombre}</h3>
                    <p>Correo: {selectedProtocolist.correo_electronico}</p>
                </div>
            )}

            {cases.length > 0 && (
                <table className="protocolist-table">
                    <thead>
                        <tr>
                            <th>Radicado</th>
                            <th>Escritura</th>
                            <th>Fecha</th>
                            <th>Actos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map(c => (
                            <tr key={c.id}>
                                <td>{c.radicado}</td>
                                <td>{c.escritura}</td>
                                <td>{c.fecha_escritura}</td>
                                <td>{c.actos}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ProtocolistSection;
