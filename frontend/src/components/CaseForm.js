import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CaseForm.css';
import { useTable, useFilters, useSortBy } from 'react-table';
import Swal from 'sweetalert2';

const CaseForm = () => {
  const [cases, setCases] = useState([]);
  const [protocolists, setProtocolists] = useState([]);
  const [pdfData, setPdfData] = useState([]);
  const [currentCase, setCurrentCase] = useState(null);
  const [form, setForm] = useState({
    fecha: new Date(),
    escritura: '',
    radicado: '',
    protocolista: '',
    observaciones: ''
  });

  const fetchCases = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  }, []);

  const fetchRadicados = useCallback(async (caseId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/cases/${caseId}/radicados`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching radicados for case ${caseId}:`, error);
      return [];
    }
  }, []);

  const fetchProtocolists = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/protocolists');
      setProtocolists(response.data);
    } catch (error) {
      console.error('Error fetching protocolists:', error);
    }
  }, []);

  const fetchPdfData = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/extract-data');
      setPdfData(response.data);
      console.log('PDF Data:', response.data);
    } catch (error) {
      console.error('Error fetching PDF data:', error);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      await fetchCases();
      await fetchProtocolists();
      await fetchPdfData();
    };

    fetchAllData();
    const intervalId = setInterval(fetchAllData, 10000); // Refresh every 10 seconds
    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, [fetchCases, fetchProtocolists, fetchPdfData]);

  useEffect(() => {
    if (currentCase) {
      setForm({
        ...currentCase,
        fecha: new Date(currentCase.fecha)
      });
    } else {
      setForm({
        fecha: new Date(),
        escritura: '',
        radicado: '',
        protocolista: '',
        observaciones: ''
      });
    }
  }, [currentCase]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setForm({ ...form, fecha: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const caseData = {
        ...form,
        fecha: form.fecha.toISOString().split('T')[0]
      };
      if (currentCase) {
        await axios.put(`http://127.0.0.1:5000/cases/${currentCase.id}`, caseData);
        setCurrentCase(null);
      } else {
        await axios.post('http://127.0.0.1:5000/cases', caseData);
      }
      fetchCases();
      setForm({
        fecha: new Date(),
        escritura: '',
        radicado: '',
        protocolista: '',
        observaciones: ''
      });
    } catch (error) {
      console.error('Error adding/updating case:', error);
    }
  };

  const handleEdit = useCallback((caseItem) => {
    setCurrentCase(caseItem);
  }, []);

  const handleDelete = useCallback(async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://127.0.0.1:5000/cases/${id}`);
        fetchCases();
        Swal.fire('¡Eliminado!', 'El caso ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error deleting case:', error);
        Swal.fire('Error', 'Hubo un problema al eliminar el caso.', 'error');
      }
    }
  }, [fetchCases]);

  const handleAddRadicado = useCallback(async (caseItem) => {
    if (!caseItem) {
      return Swal.fire('Error', 'No hay un caso seleccionado.', 'error');
    }

    const { value: radicado } = await Swal.fire({
      title: 'Ingrese el nuevo radicado',
      input: 'text',
      inputLabel: 'Nuevo Radicado',
      inputPlaceholder: 'Ingrese el nuevo número de radicado',
      showCancelButton: true
    });

    if (radicado) {
      try {
        await axios.post(`http://127.0.0.1:5000/cases/${caseItem.id}/radicados`, { radicado });
        fetchCases(); // Refresh case list to reflect new radicado
        Swal.fire('Éxito', 'Nuevo radicado añadido.', 'success');
      } catch (error) {
        console.error('Error adding new radicado:', error);
        Swal.fire('Error', 'Hubo un problema al añadir el nuevo radicado.', 'error');
      }
    }
  }, [fetchCases]);

  const isRadicadoInPdf = (radicado) => {
    return pdfData.some((pdf) => {
      const pdfRadicado = pdf.data["RADICADO N°"].trim();
      const caseRadicado = radicado.trim();
      return pdfRadicado === caseRadicado;
    });
  };

  const data = useMemo(() => cases, [cases]);
  const columns = useMemo(() => [
    {
      Header: 'Fecha',
      accessor: 'fecha',
      Filter: DefaultColumnFilter,
    },
    {
      Header: 'Escritura',
      accessor: 'escritura',
      Filter: DefaultColumnFilter,
    },
    {
      Header: 'Radicado',
      accessor: 'radicado',
      Cell: ({ row }) => (
        <RadicadoDropdown caseId={row.original.id} initialRadicado={row.original.radicado} />
      ),
      Filter: DefaultColumnFilter,
    },
    {
      Header: 'Protocolista',
      accessor: 'protocolista',
      Filter: DefaultColumnFilter,
    },
    {
      Header: 'Observaciones',
      accessor: 'observaciones',
      Filter: DefaultColumnFilter,
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      disableSortBy: true,
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          <button onClick={() => handleEdit(row.original)}>Editar</button>
          <button onClick={() => handleDelete(row.original.id)}>Eliminar</button>
          <button onClick={() => handleAddRadicado(row.original)}>Añadir Radicado</button>
        </>
      ),
    },
  ], [handleEdit, handleDelete, handleAddRadicado]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useFilters, useSortBy);

  const RadicadoDropdown = ({ caseId, initialRadicado }) => {
    const [radicados, setRadicados] = useState([]);

    useEffect(() => {
      const loadRadicados = async () => {
        const radicadoList = await fetchRadicados(caseId);
        setRadicados(radicadoList);
      };
      loadRadicados();
    }, [caseId]);

    const handleRadicadoChange = async (event) => {
      const selectedRadicado = event.target.value;
      try {
        await axios.put(`http://127.0.0.1:5000/cases/${caseId}`, { radicado: selectedRadicado });
        // Actualiza la lista de casos después de cambiar el radicado
        fetchCases();
      } catch (error) {
        console.error('Error updating radicado:', error);
      }
    };

    if (radicados.length > 1) {
      return (
        <select defaultValue={initialRadicado} onChange={handleRadicadoChange}>
          <option value={initialRadicado}>{initialRadicado}</option>
          {radicados.filter(r => r.radicado !== initialRadicado).map((r) => (
            <option key={r.id} value={r.radicado}>{r.radicado}</option>
          ))}
        </select>
      );
    } else {
      return <span>{initialRadicado || 'No Radicados'}</span>;
    }
  };

  return (
    <div>
      <h2>Casos</h2>
      <div className="table-container">
        <table {...getTableProps()} className="case-table">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th key={column.id} {...column.getHeaderProps()} onClick={() => !column.disableSortBy && column.toggleSortBy(!column.isSortedDesc)}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr key={row.id} {...row.getRowProps()} style={isRadicadoInPdf(row.original.radicado) ? { backgroundColor: 'lightgreen' } : {}}>
                  {row.cells.map(cell => {
                    return <td key={cell.id} {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <form className="case-form" onSubmit={handleSubmit}>
        <DatePicker
          selected={form.fecha}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          className="date-picker"
        />
        <input type="text" name="escritura" value={form.escritura} onChange={handleChange} placeholder="Escritura" />
        <input type="text" name="radicado" value={form.radicado} onChange={handleChange} placeholder="Radicado" />
        <select name="protocolista" value={form.protocolista} onChange={handleChange}>
          <option value="">Selecciona un protocolista</option>
          {protocolists.map((protocolista) => (
            <option key={protocolista.id} value={protocolista.nombre}>{protocolista.nombre}</option>
          ))}
        </select>
        <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Observaciones"></textarea>
        <button type="submit">{currentCase ? 'Actualizar' : 'Agregar'}</button>
      </form>
    </div>
  );
};

const DefaultColumnFilter = ({
  column: { filterValue, preFilteredRows, setFilter },
}) => {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ''}
      onClick={(e) => e.stopPropagation()}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
      placeholder={`Buscar ${count} registros...`}
    />
  );
};

export default CaseForm;
