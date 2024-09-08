import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCases } from '../features/caseSlice';
import { fetchProtocolists } from '../features/protocolistSlice';
import { fetchPdfData } from '../features/pdfDataSlice';
import axios from 'axios';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CaseForm.css';
import { useTable, useFilters, useGroupBy, useSortBy } from 'react-table';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { es } from 'date-fns/locale'; // Importar idioma español

registerLocale('es', es); // Registrar el idioma español

const socket = io('http://127.0.0.1:5000');

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
    observaciones: '',
    fecha_documento: null
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

    socket.on('new_case', (newCase) => {
      dispatch(fetchCases());
    });

    socket.on('update_case', (updatedCase) => {
      dispatch(fetchCases());
    });

    return () => {
      socket.off('new_case');
      socket.off('update_case');
    };
  }, [casesStatus, protocolistsStatus, pdfDataStatus, dispatch]);

  useEffect(() => {
    if (currentCase) {
      setForm({
        ...currentCase,
        fecha: new Date(currentCase.fecha),
        fecha_documento: currentCase.fecha_documento ? new Date(currentCase.fecha_documento) : null
      });
    } else {
      setForm({
        fecha: new Date(),
        escritura: '',
        radicado: '',
        protocolista: '',
        observaciones: '',
        fecha_documento: null
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

  const handleDocumentDateChange = (date) => {
    setForm({ ...form, fecha_documento: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      toast.error('Corrija los errores antes de enviar el formulario.');
      return;
    }
  
    const radicadoExistente = cases.find(c => c.radicado === form.radicado);
    if (radicadoExistente) {
      const protocolista = radicadoExistente.protocolista;
      const fila = cases.indexOf(radicadoExistente) + 1;
      Swal.fire({
        title: 'Radicado Duplicado',
        text: `El radicado ya existe en la fila ${fila}, asignado al protocolista ${protocolista}.`,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
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
        observaciones: form.observaciones,
        fecha_documento: form.fecha_documento ? form.fecha_documento.toISOString().split('T')[0] : null
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
        observaciones: '',
        fecha_documento: null
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
        dispatch({
          type: 'cases/removeCase',
          payload: caseItem.id
        });
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      toast.error('Hubo un problema al enviar el correo');
    }
  }, [dispatch]);

  const isRadicadoInPdf = useMemo(() => (radicado) => {
    return pdfData.some((pdf) => {
      const pdfRadicado = pdf.data["RADICADO N°"]?.trim();
      const caseRadicado = radicado?.trim();
      return pdfRadicado === caseRadicado;
    });
  }, [pdfData]);

  const handleSendAllEmails = useCallback(async () => {
    const emailsToSend = cases.filter(caseItem => isRadicadoInPdf(caseItem.radicado));

    if (emailsToSend.length === 0) {
      return Swal.fire('No hay correos por enviar', 'No hay casos con documentos para enviar.', 'info');
    }

    const result = await Swal.fire({
      title: 'Confirmar Envío de Correos',
      text: `¿Realmente desea enviar ${emailsToSend.length} correos a los destinatarios de forma simultánea?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const emailPromises = emailsToSend.map(caseItem => 
          axios.post('http://127.0.0.1:5000/send_email', { 
            radicado: caseItem.radicado,
            use_outlook: true 
          })
        );
        await Promise.all(emailPromises);
        toast.success(`${emailsToSend.length} correos enviados exitosamente`);
        emailsToSend.forEach(caseItem => {
          dispatch({
            type: 'cases/removeCase',
            payload: caseItem.id
          });
        });
      } catch (error) {
        toast.error('Hubo un problema al enviar los correos');
      }
    }
  }, [cases, dispatch, isRadicadoInPdf]);

  const data = useMemo(() => cases, [cases]);
  const columns = useMemo(() => [
    {
      Header: 'No.',
      accessor: (row, i) => i + 1,  // Accesor para numerar las filas
      disableFilters: true,
      disableSortBy: true,
      maxWidth: 50,
    },

    {
      Header: 'Fecha',
      accessor: 'fecha',
      Filter: DefaultColumnFilter,
      maxWidth: 150,
      sortType: 'datetime',
      aggregate: 'count',
    },
    {
      Header: 'Escritura',
      accessor: 'escritura',
      Filter: DefaultColumnFilter,
      maxWidth: 150,
      sortType: 'basic',
      aggregate: 'count',
    },
    {
      Header: 'Fecha Del Documento', // Nueva columna para Fecha Del Documento
      accessor: 'fecha_documento',
      Filter: DefaultColumnFilter,
      maxWidth: 150,
      sortType: 'datetime',
      aggregate: 'count',
    },
    {
      Header: 'Radicado',
      accessor: 'radicado',
      Cell: ({ row }) => (
        <RadicadoDropdown caseId={row.original.id} initialRadicado={row.original.radicado} />
      ),
      Filter: DefaultColumnFilter,
      maxWidth: 150,
      sortType: 'alphanumeric',
      aggregate: 'count',
    },
    {
      Header: 'Protocolista',
      accessor: 'protocolista',
      Filter: DefaultColumnFilter,
      maxWidth: 150,
      sortType: 'basic',
      aggregate: 'count',
    },
    {
      Header: 'Observaciones',
      accessor: 'observaciones',
      Filter: DefaultColumnFilter,
      maxWidth: 150,
      aggregate: 'count',
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
      maxWidth: 150,
    }
  ], [handleEdit, handleDelete, handleAddRadicado, handleSendEmail]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useFilters, useGroupBy, useSortBy);

  const RadicadoDropdown = ({ caseId, initialRadicado }) => {
    const [radicados, setRadicados] = useState([]);
    const dispatch = useDispatch();

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
        toast.error('Hubo un problema al actualizar el radicado.');
      }
    };

    return (
      <select defaultValue={initialRadicado} onChange={handleRadicadoChange}>
        <option value={initialRadicado}>{initialRadicado}</option>
        {radicados.filter(r => r.radicado !== initialRadicado).map((r) => (
          <option key={r.id} value={r.radicado}>{r.radicado}</option>
        ))}
      </select>
    );
  };

  const numVisibleRows = 10; // Número de filas visibles mínimo que deseas mantener

  const renderEmptyRows = (numEmptyRows) => {
    return Array.from({ length: numEmptyRows }).map((_, index) => (
      <tr key={`empty-row-${index}`} className="empty-row">
        <td colSpan={columns.length}></td>
      </tr>
    ));
  };

  // Intervalo de Verificación de Casos Resaltados
  useEffect(() => {
    const interval = setInterval(() => {
      const casosResaltados = cases.filter(caseItem => isRadicadoInPdf(caseItem.radicado));

      if (casosResaltados.length > 0) {
        Swal.fire({
          title: 'Casos Pendientes de Envío',
          text: `Hay ${casosResaltados.length} caso(s) pendiente(s) de envío.`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      }
    }, 600000); // Cada 10 minutos (600,000 ms)

    return () => clearInterval(interval);
  }, [cases, isRadicadoInPdf]);

  // Añadir el contador de filas visibles
const visibleRowsCount = rows.length;

  return (
    <div>
      <h2>Casos</h2>
      <div>
        <p>Número de casos: {visibleRowsCount}</p> {/* Aquí mostramos el contador */}
      </div>
      <div className="table-and-form-container">
        <div className="table-container">
          <table {...getTableProps()} className="case-table">
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th key={column.id} {...column.getHeaderProps(column.getSortByToggleProps())} style={{ maxWidth: column.maxWidth }}>
                      {column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' 🔽'
                            : ' 🔼'
                          : ''}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>{column.canFilter ? column.render('Filter') : null}</div>
                      {column.id === 'acciones' && (
                        <button onClick={handleSendAllEmails} className="btn-send-all-emails">
                          Enviar Todos los Correos
                        </button>
                      )}
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
              {renderEmptyRows(numVisibleRows - rows.length)}
            </tbody>
          </table>
        </div>
        <form className="case-form" onSubmit={handleSubmit}>
          <label htmlFor="fecha">Fecha</label>
          <DatePicker
            selected={form.fecha}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            locale="es"  // Establecer el idioma español
            showMonthDropdown  // Permitir selección de meses
            showYearDropdown   // Permitir selección de años
            dropdownMode="select"  // Mostrar como lista desplegable
            className="date-picker"
          />
          <label htmlFor="escritura">Escritura</label>
          <input 
            type="text" 
            name="escritura" 
            value={form.escritura} 
            onChange={handleChange} 
            placeholder="Ej: 12345" 
            className={errors.escritura ? 'input-error' : ''}
          />
          {errors.escritura && <span className="error-message">{errors.escritura}</span>}

          <label htmlFor="fecha_documento">Fecha del Documento</label>
          <DatePicker
            selected={form.fecha_documento}
            onChange={handleDocumentDateChange}
            dateFormat="yyyy-MM-dd"
            locale="es"  // Establecer el idioma español
            showMonthDropdown  // Permitir selección de meses
            showYearDropdown   // Permitir selección de años
            dropdownMode="select"  // Mostrar como lista desplegable
            className="date-picker"
          />

          <label htmlFor="radicado">Radicado</label>
          <input 
            type="text" 
            name="radicado" 
            value={form.radicado} 
            onChange={handleChange} 
            placeholder="Ej: 20240101234432" 
            className={errors.radicado ? 'input-error' : ''}
          />
          {errors.radicado && <span className="error-message">{errors.radicado}</span>}

          <label htmlFor="protocolista">Protocolista</label>
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

          <label htmlFor="observaciones">Observaciones</label>
          <textarea 
            name="observaciones" 
            value={form.observaciones} 
            onChange={handleChange} 
            placeholder="Observaciones adicionales (opcional)"
          ></textarea>
          <button type="submit">{currentCase ? 'Actualizar' : 'Agregar'}</button>
        </form>
      </div>
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
    console.error('Error fetching radicados:', error);
    return [];
  }
};

export default CaseForm;
