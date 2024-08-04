import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useTable, useFilters, useSortBy } from 'react-table';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';

const CaseForm = () => {
  const [cases, setCases] = useState([]);
  const [protocolists, setProtocolists] = useState([]);
  const [pdfData, setPdfData] = useState([]);
  const [form, setForm] = useState({
    fecha: new Date(),
    escritura: '',
    radicado: '',
    protocolista: '',
    observaciones: ''
  });
  const [currentCase, setCurrentCase] = useState(null);
  const [radicados, setRadicados] = useState({});

  const fetchCases = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
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
    } catch (error) {
      console.error('Error fetching PDF data:', error);
    }
  }, []);

  const fetchRadicados = useCallback(async (caseId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/cases/${caseId}/radicados`);
      setRadicados((prev) => ({ ...prev, [caseId]: response.data }));
    } catch (error) {
      console.error('Error fetching radicados:', error);
    }
  }, []);

  useEffect(() => {
    fetchCases();
    fetchProtocolists();
    fetchPdfData();
    const intervalId = setInterval(() => {
      fetchCases();
      fetchPdfData();
    }, 10000); // Refrescar cada 10 segundos
    return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar el componente
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
        fetchCases(); // Actualizar la lista de casos para reflejar el nuevo radicado
        fetchRadicados(caseItem.id); // Actualizar la lista de radicados
        Swal.fire('Éxito', 'Nuevo radicado añadido.', 'success');
      } catch (error) {
        console.error('Error adding new radicado:', error);
        Swal.fire('Error', 'Hubo un problema al añadir el nuevo radicado.', 'error');
      }
    }
  }, [fetchCases, fetchRadicados]);

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
      Filter: DefaultColumnFilter,
      Cell: ({ row }) => {
        const radicadosList = radicados[row.original.id] || [];
        return radicadosList.length > 1 ? (
          <select
            value={row.original.radicado}
            onChange={(e) => console.log(`Radicado seleccionado: ${e.target.value}`)}
          >
            {radicadosList.map((r) => (
              <option key={r.id} value={r.radicado}>{r.radicado}</option>
            ))}
          </select>
        ) : (
          <span>{row.original.radicado}</span>
        );
      }
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
  ], [handleEdit, handleDelete, handleAddRadicado, radicados]); // Ensure handleAddRadicado and radicados are included

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useFilters, useSortBy);

  return (
    <div>
      <h2>Casos</h2>
      <div className="table-container">
        <table {...getTableProps()} className="case-table">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className={isRadicadoInPdf(row.original.radicado) ? 'highlighted' : ''}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleSubmit}>
        <DatePicker
          selected={form.fecha}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
        />
        <input
          type="text"
          name="escritura"
          value={form.escritura}
          onChange={handleChange}
          placeholder="Escritura"
          required
        />
        <input
          type="text"
          name="radicado"
          value={form.radicado}
          onChange={handleChange}
          placeholder="Radicado"
          required
        />
        <select
          name="protocolista"
          value={form.protocolista}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona un protocolista</option>
          {protocolists.map(protocolist => (
            <option key={protocolist.id} value={protocolist.nombre}>
              {protocolist.nombre}
            </option>
          ))}
        </select>
        <textarea
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
          placeholder="Observaciones"
        />
        <button type="submit">{currentCase ? 'Actualizar' : 'Agregar'}</button>
      </form>
    </div>
  );
};

function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
  return (
    <input
      value={filterValue || ''}
      onChange={e => setFilter(e.target.value || undefined)}
      placeholder={`Buscar registros...`}
    />
  );
}

export default CaseForm;
