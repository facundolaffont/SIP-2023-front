/**
 * Manipula tablas HTML.
 */
export default class HTMLTableManipulator {

    /**
     * @typedef {Object} TableBodyDataType Contiene los nombres y datos de las columnas de una tabla.
     * 
     * @property {!Array.<Object.<string,(string|number|boolean)>>} tableRows Debe contener las filas de
     * la tabla, de forma tal que cada propiedad de cada objeto del arreglo contendrá el valor de una
     * columna para la fila que representa el objeto y los nombres de las propiedades y la cantidad deben
     * ser los mismos que en {@link columnNames}.
     * 
     * @property {!Array.<string>} columnNames Debe contener un arreglo de cadenas de caracteres con el
     * siguiente format: nombre-de-propiedad:nombre-de-columna. El nombre-de-propiedad será el de la
     * propiedad de cada objecto de {@link tableRows} que contiene el valor de la columna nombre-de-columna.
     * Este último nombre se utilizará para la cabecera de la columna.
     * 
     * @property {Array.<string>} [columnClasses] Tendrá la información necesaria para agregar clases a las
     * diferentes columnas de la tabla. El formato debe ser el siguiente:
     * nombre-de-propiedad:lista-de-clases-separadas-por-espacios. El nombre-de-propiedad tiene el mismo
     * objetivo que el descrito en la propiedad {@link columnNames}.
     * 
     * @property {*} [onClickEventHandler] La función que se ejecutará si se hace clic en una fila.
     * @property {*} [onClickEventHandlerParameters] Los parámetros que se pasan al manejador del evento click.
     * 
     * onMousemoveEventHandler
     * @property {*} [onMousemoveEventHandler] La función que se ejecutará si se pasa el mouse sobre una fila.
     * @property {*} [onMousemoveEventHandlerParameters] Los parámetros que se pasan al manejador del evento mousemove.
     * 
     * @property {*} [onMouseoverEventHandler] La función que se ejecutará si se posa el mouse en una fila.
     * @property {*} [onMouseoverEventHandlerParameters] Los parámetros que se pasan al manejador del evento mouseover.
     * 
     * @property {*} [onMouseoutEventHandler] La función que se ejecutará si se quita el mouse de una fila.
     */
    /**
     * Inserta, dentro de la tabla {@link htmlTable}, los registros de {@link tableBodyData} y agrega a las
     * columnas especificadas en {@link columnClasses} las clases especificadas también en dicha propiedad.
     * 
     * @param {!HTMLTableElement} htmlTable Tabla en la que se insertarán los últimos registros leídos.
     * @param {!TableBodyDataType} tableBodyData Registros a insertar en la tabla.
     * @param {String} [title] Título para la tabla.
     */
    static insertDataIntoTable(htmlTable, tableBodyData, title) {

        /*
         * (A) Elimina los hijos que pueda tener la tabla que se pasa por argumento.
         *
         * (B) Luego, crea la siguiente estructura dentro de la tabla:
         *
         * <thead>
         *      <tr>
         *          <td colSpan="N">title</td> // Donde N es igual a la cantidad de columnas
         *                                     // que tendrá la tabla.
         *      </tr>
         *      <tr>
         *          <td>tableBodyData.columnNames[0]</td>
         *          <td>tableBodyData.columnNames[1]</td>
         *          ...
         *      </tr>
         *  </thead>
         *  <tbody>
         *      // Contenido que se agrega a continuación.
         *  </tbody>
         * 
         * (BA) Crea la sección del título de la tabla, si fue especificada;
         *
         * (BB) la sección de los títulos de columna;
         *
         * (BC) y la estructura del cuerpo.
         *
         * (C) Posteriormente, agrega el contenido de tableBodyData dentro del cuerpo de la tabla.
         */

        // Elimina los hijos que pueda tener la tabla que se pasa por argumento.
        while (htmlTable.firstChild) {
            htmlTable.removeChild(htmlTable.firstChild);
        }

        // Crea la sección del título de la tabla, si fue especificada.
        let htmlTableTheadTag = htmlTable.appendChild(
            document.createElement("thead")
        );
        if (typeof title !== 'undefined') {
            htmlTableTheadTag.appendChild(
                document.createElement("tr")
            ).appendChild(
                document.createElement("td")
            ).appendChild(
                document.createTextNode(title)
            );
            htmlTableTheadTag
                .childNodes[0].childNodes[0] // thead.tr[0].td
                .setAttribute("colSpan", tableBodyData.columnNames.length);
        };

        // Crea un arreglo con las clases de las columnas, si las hubiere.
        if (typeof tableBodyData.columnClasses !== 'undefined') {
            var columnClasses = {};
            tableBodyData
                .columnClasses
                .forEach(columnClassEspecification => {

                    // Obtiene el índice del separator de campos.
                    let indexOfSeparator = columnClassEspecification.indexOf(":");

                    // Obtiene el nombre de la columna.
                    let columnName = columnClassEspecification
                        .substring(
                            0,
                            indexOfSeparator
                        );

                    // Obtiene las classes, separadas por espacio, en un solo String.
                    let classes = columnClassEspecification
                        .substring(
                            indexOfSeparator + 1
                        );

                    // Guarda las clases en la propiedad que representa a la columna.
                    columnClasses[columnName] = classes.split(" ");

                });
        }

        // Crea la sección de los títulos de columna.
        let tableColumnsParentTag = htmlTableTheadTag
        .appendChild(
            document.createElement("tr")
        );
        tableBodyData.columnNames.forEach((value, index) => {

            // Crea el elemento.
            let newColumnHeader = document.createElement("td");
            newColumnHeader
            .appendChild(
                document.createTextNode(
                    tableBodyData
                    .columnNames
                    .at(index)
                    .substring(
                        tableBodyData
                        .columnNames
                        .at(index)
                        .indexOf(':') + 1
                    )
                )
            );

            // Añade el elemento a la cabecera.
            tableColumnsParentTag // thead.tr[1]
            .appendChild(newColumnHeader);

        });
        
        // Crea la estructura del cuerpo.
        let tableBody = htmlTable.appendChild(
            document.createElement("tbody")
        );

        // Agrega el contenido de tableBodyData dentro del cuerpo de la tabla.
        for (let register = 0; register < tableBodyData.tableRows.length; register++) {

            let tableRow = document.createElement("tr");

            // Añade, si se hubiere pasado por argumento, el manejador para el evento
            // click.
            if(typeof tableBodyData.onClickEventHandler !== 'undefined') {
                
                // Obtiene los datos a guardar de la misma tabla.
                let values = [];
                tableBodyData.onClickEventHandlerParameters.forEach(columnName => {
                    values.push(tableBodyData.tableRows.at(register)[columnName]);
                });

                // Registra el manejador.
                tableRow.addEventListener('click', function() {
                    tableBodyData.onClickEventHandler(...values);
                });

            }

            // Añade, si se hubiere pasado por argumento, el manejador para el evento
            // mousemove.
            if(typeof tableBodyData.onMousemoveEventHandler !== 'undefined') {
                
                // Obtiene los datos a guardar de la misma tabla.
                let values = [];
                tableBodyData.onMousemoveEventHandlerParameters.forEach(columnName => {
                    values.push(tableBodyData.tableRows.at(register)[columnName]);
                });

                // Registra el manejador.
                tableRow.addEventListener('mouseover', function() {
                    tableBodyData.onMousemoveEventHandler(...values);
                });

            }

            // Añade, si se hubiere pasado por argumento, el manejador para el evento
            // mouseover.
            if(typeof tableBodyData.onMouseoverEventHandler !== 'undefined') {
                
                // Obtiene los datos a guardar de la misma tabla.
                let values = [];
                tableBodyData.onMouseoverEventHandlerParameters.forEach(columnName => {
                    values.push(tableBodyData.tableRows.at(register)[columnName]);
                });

                // Registra el manejador.
                tableRow.addEventListener('mouseover', function() {
                    tableBodyData.onMouseoverEventHandler(...values);
                });

            }

            // Añade, si se hubiere pasado por argumento, el manejador para el evento
            // mouseout.
            if(typeof tableBodyData.onMouseoutEventHandler !== 'undefined') {

                // Registra el manejador.
                tableRow.addEventListener('mouseout', function() {
                    tableBodyData.onMouseoutEventHandler();
                });

            }

            // Añade la clase 'even-row' para las filas impares.
            if (register % 2 !== 0) tableRow.classList.add("even-row");

            for (let columnIndex = 0; columnIndex < tableBodyData.columnNames.length; columnIndex++) {
                
                // Obtiene el nombre de la columna.
                let indexOfSeparator = tableBodyData
                    .columnNames
                    .at(columnIndex)
                    .indexOf(":");
                let columnName = tableBodyData
                    .columnNames
                    .at(columnIndex)
                    .substring(
                        0,
                        indexOfSeparator
                    );
                
                // Obtiene el valor de la celda actual según el número momentáneo de registro y columna.
                let sheetJSCellObject = tableBodyData.tableRows.at(register)[columnName];
                
                // Asigna valores, convirtiendo valores booleanos en 'x' cuando son
                // verdaderos, y en un string vacío cuando son falsos.
                let columnDataTag = document.createElement("td");
                columnDataTag.innerHTML =
                    (typeof sheetJSCellObject === 'boolean')
                    ? (
                        (sheetJSCellObject === true)
                        ? 'x'
                        : ''
                    )
                    : sheetJSCellObject

                ;

                // Si se especificaron clases para la columna, las agrega.
                if (typeof columnClasses !== 'undefined') {
                    if (typeof columnClasses[columnName] !== 'undefined') {
                        columnClasses[columnName].forEach(className => {
                            columnDataTag.classList.add(className);
                        });
                    }
                }

                // Agrega la celda.
                tableRow.appendChild(columnDataTag);

            }

            tableBody.appendChild(tableRow);

        }

    }

}
