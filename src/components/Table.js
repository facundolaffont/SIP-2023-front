/**
 * Componente Tabla Reutilizable (React Way)
 * @param {String} title - (Opcional) Título general que ocupa toda la cabecera.
 * @param {Array} columns - Configuración de columnas [{ header: 'Nombre', accessor: 'prop', className: 'css-class', render: (row) => JSX }]
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
    onRowMouseOut 
}) => {
    // Obtenemos la cantidad de columnas para los colSpan
    const colCount = columns?.length || 0;

    return (
        <div className="table-container">
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
                    {/* (B) Títulos de columna */}
                    <tr>
                        {columns && columns.map((col, index) => (
                            <th key={`th-${index}`} className={col.className || ''}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                
                <tbody>
                    {/* (C) Manejo del Estado Vacío */}
                    {!data || data.length === 0 ? (
                        <tr>
                            <td colSpan={colCount} style={{ textAlign: "center", padding: "20px" }}>
                                No hay registros para mostrar.
                            </td>
                        </tr>
                    ) : (
                        /* (D) Renderizado de Datos */
                        data.map((row, rowIndex) => (
                            <tr 
                                key={`tr-${row.id || rowIndex}`} 
                                // Clase para filas impares
                                className={rowIndex % 2 !== 0 ? "even-row" : ""}
                                
                                // Eventos nativos
                                onClick={() => onRowClick && onRowClick(row)}
                                onMouseOver={() => onRowMouseOver && onRowMouseOver(row)}
                                onMouseMove={() => onRowMouseMove && onRowMouseMove(row)}
                                onMouseOut={() => onRowMouseOut && onRowMouseOut(row)}
                                
                                // Cambio visual si la fila es clickeable
                                style={onRowClick ? { cursor: 'pointer' } : {}}
                            >
                                {columns.map((col, colIndex) => {
                                    const cellValue = row[col.accessor];
                                    
                                    // Lógica original de booleanos ('x' o vacío)
                                    const displayValue = typeof cellValue === 'boolean' 
                                        ? (cellValue ? 'x' : '') 
                                        : cellValue;

                                    return (
                                        <td key={`td-${rowIndex}-${colIndex}`} className={col.className || ''}>
                                            {/* Si hay un render custom, lo usa; sino muestra el valor limpio */}
                                            {col.render ? col.render(row) : displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};