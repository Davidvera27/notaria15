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
    const [selectionType, setSelectionType] = useState('checkbox');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRowsData, setSelectedRowsData] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filteredCasos, setFilteredCasos] = useState([]);
    const [dateRange, setDateRange] = useState([]);

    useEffect(() => {
        const fetchProtocolistas = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/protocolists');
                setProtocolistas(response.data);
            } catch (error) {
                console.error('Error al obtener protocolistas:', error);
            }
        };
        fetchProtocolistas();
    }, []);

    const handleProtocolistaChange = async (protocolistaId) => {
        setSelectedProtocolista(protocolistaId);
        try {
            const response = await axios.get(`http://127.0.0.1:5000/rentas/${protocolistaId}`);
            const casosData = response.data;
            setCasos(casosData);
            setFilteredCasos(casosData);
            setSelectedRowKeys([]);
            setSelectedRowsData([]);
            setTotalPagado(0);
        } catch (error) {
            console.error('Error al obtener los casos:', error);
        }
    };

    const handleFiltroChange = (value) => {
        setFiltro(value);
        setSearchInput('');
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        aplicarFiltro(value, dateRange);
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
        aplicarFiltro(searchInput, dates);
    };

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
            render: (value) => `$${parseFloat(value).toFixed(2)}`,
        },
    ];

    const onSelectChange = (newSelectedRowKeys, selectedRows) => {
        const updatedSelectedRows = [...selectedRowsData, ...selectedRows.filter(row => !selectedRowsData.includes(row))];
        setSelectedRowKeys(newSelectedRowKeys);
        setSelectedRowsData(updatedSelectedRows);
        const total = updatedSelectedRows.reduce((acc, caso) => acc + (parseFloat(caso.total_pagado) || 0), 0);
        setTotalPagado(total);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    return (
        <div className="rentas-container">
            <div className="fixed-header">
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

                {filtro && (
                    <Input
                        style={{ width: 200, marginLeft: 10 }}
                        placeholder={`Buscar por ${filtro}`}
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
                )}

                <RangePicker
                    onChange={handleDateRangeChange}
                    style={{ marginLeft: 10 }}
                />

                <Radio.Group
                    onChange={(e) => setSelectionType(e.target.value)}
                    value={selectionType}
                    style={{ marginTop: 20 }}
                >
                    <Radio value="checkbox">Checkbox</Radio>
                    <Radio value="radio">Radio</Radio>
                </Radio.Group>

                <Divider />
            </div>

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

            <div className="fixed-total">
                <Statistic title="Total Pagado" value={totalPagado} precision={2} prefix="$" />
            </div>
        </div>
    );
};

export default Rentas;
