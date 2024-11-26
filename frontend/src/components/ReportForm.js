import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReportForm = () => {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reportType, setReportType] = useState('pdf');
    const [protocolists, setProtocolists] = useState([]);
    const [selectedProtocolist, setSelectedProtocolist] = useState(0); // 0 para "Todos los protocolistas"
    const [caseType, setCaseType] = useState('pending');

    useEffect(() => {
        const fetchProtocolists = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/protocolists');
                // Añadimos la opción de "Todos los protocolistas" al inicio del listado
                const allOption = { id: 0, nombre: 'Todos los protocolistas' };
                setProtocolists([allOption, ...response.data]);
            } catch (error) {
                console.error('Error fetching protocolists:', error);
            }
        };
        fetchProtocolists();
    }, []);

    const handleGenerateReport = async () => {
        try {
            const response = await axios.post(
                'http://127.0.0.1:5000/report',
                {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    report_type: reportType,
                    protocolista_id: selectedProtocolist,
                    case_type: caseType,
                },
                { responseType: 'blob' } // Para manejar archivos binarios como PDF o Excel
            );

            let protocolistaName;
            if (selectedProtocolist === 0) {
                protocolistaName = 'Todos_los_protocolistas';
            } else {
                protocolistaName = protocolists
                    .find((p) => p.id === parseInt(selectedProtocolist))
                    ?.nombre.replace(/ /g, '_');
            }

            let fileName;
            switch (caseType) {
                case 'pending':
                    fileName = `Radicados_Pendientes_${protocolistaName}`;
                    break;
                case 'finished':
                    fileName = `Radicados_Finalizados_${protocolistaName}`;
                    break;
                case 'both':
                    fileName = `Radicados_Completos_${protocolistaName}`;
                    break;
                default:
                    fileName = 'Reporte_Notarial';
            }

            // Crear y descargar el archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `${fileName}.${reportType === 'excel' ? 'xlsx' : 'pdf'}`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    return (
        <div className="report-form">
            <h3>Generar Reporte</h3>
            <div>
                <label>Fecha de Inicio:</label>
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                />
            </div>
            <div>
                <label>Fecha de Fin:</label>
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy-MM-dd"
                />
            </div>
            <div>
                <label>Protocolista:</label>
                <select
                    value={selectedProtocolist}
                    onChange={(e) => setSelectedProtocolist(e.target.value)}
                >
                    {protocolists.map((protocolista) => (
                        <option key={protocolista.id} value={protocolista.id}>
                            {protocolista.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label>Formato del Reporte:</label>
                <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                </select>
            </div>
            <div>
                <label>Tipo de Casos:</label>
                <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                >
                    <option value="pending">Solo casos pendientes</option>
                    <option value="finished">Solo casos finalizados</option>
                    <option value="both">Informe completo</option>
                </select>
            </div>
            <button onClick={handleGenerateReport}>Generar Reporte</button>
        </div>
    );
};

export default ReportForm;
