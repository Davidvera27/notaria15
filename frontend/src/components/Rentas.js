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
    const [filteredCasos, setFilteredCasos] = useState([]); // Casos filtrados
    const [selectedFilter, setSelectedFilter] = useState(''); // Filtro seleccionado
    const [filterValue, setFilterValue] = useState(''); // Valor del filtro
    const [dateRange, setDateRange] = useState([]); // Rango de fechas

    // Opciones para el dropdown de filtros
    const filterOptions = [
        { value: 'num_escritura', label: 'Número de Escritura' },
        { value: 'radicado', label: 'Radicado' },
        { value: 'total_pagado', label: 'Total Pagado' }
    ];

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
            setFilteredCasos(casosData); // Actualizamos los casos filtrados con los originales
            setSelectedRowKeys([]); // Resetear la selección al cambiar de protocolista
            setTotalPagado(0); // Resetear el total pagado
        } catch (error) {
            console.error('Error al obtener los casos:', error);
        }
    };

    // Función para manejar el cambio en el filtro seleccionado
    const handleFilterChange = (value) => {
        setSelectedFilter(value);
        setFilterValue(''); // Resetear el valor del filtro al cambiar de filtro
    };

    // Función para manejar la entrada del valor del filtro
    const handleFilterValueChange = (e) => {
        const value = e.target.value;
        setFilterValue(value);
        applyFilters(value, dateRange); // Aplicar los filtros dinámicamente
    };

    // Función para manejar el cambio de rango de fechas
    const onDateChange = (dates) => {
        setDateRange(dates);
        applyFilters(filterValue, dates); // Aplicar los filtros con el nuevo rango de fechas
    };

    // Función para aplicar los filtros
    const applyFilters = (filterValue, range) => {
        let filteredData = casos;

        // Filtrar por rango de fechas
        if (range && range.length === 2) {
            const [start, end] = range;
            filteredData = filteredData.filter(caso => {
                const fechaEscritura = new Date(caso.fecha_escritura);
                return fechaEscritura >= start && fechaEscritura <= end;
            });
        }

        // Filtrar por el valor del filtro seleccionado
        if (filterValue && selectedFilter) {
            filteredData = filteredData.filter(caso => {
                return caso[selectedFilter]?.toString().includes(filterValue);
            });
        }

        setFilteredCasos(filteredData); // Actualizar los casos filtrados
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
        }
    ];

    // Configuración de la selección de filas
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);

        // Filtrar los casos seleccionados
        const casosSeleccionados = filteredCasos.filter(caso => newSelectedRowKeys.includes(caso.id));

        // Calcular el total pagado solo de los casos seleccionados
        const total = casosSeleccionados.reduce((acc, caso) => acc + (parseFloat(caso.total_pagado) || 0), 0);
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

            {/* Filtros avanzados */}
            <Select
                placeholder="Seleccione filtro"
                onChange={handleFilterChange}
                style={{ marginTop: 20, width: 300 }}
                value={selectedFilter}
            >
                {filterOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
            </Select>

            {/* Input dinámico para el valor del filtro */}
            {selectedFilter && (
                <Input
                    placeholder={`Ingrese ${filterOptions.find(opt => opt.value === selectedFilter)?.label}`}
                    value={filterValue}
                    onChange={handleFilterValueChange}
                    style={{ marginTop: 20, width: 300 }}
                />
            )}

            {/* Filtro de rango de fechas */}
            <RangePicker onChange={onDateChange} style={{ marginTop: 20 }} />

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
                dataSource={filteredCasos} // Usamos los casos filtrados
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
