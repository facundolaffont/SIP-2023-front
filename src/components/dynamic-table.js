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
 * @param {Array<{name: string, label: string, editable: boolean, align?: typeof alignEnum[keyof typeof alignEnum]}>} props.columnHeaders - Encabezados
 * de columna. Cada uno debe tener un nombre único, una etiqueta a mostrar, una marca que indica
 * si la columna es editable o no, y una propiedad opcional que determina la alineación, y que sólo
 * puede tener los valores del enumerado alignEnum.
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
    
    const [editableRow, setEditableRow] = useState(null);
    const [editingRowCopy, setEditingRowCopy] = useState(null);

    const [sortConfig, setSortConfig] = useState({
        key: columnHeaders[0]?.name || '',
        direction: 'ascending'
    });

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
    
    const sortedData = [...tableData].sort((a, b) => {
        
        const aValue = a.values.find(v => v.columnName === sortConfig.key)?.value;
        const bValue = b.values.find(v => v.columnName === sortConfig.key)?.value;

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;

        return 0;

    });
    
    // #endregion ==== Definición de variables. ====

    // #region === Definición de funciones. ===

    /**
     * Maneja el cambio de entrada en las celdas editables.
     * 
     * @param {*} event Evento de cambio en el campo editable.
     * @param {*} columnName Nombre de la columna a la que pertenece la celda editable.
     */
    const handleSelectChange = (event, columnName) => {

        const { value } = event.target;
        const updatedRow = { ...editingRowCopy, values: editingRowCopy.values.map(cell => 
            cell.columnName === columnName ? { ...cell, value } : cell
        )};
        setEditingRowCopy(updatedRow);
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
        const editableRow = { ...originalRow, values: originalRow.values.map(value => ({ ...value })) };
        setEditingRowCopy(editableRow);
        setEditableRow(editableRow.id);

    }

    /**
     * Maneja el evento clic en el botón de guardar, lo cual permite solicitar
     * la registración de los cambios en la base de datos.
     * 
     * @param {*} updatedRow Fila actualizada que se pretende guardar.
     */
    const handleSaveClick = (updatedRow) => {
        
        // Llama al callback que maneja la actualización de la fila
        // en la base de datos.
        handleEditCallback(updatedRow)
        .finally(() => {
            // Deshabilita el modo de edición.
            setEditableRow(null);
            setEditingRowCopy(null);
        })

    }

    /**
     * Maneja el evento de clic en el botón de cancelar, lo cual
     * deshabilita el modo de edición y reestablece los valores que se
     * hayan cambiado en la fila.
     */
    const handleCancelClick = () => {

        // Deshabilita el modo de edición.
        setEditableRow(null);
        setEditingRowCopy(null);

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

    // #endregion === Definición de funciones. ===

    // Devuelve la tabla generada dinámicamente.
    return (
        <>
            <h2 className="event-title">{tableTitle}</h2>
            {columnHeaders.length > 0 && (
                <div className="table-container">
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
                            {sortedData.map(row => (

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
                                                {editableRow === row.id && columnHeaders.find(column => column.name === item.columnName).editable
                                                    ? <select
                                                        value={editingRowCopy.values.find(val => val.columnName === item.columnName).value}
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
                                                    className={editableRow === row.id ? 'save' : 'edit'}
                                                    onClick={() => {
                                                        editableRow === row.id
                                                        ? handleSaveClick(editingRowCopy)
                                                        : handleEditClick(row);
                                                    }}
                                                >
                                                    {editableRow === row.id ? 'Guardar' : 'Editar'}
                                                </button>

                                                {/* Genera el botón que permitirá eliminar una fila y cancelar una edición */}
                                                <button
                                                    className={editableRow === row.id ? 'cancel' : 'delete'}
                                                    onClick={() => {
                                                        editableRow === row.id
                                                        ? handleCancelClick()
                                                        : handleDeleteCallback(row);
                                                    }}
                                                >
                                                    {editableRow === row.id ? 'Cancelar' : 'Eliminar'}
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