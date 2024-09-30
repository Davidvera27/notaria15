import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFinishedCases } from '../features/finishedCaseSlice';
import { useTable, useSortBy, useFilters } from 'react-table';  // Añadido useFilters
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
  const [, setSelectedCase] = useState(null);
  const [caseInfo, setCaseInfo] = useState(null); // Para almacenar la información del caso
  const [, setForm] = useState({
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

  const handleReturn = useCallback(async (id) => {
    const result = await Swal.fire({
      title: '¿Realmente desea retornar el caso a la tabla "CASOS PENDIENTES"?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Retornar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`http://127.0.0.1:5000/api/finished_cases/return/${id}`);
        dispatch(fetchFinishedCases());
        Swal.fire('¡Éxito!', 'El caso ha sido retornado a la tabla de casos pendientes.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response.data.error || 'Hubo un problema al retornar el caso.', 'error');
      }
    }
  }, [dispatch]);

  // Nueva función para mostrar el modal con la información del caso
  const handleViewInfo = useCallback(async (caseItem) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/case_info/${caseItem.radicado}`);
      setCaseInfo(response.data); // Guardar la información del caso
      setModalIsOpen(true);
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al obtener la información del caso', 'error');
    }
  }, []);

  const columns = useMemo(() => [
    { Header: 'Fecha', accessor: 'fecha', Filter: DefaultColumnFilter },
    { Header: 'Escritura', accessor: 'escritura', Filter: DefaultColumnFilter },
    { Header: 'Radicado', accessor: 'radicado', Filter: DefaultColumnFilter },
    { Header: 'Protocolista', accessor: 'protocolista', Filter: DefaultColumnFilter },
    { Header: 'Fecha del Documento', accessor: 'fecha_documento', Filter: DefaultColumnFilter },
    { Header: 'Observaciones', accessor: 'observaciones', Filter: DefaultColumnFilter },
    { Header: 'Envíos', accessor: 'envios', Filter: DefaultColumnFilter },
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
          <button className="btn-return" onClick={() => handleReturn(row.original.id)}>
            <i className="fas fa-undo"></i> Retornar
          </button>
          <button className="btn-info" onClick={() => handleViewInfo(row.original)}>
            <i className="fas fa-info-circle"></i> Información
          </button>
        </div>
      ),
    }
  ], [handleEdit, handleDelete, handleReturn, handleViewInfo]);

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
    setCaseInfo(null); // Limpiar la información al cerrar el modal
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
                  <th {...column.getHeaderProps()}>
                    <span {...column.getSortByToggleProps()}>
                      {column.render('Header')}
                      {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : '' }
                    </span>
                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {caseInfo && (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            contentLabel="Información del Caso"
            className="modal animate__animated animate__fadeInDown"
            overlayClassName="modal-overlay"
          >
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              Información del Caso
            </motion.h2>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
              <p><strong>Escritura:</strong> {caseInfo.escritura}</p>
              <p><strong>Fecha del Documento:</strong> {caseInfo.fecha_documento}</p>
              <p><strong>Radicado:</strong> {caseInfo.radicado}</p>
              <p><strong>Fecha de Envío de Rentas:</strong> {caseInfo.fecha_envio_rentas}</p>
              <p><strong>Fecha de Vigencia de Rentas:</strong> {caseInfo.vigencia_rentas}</p>
              <p><strong>Fecha de Radicación:</strong> {caseInfo.fecha_radicacion}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <button onClick={closeModal} className="btn-close">Cerrar</button>
            </motion.div>
          </Modal>
      )}
    </div>
  );
};

// Función básica para los filtros de columna
const DefaultColumnFilter = ({
  column: { filterValue, preFilteredRows, setFilter },
}) => {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined); // Colocar el valor en blanco elimina el filtro
      }}
      placeholder={`Buscar ${count} registros...`}
    />
  );
};

export default FinishedCaseTable;
