import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCases } from '../features/caseSlice';
import { fetchProtocolists } from '../features/protocolistSlice';
import { fetchPdfData } from '../features/pdfDataSlice';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CaseForm.css';
import { useTable, useFilters, useSortBy } from 'react-table';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const CaseForm = () => {
  const dispatch = useDispatch();
  const { cases, status: casesStatus } = useSelector((state) => state.cases);
  const { protocolists, status: protocolistsStatus } = useSelector((state) => state.protocolists);
  const { pdfData, status: pdfDataStatus } = useSelector((state) => state.pdfData);

  const [currentCase, setCurrentCase] = useState(null);
  const [form, setForm] = useState({
    fecha: new Date(),
    escritura: '',
    radicado: '',
    protocolista: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (casesStatus === 'idle') {
      dispatch(fetchCases());
    }
    if (protocolistsStatus === 'idle') {
      dispatch(fetchProtocolists());
    }
    if (pdfDataStatus === 'idle') {
      dispatch(fetchPdfData());
    }
  }, [casesStatus, protocolistsStatus, pdfDataStatus, dispatch]);

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

  const validateForm = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'escritura':
        if (!/^\d+$/.test(value)) {
          errorMsg = 'La escritura debe ser un número entero.';
        }
        break;
      case 'radicado':
        if (!value) {
          errorMsg = 'El radicado es obligatorio.';
        }
        break;
      case 'protocolista':
        if (!value) {
          errorMsg = 'Debe seleccionar un protocolista.';
        }
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: errorMsg,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validateForm(name, value);
  };

  const handleDateChange = (date) => {
    setForm({ ...form, fecha: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      toast.error('Corrija los errores antes de enviar el formulario.');
      return;
    }

    try {
      if (!form.fecha || !form.escritura || !form.radicado || !form.protocolista) {
        toast.error('Todos los campos son obligatorios');
        return;
      }

      const caseData = {
        fecha: form.fecha.toISOString().split('T')[0],
        escritura: form.escritura,
        radicado: form.radicado,
        protocolista: form.protocolista,
        observaciones: form.observaciones
      };

      if (currentCase) {
        await axios.put(`http://127.0.0.1:5000/cases/${currentCase.id}`, caseData);
        setCurrentCase(null);
      } else {
        await axios.post('http://127.0.0.1:5000/cases', caseData);
      }

      setForm({
        fecha: new Date(),
        escritura: '',
        radicado: '',
        protocolista: '',
        observaciones: ''
      });
      dispatch(fetchCases());
      toast.success('Caso guardado exitosamente');
    } catch (error) {
      console.error('Error adding/updating case:', error);
      toast.error('Hubo un problema al guardar el caso. Por favor, inténtelo de nuevo más tarde.');
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
        dispatch(fetchCases());
        Swal.fire('¡Eliminado!', 'El caso ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error deleting case:', error);
        Swal.fire('Error', 'Hubo un problema al eliminar el caso.', 'error');
      }
    }
  }, [dispatch]);

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
        dispatch(fetchCases());
        Swal.fire('Éxito', 'Nuevo radicado añadido.', 'success');
      } catch (error) {
        console.error('Error adding new radicado:', error);
        Swal.fire('Error', 'Hubo un problema al añadir el nuevo radicado.', 'error');
      }
    }
  }, [dispatch]);

  const handleSendEmail = useCallback(async (caseItem) => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/send_email', { 
        radicado: caseItem.radicado,
        use_outlook: true
      });
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      toast.error('Hubo un problema al enviar el correo');
    }
  }, []);

  const isRadicadoInPdf = useMemo(() => (radicado) => {
    return pdfData.some((pdf) => {
      const pdfRadicado = pdf.data["RADICADO N°"]?.trim();
      const caseRadicado = radicado?.trim();
      return pdfRadicado === caseRadicado;
    });
  }, [pdfData]);

  const data = useMemo(() => cases, [cases]);
  const columns = useMemo(() => [
    {
      Header: 'Fecha',
      accessor: 'fecha',
      Filter: DefaultColumnFilter,
      maxWidth: 150, // Establecer un ancho máximo
    },
    {
      Header: 'Escritura',
      accessor: 'escritura',
      Filter: DefaultColumnFilter,
      maxWidth: 150, // Establecer un ancho máximo
    },
    {
      Header: 'Radicado',
      accessor: 'radicado',
      Cell: ({ row }) => (
        <RadicadoDropdown caseId={row.original.id} initialRadicado={row.original.radicado} />
      ),
      Filter: DefaultColumnFilter,
      maxWidth: 150, // Establecer un ancho máximo
    },
    {
      Header: 'Protocolista',
      accessor: 'protocolista',
      Filter: DefaultColumnFilter,
      maxWidth: 150, // Establecer un ancho máximo
    },
    {
      Header: 'Observaciones',
      accessor: 'observaciones',
      Filter: DefaultColumnFilter,
      maxWidth: 150, // Establecer un ancho máximo
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      disableSortBy: true,
      disableFilters: true,
      Cell: ({ row }) => (
        <div className="actions-container">
          <button className="btn-edit" onClick={() => handleEdit(row.original)}>
            <i className="fas fa-edit"></i> Editar
          </button>
          <button className="btn-delete" onClick={() => handleDelete(row.original.id)}>
            <i className="fas fa-trash"></i> Eliminar
          </button>
          <button className="btn-add" onClick={() => handleAddRadicado(row.original)}>
            <i className="fas fa-plus"></i> Añadir Radicado
          </button>
          <button className="btn-email" onClick={() => handleSendEmail(row.original)}>
            <i className="fas fa-envelope"></i> Enviar Documento
          </button>
        </div>
      ),
      maxWidth: 150, // Establecer un ancho máximo
    }
  ], [handleEdit, handleDelete, handleAddRadicado, handleSendEmail]);

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
        dispatch(fetchCases());
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
      return <span>{initialRadicado || 'Sin radicado'}</span>;
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
                  <th key={column.id} {...column.getHeaderProps()} style={{ maxWidth: column.maxWidth }}>
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
        <input 
          type="text" 
          name="escritura" 
          value={form.escritura} 
          onChange={handleChange} 
          placeholder="Ej: 12345" 
          className={errors.escritura ? 'input-error' : ''}
        />
        {errors.escritura && <span className="error-message">{errors.escritura}</span>}

        <input 
          type="text" 
          name="radicado" 
          value={form.radicado} 
          onChange={handleChange} 
          placeholder="Ej: 20240101234432" 
          className={errors.radicado ? 'input-error' : ''}
        />
        {errors.radicado && <span className="error-message">{errors.radicado}</span>}

        <select 
          name="protocolista" 
          value={form.protocolista} 
          onChange={handleChange} 
          className={errors.protocolista ? 'input-error' : ''}
        >
          <option value="">Selecciona un protocolista</option>
          {protocolists.map((protocolista) => (
            <option key={protocolista.id} value={protocolista.nombre}>{protocolista.nombre}</option>
          ))}
        </select>
        {errors.protocolista && <span className="error-message">{errors.protocolista}</span>}

        <textarea 
          name="observaciones" 
          value={form.observaciones} 
          onChange={handleChange} 
          placeholder="Observaciones adicionales (opcional)"
        ></textarea>
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

const fetchRadicados = async (caseId) => {
  try {
    const response = await axios.get(`http://127.0.0.1:5000/cases/${caseId}/radicados`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching radicados for case ${caseId}:`, error);
    toast.error('No se pudieron cargar los radicados. Por favor, inténtelo de nuevo más tarde.');
    return [];
  }
};

export default CaseForm;
