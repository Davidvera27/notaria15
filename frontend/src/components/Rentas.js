import React, { useState, useEffect } from 'react';
import { Select, Table, Statistic, Radio, Divider } from 'antd';
import axios from 'axios';
import './Rentas.css'; // Estilo personalizado

const { Option } = Select;

const Rentas = () => {
    const [protocolistas, setProtocolistas] = useState([]);
    const [casos, setCasos] = useState([]);
    const [totalPagado, setTotalPagado] = useState(0);
    const [selectedProtocolista, setSelectedProtocolista] = useState('');
    const [selectionType, setSelectionType] = useState('checkbox'); // Tipo de selección
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Filas seleccionadas

    // Obtener la lista de protocolistas desde el backend
    useEffect(() => {
        const fetchProtocolistas = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/protocolists'); // Ruta correcta del backend
                setProtocolistas(response.data);
            } catch (error) {
                console.error('Error al obtener protocolistas:', error);
            }
        };
        fetchProtocolistas();
    }, []);

    // Manejar la selección del protocolista y obtener sus casos
    const handleProtocolistaChange = async (protocolistaId) => {
        setSelectedProtocolista(protocolistaId);
        try {
            const response = await axios.get(`http://127.0.0.1:5000/rentas/${protocolistaId}`);
            const casosData = response.data;
            setCasos(casosData);
            setSelectedRowKeys([]); // Resetear la selección al cambiar de protocolista
            setTotalPagado(0); // Resetear el total pagado
        } catch (error) {
            console.error('Error al obtener los casos:', error);
        }
    };

    // Configuración de las columnas de la tabla
    const columns = [
        {
            title: 'Número de Escritura',
            dataIndex: 'num_escritura',
            key: 'num_escritura',
        },
        {
            title: 'Fecha de Escritura',
            dataIndex: 'fecha_escritura',
            key: 'fecha_escritura',
        },
        {
            title: 'Radicado',
            dataIndex: 'radicado',
            key: 'radicado',
        },
        {
            title: 'Total de Impuesto De Rentas',
            dataIndex: 'total_pagado',
            key: 'total_pagado',
            render: (value) => `$${parseFloat(value).toFixed(2)}`, // Formato moneda
        },
        {
            title: 'Fecha de Vigencia en Rentas',
            dataIndex: 'vigencia_rentas',
            key: 'vigencia_rentas',
        }
    ];

    // Configuración de la selección de filas
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);

        // Filtrar los casos seleccionados
        const casosSeleccionados = casos.filter(caso => newSelectedRowKeys.includes(caso.id));

        // Calcular el total pagado solo de los casos seleccionados
        const total = casosSeleccionados.reduce((acc, caso) => acc + (parseFloat(caso.total_pagado) || 0), 0);
        
        // Si no hay ningún caso seleccionado, el total debe ser 0
        setTotalPagado(total > 0 ? total : 0);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange, // Manejar el cambio de selección
    };

    return (
        <div className="rentas-container">
            <h2>Gestión de Rentas</h2>
            <p>Selecciona un protocolista para ver sus liquidaciones de rentas.</p>

            <Select
                showSearch
                placeholder="Seleccionar Protocolista"
                optionFilterProp="children"
                onChange={handleProtocolistaChange}
                style={{ width: 300 }}
                value={selectedProtocolista}
            >
                <Option value="">Seleccionar un protocolista</Option>
                {protocolistas.map((protocolista) => (
                    <Option key={protocolista.id} value={protocolista.id}>
                        {protocolista.nombre}
                    </Option>
                ))}
            </Select>

            {/* Selección de checkbox o radio */}
            <Radio.Group
                onChange={(e) => setSelectionType(e.target.value)}
                value={selectionType}
                style={{ marginTop: 20 }}
            >
                <Radio value="checkbox">Checkbox</Radio>
                <Radio value="radio">Radio</Radio>
            </Radio.Group>

            <Divider />

            {/* Tabla con selección de filas */}
            <Table
                rowSelection={{
                    type: selectionType,
                    ...rowSelection,
                }}
                columns={columns}
                dataSource={casos}
                rowKey="id"
                pagination={false}
                style={{ marginTop: 20 }}
                locale={{ emptyText: 'No data' }}
            />

            <div style={{ marginTop: 20 }}>
                <Statistic title="Total Pagado" value={totalPagado} precision={2} prefix="$" />
            </div>
        </div>
    );
};

export default Rentas;
