import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCases } from '../features/caseSlice';
import { fetchFinishedCases } from '../features/finishedCaseSlice';
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
import { es } from 'date-fns/locale';
import { Tooltip } from 'antd';
import { AutoComplete } from 'antd'; // Importar AutoComplete



registerLocale('es', es);

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
    fecha_documento: null,
  });

  const [errors, setErrors] = useState({});
  const [componentSize, setComponentSize] = useState('default'); // Tamaño de los componentes

  useEffect(() => {
    if (casesStatus === 'idle') dispatch(fetchCases());
    if (protocolistsStatus === 'idle') dispatch(fetchProtocolists());
    if (pdfDataStatus === 'idle') dispatch(fetchPdfData());

    socket.on('new_case', () => {
      dispatch(fetchCases());
    });

    socket.on('update_case', () => {
      dispatch(fetchCases());
    });

    socket.on('case_moved', () => {
      dispatch(fetchCases());
      dispatch(fetchFinishedCases()); // Actualizar la tabla de casos finalizados
    });

    return () => {
      socket.off('new_case');
      socket.off('update_case');
      socket.off('case_moved');
    };
  }, [casesStatus, protocolistsStatus, pdfDataStatus, dispatch]);

  useEffect(() => {
    if (currentCase) {
      setForm({
        ...currentCase,
        fecha: new Date(currentCase.fecha),
        fecha_documento: currentCase.fecha_documento ? new Date(currentCase.fecha_documento) : null,
      });
    } else {
      setForm({
        fecha: new Date(),
        escritura: '',
        radicado: '',
        protocolista: '',
        observaciones: '',
        fecha_documento: null,
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
    
    if (name === 'radicado') {
      const numericValue = value.replace(/\D/g, ''); // Remueve todo lo que no sea un dígito
      setForm({ ...form, [name]: numericValue });
      validateForm(name, numericValue); // Validar el nuevo valor numérico
    } else {
      setForm({ ...form, [name]: value });
      validateForm(name, value);
    }
  };

  const handleDateChange = (date) => {
    setForm({ ...form, fecha: date });
  };

  const handleDocumentDateChange = (date) => {
    setForm({ ...form, fecha_documento: date });
  };

  const handleProtocolistaChange = (value) => {
    setForm({ ...form, protocolista: value });
    validateForm('protocolista', value);
  };

  const onFormLayoutChange = (e) => {
    setComponentSize(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      toast.error('Corrija los errores antes de enviar el formulario.');
      return;
    }

    // Validar radicado duplicado
    const radicadoExistente = cases.find(
      (c) => c.radicado === form.radicado && (!currentCase || c.id !== currentCase.id)
    );
    if (radicadoExistente) {
      Swal.fire({
        title: 'Radicado Duplicado',
        text: `El radicado ya existe asignado al protocolista ${radicadoExistente.protocolista}.`,
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    // Validar escritura y fecha de documento duplicados
    const escrituraFechaExistente = cases.find(
      (c) =>
        c.escritura === form.escritura &&
        c.fecha_documento === form.fecha_documento?.toISOString().split('T')[0] &&
        (!currentCase || c.id !== currentCase.id)
    );
    if (escrituraFechaExistente) {
      Swal.fire({
        title: 'Escritura Duplicada',
        text: `Ya existe un caso con la escritura ${form.escritura} y la fecha de documento ${form.fecha_documento?.toLocaleDateString()}.`,
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const caseData = {};
    
    if (form.fecha !== currentCase?.fecha) {
      caseData.fecha = form.fecha.toISOString().split('T')[0];
    }
    if (form.escritura !== currentCase?.escritura) {
      caseData.escritura = form.escritura;
    }
    if (form.radicado !== currentCase?.radicado) {
      caseData.radicado = form.radicado;
    }
    if (form.protocolista !== currentCase?.protocolista) {
      caseData.protocolista = form.protocolista;
    }
    if (form.observaciones !== currentCase?.observaciones) {
      caseData.observaciones = form.observaciones;
    }
    if (form.fecha_documento && form.fecha_documento.toISOString().split('T')[0] !== currentCase?.fecha_documento) {
      caseData.fecha_documento = form.fecha_documento.toISOString().split('T')[0];
    }

    try {
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
        fecha_documento: null,
      });

      dispatch(fetchCases());
      toast.success('Caso guardado exitosamente');
    } catch (error) {
      if (error.response && error.response.data.error) {
        Swal.fire({
          title: 'Error',
          text: error.response.data.error,
          icon: 'error',
          confirmButtonText: 'Entendido',
        });
      } else {
        console.error('Error adding/updating case:', error);
        toast.error('Hubo un problema al guardar el caso. Por favor, inténtelo de nuevo más tarde.');
      }
    }
  };  
  
  const handleEdit = useCallback((caseItem) => {
    setCurrentCase(caseItem);
  }, []);

  const handleDelete = useCallback(async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
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
      showCancelButton: true,
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
        use_outlook: true,
      });
      if (response.data.message) {
        toast.success(response.data.message);
        dispatch(fetchCases());
        dispatch(fetchFinishedCases());
      } else {
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      toast.error('Hubo un problema al enviar el correo');
    }
  }, [dispatch]);

  const isRadicadoInPdf = useMemo(
    () => (radicado) => {
      return pdfData.some((pdf) => {
        const pdfRadicado = pdf.data['RADICADO N°']?.trim();
        const caseRadicado = radicado?.trim();
        return pdfRadicado === caseRadicado;
      });
    },
    [pdfData]
  );

  const handleSendAllEmails = useCallback(async () => {
    const emailsToSend = cases.filter((caseItem) => isRadicadoInPdf(caseItem.radicado));

    if (emailsToSend.length === 0) {
      return Swal.fire('No hay correos por enviar', 'No hay casos con documentos para enviar.', 'info');
    }

    const result = await Swal.fire({
      title: 'Confirmar Envío de Correos',
      text: `¿Realmente desea enviar ${emailsToSend.length} correos a los destinatarios de forma simultánea?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const emailPromises = emailsToSend.map((caseItem) =>
          axios.post('http://127.0.0.1:5000/send_email', {
            radicado: caseItem.radicado,
            use_outlook: true,
          })
        );

        await Promise.all(emailPromises);

        toast.success(`${emailsToSend.length} correos enviados exitosamente`);

        emailsToSend.forEach((caseItem) => {
          dispatch({
            type: 'cases/removeCase',
            payload: caseItem.id,
          });
        });

        dispatch(fetchCases());
        dispatch(fetchFinishedCases());
      } catch (error) {
        toast.error('Hubo un problema al enviar los correos');
      }
    }
  }, [cases, dispatch, isRadicadoInPdf]);

  const data = useMemo(() => cases, [cases]);
  const columns = useMemo(
    () => [
      {
        Header: 'No.',
        accessor: (row, i) => i + 1,
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
        Header: 'Fecha Del Documento',
        accessor: 'fecha_documento',
        Filter: DefaultColumnFilter,
        maxWidth: 150,
        sortType: 'datetime',
        aggregate: 'count',
      },
      {
        Header: 'Radicado',
        accessor: 'radicado',
        Cell: ({ row }) => <span>{row.original.radicado}</span>,
        Filter: DefaultColumnFilter,
        maxWidth: 200,
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
        maxWidth: 200,
      },
    ],
    [handleEdit, handleDelete, handleAddRadicado, handleSendEmail]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useFilters, useGroupBy, useSortBy);

  const numVisibleRows = 15;

  const renderEmptyRows = (numEmptyRows) => {
    return Array.from({ length: numEmptyRows }).map((_, index) => (
      <tr key={`empty-row-${index}`} className="empty-row">
        <td colSpan={columns.length}></td>
      </tr>
    ));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const casosResaltados = cases.filter((caseItem) => isRadicadoInPdf(caseItem.radicado));

      if (casosResaltados.length > 0) {
        Swal.fire({
          title: 'Casos Pendientes de Envío',
          text: `Hay ${casosResaltados.length} caso(s) pendiente(s) de envío.`,
          icon: 'warning',
          confirmButtonText: 'Entendido',
        });
      }
    }, 600000);

    return () => clearInterval(interval);
  }, [cases, isRadicadoInPdf]);

  const visibleRowsCount = rows.length;

  return (
    <div>
      <h2>Casos</h2>
      <div>
        <p>Número de casos: {visibleRowsCount}</p>
      </div>

      {/* Form size selection */}
      <div>
        <label>Tamaño del formulario:</label>
        <div onChange={onFormLayoutChange}>
          <input type="radio" value="small" name="size" /> Pequeño
          <input type="radio" value="default" name="size" defaultChecked /> Mediano
          <input type="radio" value="large" name="size" /> Grande
        </div>
      </div>

      <div className="table-and-form-container">
        <div className="table-container">
          <table {...getTableProps()} className="case-table">
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column.id}
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      style={{ minWidth: column.minWidth, width: column.width }}
                    >
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
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <tr
                    key={row.id}
                    {...row.getRowProps()}
                    style={isRadicadoInPdf(row.original.radicado) ? { backgroundColor: 'lightgreen' } : {}}
                  >
                    {row.cells.map((cell) => (
                      <td key={cell.id} {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {renderEmptyRows(numVisibleRows - rows.length)}
            </tbody>
          </table>
        </div>
        <form className={`case-form ${componentSize}`} onSubmit={handleSubmit}>
          {/* Fecha */}
          <label htmlFor="fecha">Fecha</label>
          <DatePicker
            selected={form.fecha}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            locale="es"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            className="date-picker"
          />

          {/* Escritura */}
          <Tooltip title="Escribe solo el número de la escritura sin caracteres especiales.">
            <label htmlFor="escritura">Escritura</label>
          </Tooltip>
          <input
            type="text"
            name="escritura"
            value={form.escritura}
            onChange={handleChange}
            placeholder="Ej: 12345"
            className={errors.escritura ? 'input-error' : ''} 
          />
          {errors.escritura && <span className="error-message">{errors.escritura}</span>}

          {/* Fecha del Documento */}
          <Tooltip title="Fecha en la que el documento fue firmado por el primer otorgante.">
            <label htmlFor="fecha_documento">Fecha del Documento</label>
          </Tooltip>
          <DatePicker
            selected={form.fecha_documento}
            onChange={handleDocumentDateChange}
            dateFormat="yyyy-MM-dd"
            locale="es"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            className="date-picker"
          />

          {/* Radicado */}
          <Tooltip title="El radicado debe ser numérico y no debe contener texto.">
            <label htmlFor="radicado">Radicado</label>
          </Tooltip>
          <input
            type="text"
            name="radicado"
            value={form.radicado}
            onChange={handleChange}
            placeholder="Ej: 20240101234432"
            className={errors.radicado ? 'input-error' : ''}
          />
          {errors.radicado && <span className="error-message">{errors.radicado}</span>}

          {/* Protocolista */}
          <label htmlFor="protocolista">Protocolista</label>
          <AutoComplete
            style={{ width: '100%' }}
            options={protocolists
              .filter((p) => p.nombre.toLowerCase().startsWith(form.protocolista?.toLowerCase() || ''))
              .map((p) => ({ value: p.nombre }))}
            value={form.protocolista}
            onChange={handleProtocolistaChange}
            placeholder="Selecciona un protocolista"
            filterOption={(inputValue, option) =>
              option.value.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
          {errors.protocolista && <span className="error-message">{errors.protocolista}</span>}


          {/* Observaciones */}
          <label htmlFor="observaciones">Observaciones</label>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observaciones adicionales (opcional)"
          ></textarea>

          {/* Botón de acción */}
          <button type="submit">{currentCase ? 'Actualizar' : 'Agregar'}</button>
        </form>
      </div>
    </div>
  );
};

const DefaultColumnFilter = ({ column: { filterValue, preFilteredRows, setFilter } }) => {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ''}
      onChange={(e) => {
        setFilter(e.target.value || undefined);
      }}
      placeholder={`Buscar ${count} registros...`}
    />
  );
};

export default CaseForm;
