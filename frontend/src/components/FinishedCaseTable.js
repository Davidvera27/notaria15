import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFinishedCases } from '../features/finishedCaseSlice';
import { useTable, useSortBy, useFilters } from 'react-table';
import './CaseForm.css';

const FinishedCaseTable = () => {
    const dispatch = useDispatch();
    const finishedCases = useSelector(state => state.finishedCases.finishedCases);
    const status = useSelector(state => state.finishedCases.status);

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
            { Header: 'Observaciones', accessor: 'observaciones' },
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
        </div>
    );
};

export default FinishedCaseTable;