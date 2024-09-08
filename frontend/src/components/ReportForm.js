import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReportForm = () => {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reportType, setReportType] = useState('pdf');
    const [protocolists, setProtocolists] = useState([]);
    const [selectedProtocolist, setSelectedProtocolist] = useState('');
    const [caseType, setCaseType] = useState('pending');

    useEffect(() => {
        const fetchProtocolists = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/protocolists');
                setProtocolists(response.data);
            } catch (error) {
                console.error('Error fetching protocolists:', error);
            }
        };
        fetchProtocolists();
    }, []);

    const handleGenerateReport = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/report', {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                report_type: reportType,
                protocolista_id: selectedProtocolist,
                case_type: caseType
            }, { responseType: 'blob' });

            const protocolistaName = protocolists.find(p => p.id === selectedProtocolist)?.nombre.replace(' ', '_');
            let fileName;
            
            switch(caseType) {
                case 'pending':
                    fileName = `Radicados_Pendientes_${protocolistaName}`;
                    break;
                case 'finished':
                    fileName = `Radicados_Enviados_${protocolistaName}`;
                    break;
                case 'both':
                    fileName = `Radicados_Completos_${protocolistaName}`;
                    break;
                default:
                    fileName = 'reporte_notarial';
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${fileName}.${reportType === 'excel' ? 'xlsx' : 'pdf'}`);
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
                <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
            </div>
            <div>
                <label>Fecha de Fin:</label>
                <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
            </div>
            <div>
                <label>Protocolista:</label>
                <select value={selectedProtocolist} onChange={(e) => setSelectedProtocolist(e.target.value)}>
                    <option value="">Seleccionar un protocolista</option>
                    {protocolists.map(protocolista => (
                        <option key={protocolista.id} value={protocolista.id}>
                            {protocolista.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label>Formato del Reporte:</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                </select>
            </div>
            <div>
                <label>Tipo de Casos:</label>
                <select value={caseType} onChange={(e) => setCaseType(e.target.value)}>
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
