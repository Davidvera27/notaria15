import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFinishedCases } from '../features/finishedCaseSlice';
import { useTable, useSortBy, useFilters } from 'react-table';
import './FinishedCaseTable.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const FinishedCaseTable = () => {
    const dispatch = useDispatch();
    const finishedCases = useSelector(state => state.finishedCases.finishedCases);
    const status = useSelector(state => state.finishedCases.status);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchFinishedCases());
        }
    }, [status, dispatch]);

    const columns = React.useMemo(
        () => [
            { Header: 'Fecha', accessor: 'fecha' },
            { Header: 'Escritura', accessor: 'escritura' },
            { Header: 'Radicado', accessor: 'radicado' },
            { Header: 'Protocolista', accessor: 'protocolista' },
            { Header: 'Fecha del Documento', accessor: 'fecha_documento' },
            { Header: 'Observaciones', accessor: 'observaciones' },
            { Header: 'Envíos', accessor: 'envios' },
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: finishedCases }, useFilters, useSortBy);

    const openModal = (caseItem) => {
        setSelectedCase(caseItem);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedCase(null);
    };

    return (
        <div>
            <h2>Casos Finalizados</h2>
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
                                <tr {...row.getRowProps()} onClick={() => openModal(row.original)}>
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
                    className="modal"
                    overlayClassName="modal-overlay"
                    style={{
                        overlay: {
                            zIndex: 1000
                        },
                        content: {
                            zIndex: 1001,
                        }
                    }}
                >
                    <h2>Detalles del Caso</h2>
                    <p><strong>Fecha:</strong> {selectedCase.fecha}</p>
                    <p><strong>Escritura:</strong> {selectedCase.escritura}</p>
                    <p><strong>Radicado:</strong> {selectedCase.radicado}</p>
                    <p><strong>Protocolista:</strong> {selectedCase.protocolista}</p>
                    <p><strong>Fecha del Documento:</strong> {selectedCase.fecha_documento}</p>
                    <p><strong>Observaciones:</strong> {selectedCase.observaciones}</p>
                    <p><strong>Envíos:</strong> {selectedCase.envios}</p>
                    <h3>Historial de Cambios</h3>
                    {/* Historial de cambios - Por implementar */}
                    <h3>Comunicaciones y Envíos</h3>
                    {/* Comunicaciones y envíos - Por implementar */}
                    <h3>Archivos Adjuntos</h3>
                    {/* Archivos adjuntos - Por implementar */}
                    <h3>Notas Adicionales</h3>
                    <p>No hay notas adicionales.</p>
                    <button onClick={closeModal}>Cerrar</button>
                </Modal>
            )}
        </div>
    );
};

export default FinishedCaseTable;
