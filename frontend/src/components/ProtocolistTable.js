import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';
import axios from 'axios';
import Swal from 'sweetalert2';
import './ProtocolistTable.css';

const ProtocolistTable = () => {
  const [protocolists, setProtocolists] = useState([]);
  const [currentProtocolist, setCurrentProtocolist] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    correo_electronico: ''
  });

  const fetchProtocolists = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/protocolists');
      setProtocolists(response.data);
    } catch (error) {
      console.error('Error fetching protocolists:', error);
    }
  }, []);

  useEffect(() => {
    fetchProtocolists();
  }, [fetchProtocolists]);

  const handleEdit = useCallback((protocolist) => {
    setCurrentProtocolist(protocolist);
    setForm({
      nombre: protocolist.nombre,
      correo_electronico: protocolist.correo_electronico
    });
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
        await axios.delete(`http://127.0.0.1:5000/protocolists/${id}`);
        fetchProtocolists();
        Swal.fire('¡Eliminado!', 'El protocolista ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error deleting protocolist:', error);
        Swal.fire('Error', 'Hubo un problema al eliminar el protocolista.', 'error');
      }
    }
  }, [fetchProtocolists]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProtocolist) {
        await axios.put(`http://127.0.0.1:5000/protocolists/${currentProtocolist.id}`, form);
        setCurrentProtocolist(null);
      } else {
        await axios.post('http://127.0.0.1:5000/protocolists', form);
      }
      setForm({ nombre: '', correo_electronico: '' });
      fetchProtocolists();
    } catch (error) {
      console.error('Error adding/updating protocolist:', error);
    }
  };

  const data = useMemo(() => protocolists, [protocolists]);
  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'Nombre',
        accessor: 'nombre',
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'Correo Electrónico',
        accessor: 'correo_electronico',
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
          </>
        ),
      },
    ],
    [handleEdit, handleDelete]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useFilters, useSortBy);

  return (
    <div>
      <h2>Protocolistas</h2>
      <div className="table-container">
        <table {...getTableProps()} className="protocolist-table">
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
                <tr key={row.id} {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return <td key={cell.id} {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <form className="protocolist-form" onSubmit={handleSubmit}>
        <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
        <input type="email" name="correo_electronico" value={form.correo_electronico} onChange={handleChange} placeholder="Correo Electrónico" />
        <button type="submit">{currentProtocolist ? 'Actualizar' : 'Agregar'}</button>
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

export default ProtocolistTable;