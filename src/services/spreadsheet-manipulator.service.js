import * as XLSX from 'xlsx';

/**
 * Manipula archivos Excel.
 */
class SpreadsheetManipulator {

    /**
     * @callback onFileLoadCallback Función callback que se llamará cuando se termine de cargar la planilla.
     * @param {File} spreadsheetManipulator El manejador del archivo de plantilla.
     * @return {void}
     */

    /**
     * Carga un archivo Excel o OpenDocument en memoria, para
     * posteriormente extraer información por rangos.
     * 
     * @param {File} fileHandler El manejador del archivo Excel o OpenDocument.
     * @param {onFileLoadCallback} onFileLoad Función callback que se llamará cuando se termine de cargar la planilla.
     */
    loadFile(fileHandler, onFileLoad) {

        console.info(`Nombre del archivo: "${fileHandler.name}"`);

        // Establece la función que se ejecutará cuando
        // se termine de cargar el archivo.
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
            
            console.debug(`Tipo de evento: ${loadEvent.type}.`);
            console.info("Archivo cargado.");

            // Carga todos los datos de la planilla.
            const data = new Uint8Array(loadEvent.target.result);
            this.#loadedWorkbook = XLSX.read(data, { type: 'array' });

            // debugger // Ya se cargó el archivo.

            // Habilita el uso del resto de los métodos y llama a la función callback.
            onFileLoad(this);

        };

        // Lee el archivo.
        console.info("Cargando archivo...");
        fileReader.readAsArrayBuffer(fileHandler);

    }

    /**
     * Carga los extremos de un rango en una variable interna.
     * 
     * @param {String} sheetName Nombre de la pestaña en la planilla.
     * @param {String} A1CellRange Rango, en notación A1, que se quiere leer.
     * @param {Array.<String>} columnNames Lista de nombres de las columnas (debe tener la misma cantidad de nombres que de columnas en {@link A1CellRange}).
     * 
     * TODO: hacer que los nombres de las columnas estén implementadas como en
     * el método 'loadRange'.
     */
    loadRangeSides(sheetName, A1CellRange, columnNames) {
    // @param {String} firstColumnName Nombre que tendrá la primera columna.
    // @param {String} lastColumnName Nombre que tendrá la última columna.
    // loadRangeSides(sheetName, A1CellRange, firstColumnName, columnNames) {

        console.debug(`Se ejecuta la función loadRangeSides. 
            [sheetName = ${sheetName}] 
            [A1CellRange = ${A1CellRange}] 
            [columnNames = ${columnNames}] 
        `);

        if (this.#loadedWorkbook) {
            
            // Establece el nombre de la pestaña que se quiere seleccionar, y
            // obtiene un manejador.
            const sheet = this.#loadedWorkbook.Sheets[sheetName];

            // Lee el rango y almacena sólo la primera y última columna.
            const sheetJSRangeCells = XLSX.utils.decode_range(A1CellRange);
            this.#lastReadRange = {
                columnNames: columnNames,
                data: [],
            }
            console.debug(`this.#lastReadRange = ${this.#lastReadRange}`);
            for (let R = sheetJSRangeCells.s.r; R <= sheetJSRangeCells.e.r; ++R) {
                
                // Obtiene los datos de la celda de la primera columna.
                const a1FirstColumnCellAddress = XLSX.utils.encode_cell({
                    r: R, c: sheetJSRangeCells.s.c
                });
                const sheetJSFirstColumnCell = sheet[a1FirstColumnCellAddress];

                // Obtiene los datos de la celda de la asistencia.
                const a1LastColumnCellAddress = XLSX.utils.encode_cell({
                    r: R, c: sheetJSRangeCells.e.c
                });
                const SheetJSLastColumnCell = sheet[a1LastColumnCellAddress];

                // Guarda la celda, si tiene datos.
                const row = {};
                if (sheetJSFirstColumnCell) {
                    row[columnNames.at(0)] = sheetJSFirstColumnCell.v;
                    row[columnNames.at(1)] = SheetJSLastColumnCell ? SheetJSLastColumnCell.v : 0;
                    this.#lastReadRange.data.push(row);
                }
            }

            console.info("Rango leído.");
            console.debug(`this.#lastReadRange = ${this.#lastReadRange}`);
        }

    }

    /**
     * Carga un rango en una variable interna.
     * 
     * @param {String} sheetName Nombre de la pestaña en la planilla.
     * @param {String} A1CellRange Rango, en notación A1, que se quiere leer.
     * @param {Array.<String>} columnNames Lista de nombres de las columnas (debe tener la misma cantidad de nombres que de columnas en {@link A1CellRange}).
     */
    loadRange(sheetName, A1CellRange, columnNames) {

        console.debug(`Se ejecuta la función loadRange. 
            [sheetName = ${sheetName}] 
            [A1CellRange = ${A1CellRange}] 
            [columnNames = ${columnNames}]
        `);

        if (this.#loadedWorkbook) {
            
            // debugger // Ya se cargó el archivo.

            // Establece el nombre de la pestaña que se quiere seleccionar, y
            // obtiene un manejador.
            const sheet = this.#loadedWorkbook.Sheets[sheetName];
            
            // Lee el rango y almacena todas las columnas.
            //
            // TODO: validar que la cantidad de columnas leídas sea igual
            // que la cantidad de elementos en 'columnNames'.
            const sheetJSRangeCells = XLSX.utils.decode_range(A1CellRange);
            this.#lastReadRange = {
                columnNames: columnNames,
                data: [],
            }
            // debugger // A punto de cargar los valores en el arreglo.
            console.debug(`this.#lastReadRange = ${this.#lastReadRange}`);
            let columnNamesArrayIndex;
            for (let R = sheetJSRangeCells.s.r; R <= sheetJSRangeCells.e.r; ++R) {

                const row = {};
                columnNamesArrayIndex = 0;

                for (let C = sheetJSRangeCells.s.c; C <= sheetJSRangeCells.e.c; ++C) {
                
                    // Obtiene los datos de la celda de la columna.
                    const a1ColumnCellAddress = XLSX.utils.encode_cell({
                        r: R, c: C
                    });
                    const sheetJSColumnCell = sheet[a1ColumnCellAddress];

                    // Guarda la celda, si tiene datos.
                    debugger
                    if (sheetJSColumnCell) {
                        row[columnNames.at(columnNamesArrayIndex++)] = sheetJSColumnCell.v; // TODO: Cambiar 'C' por el nombre de la columna.
                    }

                }

                
                this.#lastReadRange.data.push(row);

                // debugger // Se cargó un registro.

            }

            console.info("Rango leído.");
            console.debug(`this.#lastReadRange = ${this.#lastReadRange}`);

        }

    }

    /**
     * Inserta, dentro de la tabla pasada por parámetro, los registros leídos de la planilla.
     * 
     * @param {HTMLTableElement} htmlTable Tabla en la que se insertarán los últimos registros leídos.
     * @param {String} title Título para la tabla.
     */
    insertDataIntoTable(htmlTable, title) {

        if (this.#loadedWorkbook) {
            
            // debugger // Rango cargado. Se insertará en una tabla.

            /**
             * Elimina los hijos que pueda tener la tabla que se pasa por argumento (A). Luego,
             * crea la siguiente estructura dentro de la tabla:
             *
             * <thead>
             *      <tr>
             *          <td colSpan="2">title</td>
             *      </tr>
             *      <tr>
             *          <td>this.#lastReadRange.columnNames[0]</td>
             *          <td>this.#lastReadRange.columnNames[1]</td>
             *          ...
             *      </tr>
             *  </thead>
             *  <tbody>
             *      // Contenido que se agrega a continuación.
             *  </tbody>
             * 
             * Crea la sección del título de la tabla (BA), la sección de los títulos
             * de columna (BB), y la estructura del cuerpo (BC)...
             */

            // (A)
            while (htmlTable.firstChild) {
                htmlTable.removeChild(htmlTable.firstChild);
            }

            // (BA)
            htmlTable.appendChild(
                document.createElement("thead")
            ).appendChild(
                document.createElement("tr")
            ).appendChild(
                document.createElement("td")
            ).appendChild(
                document.createTextNode(title)
            );
            htmlTable
                .childNodes[0].childNodes[0].childNodes[0] // thead.tr[0].td
                .setAttribute("colSpan", this.#lastReadRange.columnNames.length)
            console.debug(htmlTable.outerHTML);

            // (BB)
            let tableColumnsParentTag =
                htmlTable
                .childNodes[0]
                .appendChild(
                    document.createElement("tr")
                );
            this.#lastReadRange.columnNames.forEach((value, index) => {
                tableColumnsParentTag // thead.tr[1]
                    .appendChild(
                        document.createElement("td")
                    ).appendChild(
                        document.createTextNode(this.#lastReadRange.columnNames.at(index))
                    );
            });
            
            // (BC)
            let tableBody = htmlTable.appendChild(
                document.createElement("tbody")
            );

            // Agrega el contenido de las celdas leídas dentro del <tbody> de la htmlTable.
            for (let register = 0; register < this.#lastReadRange.data.length; register++) {

                let tableRow = document.createElement("tr");

                debugger
                for (let columnIndex = 0; columnIndex < this.#lastReadRange.columnNames.length; columnIndex++) {

                    let columnDataTag = document.createElement("td");
                    let sheetJSCellObject = this.#lastReadRange.data.at(register)[
                        this.#lastReadRange.columnNames.at(columnIndex)
                    ];
                    columnDataTag.innerHTML = sheetJSCellObject;
                    tableRow.appendChild(columnDataTag);

                }

                tableBody.appendChild(tableRow);
                debugger

            }

            console.debug(htmlTable.outerHTML);

        }

    }

    /**
     * @returns {Object} Un arreglo de filas del último rango leído.
     */
    getLastReadRange() { return this.#lastReadRange; }


    /* Private */

    /**
     * Manejador de la planilla cargada en memoria.
     * @type {Object}
     */
    #loadedWorkbook;

    /**
     * @typedef {Object} lastReadRangeType
     * @property {Array.<Object>} columnNames - Los nombres de columna de los datos en {@link data}, ordenados tal como se cargaron.
     * @property {Array.<Object>} data - Contiene los registros que se leyeron de la planilla.
     */
    /**
     * Manejador del último rango cargado en memoria.
     * @type {lastReadRangeType}
     */
    #lastReadRange;
}

export default SpreadsheetManipulator;