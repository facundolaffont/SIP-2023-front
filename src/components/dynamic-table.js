// Imports externos.
import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';

// Estilos.
import '../styles/dynamic-table.css';

/**
 * Enumerado para definir la alineación de las columnas.
 * 
 * @readonly
 * @enum {string}
 */
const alignEnum = /** @type {const} */ ({
    LEFT: "left",
    RIGHT: "right",
    CENTER: "center",
    JUSTIFY: "justify"
});

/**
 * Componente de tabla dinámica para renderizar datos tabulares.
 *
 * @param {Object} props - Parámetros del componente.
 * @param {string} props.tableTitle - Título de la tabla.
 * @param {Array<{name: string, label: string, editable: boolean, align?: typeof alignEnum[keyof typeof alignEnum], sortFunction?: (a: string|number, b: string|number) => number, editOptions?: Array<string|number>}>} props.columnHeaders - Encabezados
 * de columna. Cada uno debe tener un nombre único, una etiqueta a mostrar, una marca que indica
 * si la columna es editable o no, una propiedad opcional que determina la alineación, que sólo
 * puede tener los valores del enumerado alignEnum, y una función opcional de ordenamiento personalizada.
 * @param {Array<{ id: number, values: Array<{ columnName: string, value: string | number }> }>} props.tableData -
 * Filas de la tabla. Cada fila debe tener un id numérico único y un arreglo de celdas con
 * un nombre de la columna a la que pertenecen y un valor, que puede ser una cadena de caracteres o
 * un número.
 * @param {Function} [props.handleEditCallback] - Callback para manejar la edición de una fila.
 * @param {Function} [props.handleDeleteCallback] - Callback para manejar la eliminación de una fila.
 * @param {Function} [props.handleExportCallback] - Callback para manejar la exportación de la tabla.
 *
 * @returns {JSX.Element} Tabla HTML construida dinámicamente con encabezados y datos.
 */
const DynamicTable = ({
        tableTitle,
        columnHeaders,
        tableData,
        handleEditCallback,
        handleDeleteCallback,
        handleExportCallback
    }) => {

    // #region === Definición de referencias. ===
    
    const tableRef = useRef(null);

    // #endregion === Definición de referencias. ===

    // #region === Definición de estados. ===
    
    // Estado para la edición.
    const [editingRow, setEditingRow] = useState(null);

    // Estado para el ordenamiento.
    const [sortConfig, setSortConfig] = useState({
        key: columnHeaders[0]?.name || '',
        direction: 'ascending'
    });

    // Estado para los filtros.
    const [filters, setFilters] = useState(() => 
        columnHeaders.reduce((acc, col) => ({
            ...acc,
            [col.name]: ''
        }), {})
    );

    // #endregion === Definición de estados. ===

    // #region ==== Definición de useEffect ====
    
    // Verifica que los nombres de las columnas en la tabla coincidan con los nombres de columna a
    // los cuales pertenecen las celdas. Si no coinciden, lanza un error y evita la renderización
    // de la tabla.
    useEffect(() => {
        
        const columnNames = columnHeaders.map(col => col.name);
        for (let i = 0; i < tableData.length; i++) {
            const columnsThatCellsBelongTo = tableData[i].values.map(cell => cell.columnName);    
      
            const hasMismatch = columnNames.some(name => !columnsThatCellsBelongTo.includes(name));
            if (hasMismatch) {

                console.error(`Fila ${i} no coincide con las columnas definidas.`);
                console.error(`columnsThatCellsBelongTo: ${JSON.stringify(columnsThatCellsBelongTo)}`);
                console.error(`columnNames: ${JSON.stringify(columnNames)}`);

                throw new Error(`Fila ${i} no coincide con las columnas definidas.`);
                
            }
        }
    }, [columnHeaders, tableData]);
    
    // #endregion ==== Definición de useEffect ====
    
    // #region ==== Definición de variables. ====
    
    // Datos ordenados y filtrados.
    const filteredAndSortedData = [...tableData]
        .filter(row => {

            return Object
                .entries(filters) // Convierte el objeto de filtros en un arreglo de entradas [clave, valor].
                .every(([columnName, filterValue]) => { // Verifica que todos los elementos del arreglo cumplan la condición.

                    // Busca el valor de la celda que corresponde a la columna actual.
                    const cellValue = row.values.find(value => value.columnName === columnName)?.value;

                    // Si no se estableció ningún filtro, devuelve true.
                    // Si se estableció un filtro y el valor de la celda incluye el valor del filtro,
                    // devuelve true; si no, devuelve false.
                    return filterValue === ''
                        || String(cellValue).toLowerCase().includes(filterValue.toLowerCase());

                });

        })
        .sort((a, b) => {

            const aValue = a.values.find(value => value.columnName === sortConfig.key)?.value;
            const bValue = b.values.find(value => value.columnName === sortConfig.key)?.value;

            // #region ==== Utiliza la función de ordenamiento personalizada, si existe,
            // y finaliza la ejecución de la función. ====
            
            // Obtiene el objeto que contiene la información de la columna que se está ordenando.
            const sortColumn = columnHeaders.find(column => column.name === sortConfig.key);

            // Condición que se cumple si la columna a ordenar tiene una función de ordenamiento.
            if (sortColumn && typeof sortColumn.sortFunction === 'function') {

                // Utiliza la función de ordenamiento personalizada para comparar los valores.
                return sortConfig.direction === 'ascending' 
                    ? sortColumn.sortFunction(aValue, bValue)
                    : sortColumn.sortFunction(bValue, aValue);

            }
            
            // #endregion ==== Utiliza la función de ordenamiento personalizada, si existe,
            // y finaliza la ejecución de la función. ====

            // #region ==== Si no se estableció una función personalizada de ordenamiento,
            // realiza un ordenamiento lexicográfico simple. ====

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
            
            // #endregion ==== Si no se estableció una función personalizada de ordenamiento,
            // realiza un ordenamiento lexicográfico simple. ====

        });
    
    // #endregion ==== Definición de variables. ====

    // #region === Definición de funciones. ===

    /**
     * Maneja el cambio de entrada en las celdas editables.
     * 
     * @param {*} event Objeto que contiene la información del evento de cambio del input.
     * @param {*} columnName Nombre de la columna a la que pertenece la celda editable.
     */
    const handleSelectChange = (event, columnName) => {

        // Obtiene el nuevo valor del input.
        const { value } = event.target;

        const updatedRow = { ...editingRow, values: editingRow.values.map(cell => 
            cell.columnName === columnName ? { ...cell, value } : cell
        )};

        // Establece el valor 
        setEditingRow(updatedRow);
    }

    /**
     * Maneja el evento click en el botón de edición, lo cual permite habilitar
     * el modo de edición de la fila pasada por parámetro.
     * 
     * @param {*} originalRow Fila original que se pretende editar.
     */
    const handleEditClick = (originalRow) => {
        
        // Hace una copia de la fila a editar y establece que se
        // trabaje sobre la copia, en vez de la original.
        const editingRow = { ...originalRow, values: originalRow.values.map(value => ({ ...value })) };
        setEditingRow(editingRow);

    }

    /**
     * Maneja el evento clic en el botón de guardar, lo cual permite solicitar
     * la registración de los cambios en la base de datos.
     * 
     * @param {*} updatedRow Fila actualizada que se pretende guardar.
     */
    const handleSaveClick = (originalRow, updatedRow) => {
        
        // Si no hubo cambios, notifica al usuario y no hace nada.
        if (updatedRow.values.every(cell =>
            cell.value === originalRow.values.find(
                value => value.columnName === cell.columnName
            ).value)) {
                alert('No hubo cambios en la fila.');
                return;
        }

        // Llama al callback que maneja la actualización de la fila
        // en la base de datos.
        handleEditCallback(updatedRow)
        .finally(() => {

            // Deshabilita el modo de edición.
            setEditingRow(null);

        })

    }

    /**
     * Maneja el evento de clic en el botón de cancelar, lo cual
     * deshabilita el modo de edición y reestablece los valores que se
     * hayan cambiado en la fila.
     */
    const handleCancelClick = () => {

        // Deshabilita el modo de edición.
        setEditingRow(null);

    }

    /**
     * Maneja el evento de clic en el botón de exportar.
     * 
     * Remueve la columna de los botones antes de exportar la tabla.
     */
    const handleExportClick = event => {
        if (tableRef.current !== undefined && tableRef.current !== null) {
            const tableClone = tableRef.current.cloneNode(true);
            tableClone.querySelectorAll('.actions').forEach(cell => cell.remove());
            handleExportCallback(event, tableClone);
        }
    };

    // Función para manejar cambios en los filtros
    const handleFilterChange = (columnName, value) => {
        setFilters(prev => ({
            ...prev,
            [columnName]: value
        }));
    };

    // #endregion === Definición de funciones. ===

    // Devuelve la tabla generada dinámicamente.
    return (
        <>
            <h2 className="event-title">{tableTitle}</h2>
            {columnHeaders.length > 0 && (
                <div className="table-container">
                    {/* Agregar los filtros */}
                    <div className="filters-row">
                        {columnHeaders.map(col => (
                            <div key={`filter-${col.name}`} className="filter-container">
                                <input
                                    type="text"
                                    placeholder={`Filtrar ${col.label}`}
                                    value={filters[col.name] || ''}
                                    onChange={(e) => handleFilterChange(col.name, e.target.value)}
                                />
                                {filters[col.name] && (
                                    <button
                                        className="clear-filter"
                                        onClick={() => handleFilterChange(col.name, '')}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <table ref={tableRef}>
                        <thead>
                            <tr>

                                {/* Genera una celda por cada nombre de columna */}
                                {columnHeaders.map(columnHeader => (
                                    <th 
                                        key={columnHeader.name}
                                        onClick={() => setSortConfig({
                                            key: columnHeader.name,
                                            direction: (sortConfig.key === columnHeader.name && sortConfig.direction === 'ascending' ? 'descending' : 'ascending')
                                        })}
                                    >
                                        {
                                            `${columnHeader.label}
                                            ${
                                                sortConfig.key === columnHeader.name ? (
                                                    `${sortConfig.direction === 'ascending' ? '▲' : '▼'}`
                                                ) : ''
                                            }`
                                        }
                                    </th>
                                ))}

                            </tr>
                        </thead>
                        <tbody>

                            {/* Genera una fila por cada registro */}
                            {filteredAndSortedData.map(row => (

                                    <tr key={row.id}>

                                        {/* Genera una celda por cada valor de la fila */}
                                        {row.values.map(item => 
                                        
                                            <td 
                                                key={row.id+'-'+item.columnName}
                                                
                                                className={

                                                    // Agrega la clase de alineación, si existe.
                                                    `${
                                                        columnHeaders.find(column => column.name === item.columnName)?.align
                                                        ? columnHeaders.find(column => column.name === item.columnName).align
                                                        : ''
                                                    }`

                                                }

                                            >
                                                {editingRow?.id === row.id && columnHeaders.find(column => column.name === item.columnName).editable
                                                    ? <select
                                                        value={editingRow?.values.find(val => val.columnName === item.columnName).value}
                                                        onChange={event => handleSelectChange(event, item.columnName)}
                                                    >
                                                        {columnHeaders.find(column => column.name === item.columnName).editOptions.map(option =>
                                                            <option
                                                                key={item.id+'-'+option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        )}
                                                    </select>
                                                    : item.value
                                                }
                                            </td>
                                        )}

                                        {(handleEditCallback && handleDeleteCallback) &&
                                            <td className="actions">

                                                {/* Genera el botón permitirá editar y guardar los cambios. */}
                                                <button
                                                    className={editingRow?.id === row.id ? 'save' : 'edit'}
                                                    onClick={() => {
                                                        editingRow?.id === row.id
                                                        ? handleSaveClick(row, editingRow)
                                                        : handleEditClick(row);
                                                    }}
                                                >
                                                    {editingRow?.id === row.id ? 'Guardar' : 'Editar'}
                                                </button>

                                                {/* Genera el botón que permitirá eliminar una fila y cancelar una edición */}
                                                <button
                                                    className={editingRow?.id === row.id ? 'cancel' : 'delete'}
                                                    onClick={() => {
                                                        editingRow?.id === row.id
                                                        ? handleCancelClick()
                                                        : handleDeleteCallback(row);
                                                    }}
                                                >
                                                    {editingRow?.id === row.id ? 'Cancelar' : 'Eliminar'}
                                                </button>
                                                
                                            </td>
                                        }

                                    </tr>

                            ))}

                        </tbody>
                    </table>
                </div>
            )}

            {/* Si se pasó callback de exportación, genera el botón de exportar */}
            {columnHeaders.length > 0 && handleExportCallback &&
            
                // Genera la fila para el botón de exportar la tabla
                <button
                    className="export-button"
                    onClick={handleExportClick}
                >
                    Exportar
                </button>
            }

        </>
    );
};

// Definición de tipos.
DynamicTable.propTypes = {
    tableTitle: PropTypes.string.isRequired, // Título de la tabla.
    columnHeaders: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired, // ID de la columna.
            label: PropTypes.string.isRequired, // Etiqueta a mostrar.
            editable: PropTypes.bool.isRequired, // Indica si la columna es editable.
            align: PropTypes.oneOf(Object.values(alignEnum)), // Alineación de la columna.
            sortFunction: PropTypes.func, // Función personalizada para ordenar esta columna.
            editOptions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])) // Opciones para editar cuando es editable.
        })
    ).isRequired,
    tableData: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired, // ID de la fila.
            values: PropTypes.arrayOf( // Arreglo de celdas.
                PropTypes.shape({
                    columnName: PropTypes.string.isRequired, // ID de la celda.
                    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Valor de la celda.
                })
            ).isRequired,
        })
    ).isRequired,
    handleEditCallback: PropTypes.func, // Callback para manejar la edición de una fila.
    handleDeleteCallback: PropTypes.func, // Callback para manejar la eliminación de una fila.
    handleExportCallback: PropTypes.func, // Callback para manejar la exportación de la tabla.
};

// Exportación del componente.
export default DynamicTable;