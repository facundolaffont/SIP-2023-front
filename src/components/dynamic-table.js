// Imports.
import PropTypes from 'prop-types';
import { useState } from 'react';

/**
 * Componente de tabla dinámica para renderizar datos tabulares.
 *
 * @param {Object} props - Parámetros del componente.
 * @param {string} props.dynamicTableClassName - Nombre de clase CSS para aplicar a la tabla.
 * @param {Array<{ id: string, value: string }>} props.columnHeaders - Encabezados de columna. Cada uno debe tener un `id` único y un `value` a mostrar.
 * @param {Array<{ id: string, values: Array<{ id: string, value: string | number }> }>} props.tableData - Filas de la tabla. Cada fila debe tener un `id` único y un array de celdas (`values`) con `id` y `value`.
 *
 * @returns {JSX.Element} Tabla HTML construida dinámicamente con encabezados y datos.
 */
const DynamicTable = ({dynamicTableClassName, columnHeaders, tableData}) => {

    // #region === Definición de estados. ===
    
    const [sortConfig, setSortConfig] = useState({
        key: columnHeaders[0]?.id || '',
        direction: 'ascending'
    });

    // #endregion === Definición de estados. ===

    // #region ==== Definición de variables. ====
    
    const sortedData = [...tableData].sort((a, b) => {
        
        const aValue = a.values.find(v => v.id === sortConfig.key)?.value;
        const bValue = b.values.find(v => v.id === sortConfig.key)?.value;

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;

        return 0;

    });
    
    // #endregion ==== Definición de variables. ====
    
    // Devuelve la tabla generada dinámicamente.
    return (
        <table className={dynamicTableClassName}>
            <thead>
                <tr>

                    {/* Genera una celda por cada nombre de columna. */}
                    {columnHeaders.map(columnHeader => (
                        <th 
                            key={columnHeader.id}
                            onClick={clickEvent => setSortConfig({
                                key: columnHeader.id,
                                direction: (sortConfig.key === columnHeader.id && sortConfig.direction === 'ascending' ? 'descending' : 'ascending')
                            })}
                        >
                            {sortConfig.key === columnHeader.id && (
                                `${columnHeader.value} ${sortConfig.direction === 'ascending' ? '▲' : '▼'}`
                            )}
                        </th>
                    ))}

                </tr>
            </thead>
            <tbody>

                {/* Genera una fila por cada registro. */}
                {sortedData.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? "even" : "odd"}>
                        {row.values.map(item => 
                            <td key={item.id}>{item.value}</td>
                        )}
                    </tr>
                ))}

            </tbody>
        </table>
    );
};

// Definición de tipos.
DynamicTable.propTypes = {
  dynamicTableClassName: PropTypes.string.isRequired,
  columnHeaders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired, // ID de la columna.
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  tableData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired, // ID de la fila.
      values: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired, // ID de la celda.
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
      ).isRequired,
    })
  ).isRequired,
};

// Exportación del componente.
export default DynamicTable;