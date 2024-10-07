import React, { useState, useEffect } from 'react';
import { Select, Table, Statistic, Radio, Divider, Input, DatePicker } from 'antd';
import axios from 'axios';
import './Rentas.css'; // Estilo personalizado

const { Option } = Select;
const { RangePicker } = DatePicker;

const Rentas = () => {
    const [protocolistas, setProtocolistas] = useState([]);
    const [casos, setCasos] = useState([]);
    const [totalPagado, setTotalPagado] = useState(0);
    const [selectedProtocolista, setSelectedProtocolista] = useState('');
    const [selectionType, setSelectionType] = useState('checkbox'); // Tipo de selección
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Filas seleccionadas
    const [selectedRowsData, setSelectedRowsData] = useState([]); // Data of selected rows
    const [filtro, setFiltro] = useState(''); // Estado para el filtro
    const [searchInput, setSearchInput] = useState(''); // Valor del input de búsqueda
    const [filteredCasos, setFilteredCasos] = useState([]); // Casos filtrados
    const [dateRange, setDateRange] = useState([]); // Filtro de rango de fechas

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
            setFilteredCasos(casosData); // Inicializar los casos filtrados
            setSelectedRowKeys([]); // Resetear la selección al cambiar de protocolista
            setSelectedRowsData([]); // Reset selected rows data
            setTotalPagado(0); // Resetear el total pagado
        } catch (error) {
            console.error('Error al obtener los casos:', error);
        }
    };

    // Manejar el cambio del filtro (columna a buscar)
    const handleFiltroChange = (value) => {
        setFiltro(value);
        setSearchInput(''); // Limpiar el input de búsqueda al cambiar de filtro
    };

    // Manejar el cambio del input de búsqueda
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        aplicarFiltro(value, dateRange);
    };

    // Manejar el cambio del rango de fechas
    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
        aplicarFiltro(searchInput, dates);
    };

    // Aplicar los filtros
    const aplicarFiltro = (inputValue, dateRange) => {
        let casosFiltrados = casos;

        if (inputValue) {
            casosFiltrados = casos.filter((caso) => {
                if (filtro === 'num_escritura') {
                    return caso.num_escritura.toString().includes(inputValue);
                } else if (filtro === 'radicado') {
                    return caso.radicado.toString().includes(inputValue);
                } else if (filtro === 'total_pagado') {
                    return caso.total_pagado.toString().includes(inputValue);
                }
                return true;
            });
        }

        if (dateRange && dateRange.length === 2) {
            casosFiltrados = casosFiltrados.filter((caso) => {
                const casoFecha = new Date(caso.fecha_escritura);
                return casoFecha >= dateRange[0]._d && casoFecha <= dateRange[1]._d;
            });
        }

        setFilteredCasos(casosFiltrados);
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
    ];

    // Configuración de la selección de filas
    const onSelectChange = (newSelectedRowKeys, selectedRows) => {
        const updatedSelectedRows = [...selectedRowsData, ...selectedRows.filter(row => !selectedRowsData.includes(row))];

        // Mantener la selección y las nuevas selecciones
        setSelectedRowKeys(newSelectedRowKeys);
        setSelectedRowsData(updatedSelectedRows);

        // Calcular el total pagado solo de los casos seleccionados
        const total = updatedSelectedRows.reduce((acc, caso) => acc + (parseFloat(caso.total_pagado) || 0), 0);
        setTotalPagado(total);
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

            {/* Filtros de búsqueda */}
            <Select
                placeholder="Seleccionar Filtro"
                onChange={handleFiltroChange}
                style={{ width: 200, marginLeft: 10 }}
                value={filtro}
            >
                <Option value="num_escritura">Número de Escritura</Option>
                <Option value="radicado">Radicado</Option>
                <Option value="total_pagado">Total Pagado</Option>
            </Select>

            {/* Input de búsqueda */}
            {filtro && (
                <Input
                    style={{ width: 200, marginLeft: 10 }}
                    placeholder={`Buscar por ${filtro}`}
                    value={searchInput}
                    onChange={handleSearchChange}
                />
            )}

            {/* Filtro de rango de fechas */}
            <RangePicker
                onChange={handleDateRangeChange}
                style={{ marginLeft: 10 }}
            />

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
                dataSource={filteredCasos}
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
