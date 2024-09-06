import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFinishedCases } from '../features/finishedCaseSlice';
import { useTable, useSortBy, useFilters } from 'react-table';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import axios from 'axios';
import './FinishedCaseTable.css';
import 'animate.css';

Modal.setAppElement('#root');

const FinishedCaseTable = () => {
  const dispatch = useDispatch();
  const finishedCases = useSelector(state => state.finishedCases.finishedCases);
  const status = useSelector(state => state.finishedCases.status);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [form, setForm] = useState({
    fecha: '',
    escritura: '',
    radicado: '',
    protocolista: '',
    observaciones: '',
    fecha_documento: '',
    envios: ''
  });

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFinishedCases());
    }
  }, [status, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleEdit = useCallback((caseItem) => {
    setSelectedCase(caseItem);
    setForm({
      fecha: caseItem.fecha,
      escritura: caseItem.escritura,
      radicado: caseItem.radicado,
      protocolista: caseItem.protocolista,
      observaciones: caseItem.observaciones,
      fecha_documento: caseItem.fecha_documento,
      envios: caseItem.envios
    });
    setModalIsOpen(true);
  }, []);

  const handleUpdate = async () => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/finished_cases/${selectedCase.id}`, form);
      dispatch(fetchFinishedCases());
      Swal.fire('Éxito', 'Caso actualizado con éxito', 'success');
      setModalIsOpen(false);
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al actualizar el caso', 'error');
    }
  };

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
        await axios.delete(`http://127.0.0.1:5000/api/finished_cases/${id}`);
        dispatch(fetchFinishedCases());
        Swal.fire('¡Eliminado!', 'El caso ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Hubo un problema al eliminar el caso.', 'error');
      }
    }
  }, [dispatch]);

  const columns = useMemo(() => [
    { Header: 'Fecha', accessor: 'fecha' },
    { Header: 'Escritura', accessor: 'escritura' },
    { Header: 'Radicado', accessor: 'radicado' },
    { Header: 'Protocolista', accessor: 'protocolista' },
    { Header: 'Fecha del Documento', accessor: 'fecha_documento' },
    { Header: 'Observaciones', accessor: 'observaciones' },
    { Header: 'Envíos', accessor: 'envios' },
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
        </div>
      ),
    }
  ], [handleEdit, handleDelete]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: finishedCases }, useFilters, useSortBy);

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedCase(null);
  };

  const visibleRowsCount = rows.length;

  return (
    <div>
      <h2>Casos Finalizados</h2>
      <div>
        <p>Número de casos: {visibleRowsCount}</p>
      </div>
      <div className="table-container">
        <table {...getTableProps()} className="case-table">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} onClick={() => handleEdit(row.original)}>
                  {row.cells.map(cell => {
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedCase && (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            contentLabel="Detalles del Caso"
            className="modal animate__animated animate__fadeInDown"
            overlayClassName="modal-overlay"
          >
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              Detalles del Caso
            </motion.h2>
            <motion.form initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
              <label>Fecha</label>
              <input
                name="fecha"
                value={form.fecha}
                onChange={handleInputChange}
              />

              <label>Escritura</label>
              <input
                name="escritura"
                value={form.escritura}
                onChange={handleInputChange}
              />

              <label>Radicado</label>
              <input
                name="radicado"
                value={form.radicado}
                onChange={handleInputChange}
              />

              <label>Protocolista</label>
              <input
                name="protocolista"
                value={form.protocolista}
                onChange={handleInputChange}
              />

              <label>Fecha del Documento</label>
              <input
                name="fecha_documento"
                value={form.fecha_documento}
                onChange={handleInputChange}
              />

              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleInputChange}
              />

              {/* Nuevo campo para el correo al que se envió el documento */}
              <label>Correo Enviado A</label>
              <input
                name="correo_enviado_a"
                value={selectedCase.correo_enviado_a || "correo@ejemplo.com"}  // Reemplaza con el valor real
                disabled
              />

              {/* Nuevo campo para la hora de envío */}
              <label>Hora de Envío</label>
              <input
                name="hora_envio"
                value={selectedCase.hora_envio || "12:00 PM"}  // Reemplaza con el valor real
                disabled
              />

              {/* Nuevo campo para mostrar el nombre del usuario que envió el correo */}
              <label>Enviado por</label>
              <input
                name="enviado_por"
                value={selectedCase.enviado_por || "Usuario Activo"}  // Reemplaza con el usuario activo
                disabled
              />

              <label>Envíos</label>
              <input
                name="envios"
                value={form.envios}
                onChange={handleInputChange}
              />
            </motion.form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <button onClick={handleUpdate} className="btn-update">Actualizar</button>
              <button onClick={closeModal} className="btn-close">Cerrar</button>
            </motion.div>
          </Modal>
      )}
    </div>
  );
};

export default FinishedCaseTable;
