import React, { useState, useMemo } from 'react';
import EmptyState from './EmptyState';
import '../styles/Table.css';

/**
 * Componente Tabla Reutilizable
 * @param {String} title - (Opcional) Título general que ocupa toda la cabecera.
 * @param {Array} columns - Configuración de columnas [{ header: 'Nombre', accessor: 'prop', className: 'css-class', sortable: boolean, filterable: boolean, sortFunction: (a,b)=>number, render: (row) => JSX }]
 * @param {Array} data - Arreglo de objetos con los datos limpios.
 * @param {Function} onRowClick - (Opcional) Manejador al hacer clic en una fila.
 * @param {Function} onRowMouseOver - (Opcional) Manejador al posar el mouse en una fila.
 * @param {Function} onRowMouseMove - (Opcional) Manejador al mover el mouse sobre una fila.
 * @param {Function} onRowMouseOut - (Opcional) Manejador al sacar el mouse de una fila.
 */
export const Table = ({
    title,
    columns,
    data,
    onRowClick,
    onRowMouseOver,
    onRowMouseMove,
    onRowMouseOut,
    paginate = false,
    itemsPerPage = 200
}) => {
    // Obtenemos la cantidad de columnas para los colSpan
    const colCount = columns?.length || 0;

    // Estados para filtros y ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [rawFilters, setRawFilters] = useState({}); // Estado inmediato del input
    const [filters, setFilters] = useState({});       // Estado con debounce para filtrar la tabla

    // Estado para la paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Efecto de Debounce para los filtros
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters(rawFilters);
            setCurrentPage(1); // Volver a la primera página cuando se aplica el filtro final
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [rawFilters]);

    // Función para actualizar el filtro inmediato
    const handleFilterChange = (accessor, value) => {
        setRawFilters(prev => ({ ...prev, [accessor]: value }));
    };

    // Función para manejar el clic en un encabezado ordenable (Ciclo de 3 estados)
    const handleSort = (accessor) => {
        if (sortConfig.key === accessor) {
            if (sortConfig.direction === 'ascending') {
                setSortConfig({ key: accessor, direction: 'descending' });
            } else {
                // Tercer estado: Vuelve al orden original
                setSortConfig({ key: null, direction: 'ascending' });
            }
        } else {
            // Primer estado: Ascendente
            setSortConfig({ key: accessor, direction: 'ascending' });
        }
        setCurrentPage(1);
    };

    // Verifica si hay al menos una columna filtrable para decidir si se muestra la fila de filtros
    const hasFilters = columns?.some(col => col.filterable);

    // Memoizamos los datos procesados para no recalcular en cada render innecesariamente
    const processedData = useMemo(() => {
        if (!data) return [];

        let filteredData = [...data];

        // 1. Filtrar
        if (Object.keys(filters).length > 0) {
            filteredData = filteredData.filter(row => {
                return Object.entries(filters).every(([accessor, filterValue]) => {
                    if (!filterValue) return true; // Si el filtro está vacío, pasa

                    const cellValue = row[accessor];
                    return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                });
            });
        }

        // 2. Ordenar
        if (sortConfig.key !== null) {
            filteredData.sort((a, b) => {
                const col = columns.find(c => c.accessor === sortConfig.key);
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Si hay una función de ordenamiento personalizada
                if (col && typeof col.sortFunction === 'function') {
                    return sortConfig.direction === 'ascending'
                        ? col.sortFunction(aValue, bValue)
                        : col.sortFunction(bValue, aValue);
                }

                // Ordenamiento genérico
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredData;
    }, [data, filters, sortConfig, columns]);

    // 2. Calculamos los datos Paginados
    const totalPages = paginate ? Math.ceil((processedData?.length || 0) / itemsPerPage) : 1;
    const paginatedData = useMemo(() => {
        if (!processedData) return [];
        if (!paginate) return processedData; // Si no hay paginación, devuelve todos
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return processedData.slice(startIndex, endIndex);
    }, [processedData, currentPage, itemsPerPage, paginate]);

    // Componente interno para los controles de paginación
    const PaginationControls = () => {
        if (!paginate || totalPages <= 1) return null;
        
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px 0', gap: '15px' }}>
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="button button--primary button--compact"
                    style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                    Anterior
                </button>
                <span style={{ fontSize: '14px', color: 'var(--gris-oscuro)', fontWeight: 'bold' }}>
                    Página {currentPage} de {totalPages}
                </span>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="button button--primary button--compact"
                    style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                    Siguiente
                </button>
            </div>
        );
    };

    return (
        <div className="table-container">
            {/* Controles de Paginación Superior */}
            <PaginationControls />

            <table className="react-data-table">
                <thead>
                    {/* (A) Título de la tabla si fue especificado */}
                    {title && (
                        <tr>
                            <th colSpan={colCount} className="table-title">
                                {title}
                            </th>
                        </tr>
                    )}

                    {/* Fila de Filtros (solo si hasFilters es true) */}
                    {hasFilters && (
                        <tr className="table-filters-row">
                            {columns.map((col, index) => (
                                <th key={`filter-${index}`} className="table-filter-cell">
                                    {col.filterable ? (
                                        <div className="table-filter-wrapper">
                                            <input
                                                type="text"
                                                size={1}
                                                placeholder={`Filtrar ${col.header}`}
                                                value={rawFilters[col.accessor] || ''}
                                                onChange={(e) => handleFilterChange(col.accessor, e.target.value)}
                                                className="table-filter-input"
                                            />
                                            {rawFilters[col.accessor] && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFilterChange(col.accessor, '')}
                                                    className="table-filter-clear-button"
                                                    title="Limpiar filtro"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </th>
                            ))}
                        </tr>
                    )}

                    {/* (B) Títulos de columna */}
                    <tr>
                        {columns && columns.map((col, index) => {
                            const isSorted = sortConfig.key === col.accessor;
                            return (
                                <th
                                    key={`th-${index}`}
                                    className={col.className || ''}
                                    onClick={() => col.sortable && handleSort(col.accessor)}
                                    style={{
                                        textAlign: col.align || 'left',
                                        width: col.width || 'auto', // Soporte para ancho personalizado
                                        ...(col.sortable ? { cursor: 'pointer', userSelect: 'none' } : {})
                                    }}
                                >
                                    {col.header}
                                    {col.sortable && isSorted && (
                                        <span> {sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>

                <tbody>
                    {/* (D) Manejo del Estado Vacío */}
                    {!paginatedData || paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan={colCount} style={{ padding: 0 }}>
                                <EmptyState message={data && data.length > 0 ? "No hay registros que coincidan con la búsqueda." : "No hay registros para mostrar."} />
                            </td>
                        </tr>
                    ) : (
                        /* (D) Renderizado de Datos */
                        paginatedData.map((row, rowIndex) => (
                            <tr
                                key={`tr-${row.id || rowIndex}`}
                                className={rowIndex % 2 !== 0 ? "even-row" : ""}
                                onClick={() => onRowClick && onRowClick(row)}
                                onMouseOver={() => onRowMouseOver && onRowMouseOver(row)}
                                onMouseMove={() => onRowMouseMove && onRowMouseMove(row)}
                                onMouseOut={() => onRowMouseOut && onRowMouseOut(row)}
                                style={onRowClick ? { cursor: 'pointer' } : {}}
                            >
                                {columns.map((col, colIndex) => {
                                    const cellValue = row[col.accessor];
                                    const displayValue = typeof cellValue === 'boolean'
                                        ? (cellValue ? 'x' : '')
                                        : cellValue;

                                    return (
                                        <td
                                            key={`td-${rowIndex}-${colIndex}`}
                                            className={col.className || ''}
                                            style={{ 
                                                textAlign: col.align || 'left',
                                                width: col.width || 'auto'
                                            }}
                                        >
                                            {col.render ? col.render(row) : displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Controles de Paginación Inferior */}
            <PaginationControls />
        </div>
    );
};