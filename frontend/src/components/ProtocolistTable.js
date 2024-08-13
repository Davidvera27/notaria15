import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import './ProtocolistTable.css';

const ProtocolistTable = () => {
  const [protocolists, setProtocolists] = useState([]);
  const [currentProtocolist, setCurrentProtocolist] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    correo_electronico: ''
  });

  // Función para obtener los protocolistas y el número de casos asociados a cada uno
  const fetchProtocolists = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/protocolists');
      const casesResponse = await axios.get('http://127.0.0.1:5000/cases');
      const protocolistsData = response.data.map(protocolist => {
        const caseCount = casesResponse.data.filter(c => c.protocolista === protocolist.nombre).length;
        return { ...protocolist, caseCount };
      });
      setProtocolists(protocolistsData);
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
        Swal.fire('¡Eliminado!', 'El Protocolista ha sido eliminado.', 'success');
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
      const { id, ...protocolistData } = form;
      if (currentProtocolist) {
        await axios.put(`http://127.0.0.1:5000/protocolists/${currentProtocolist.id}`, protocolistData);
        setCurrentProtocolist(null);
      } else {
        await axios.post('http://127.0.0.1:5000/protocolists', protocolistData);
      }
      setForm({ nombre: '', correo_electronico: '' });
      fetchProtocolists();
      toast.success('Protocolista guardado exitosamente');
    } catch (error) {
      console.error('Error adding/updating protocolist:', error);
      toast.error('Hubo un problema al guardar el protocolista');
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
        Header: 'Número de Casos',
        accessor: 'caseCount',  // Nueva columna para mostrar el número de casos
        Filter: DefaultColumnFilter,
      },
      {
        Header: 'Acciones',
        accessor: 'acciones',
        disableSortBy: true,
        disableFilters: true,
        Cell: ({ row }) => (
          <>
            <button onClick={() => handleEdit(row.original)}>
              <i className="fas fa-edit"></i> Editar
            </button>
            <button onClick={() => handleDelete(row.original.id)}>
              <i className="fas fa-trash"></i> Eliminar
            </button>
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
