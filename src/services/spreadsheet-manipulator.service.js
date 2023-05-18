import * as XLSX from 'xlsx';

/**
 * Manipula archivos Excel.
 */
class SpreadsheetManipulator {

    loadFile(fileObject, callback) {
        console.info(`Nombre del archivo: "${fileObject.name}"`);

        // Establece la función que se ejecutará cuando
        // se termine de cargar el archivo.
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
            console.debug(`Tipo de evento: ${loadEvent.type}.`);
            console.info("Archivo cargado.");

            // Carga todos los datos de la planilla.
            const data = new Uint8Array(loadEvent.target.result);
            this.#loadedWorkbook = XLSX.read(data, { type: 'array' });

            // Habilita el uso del resto de los métodos y llama a la función callback.
            callback(this);
        };

        // Lee el archivo.
        console.info("Cargando archivo...");
        fileReader.readAsArrayBuffer(fileObject);
    }

    // Carga un rango en una variable interna.
    loadRange(sheetName, A1CellRange, firstColumnName, lastColumnName) {
        if (this.#loadedWorkbook) {
            console.debug(`Nombre de la pestaña de la planilla: "${sheetName}"`);
            console.debug(`Nombre del rango de celdas a seleccionar: "${A1CellRange}"`);
            console.debug(`Nombre que se le va a asignar a la primera columna: "${firstColumnName}"`);
            console.debug(`Nombre que se le va a asignar a la última columna: "${lastColumnName}"`);
            
            // Establece el nombre de la pestaña que se quiere seleccionar, y
            // obtiene un manejador.
            const sheet = this.#loadedWorkbook.Sheets[sheetName];

            // Lee el rango y almacena sólo la primera y última columna.
            const SheetJSRangeCells = XLSX.utils.decode_range(A1CellRange);
            this.#lastRangeRead = {
                firstColumn: firstColumnName,
                lastColumn: lastColumnName,
                data: [],
            }
            console.debug(`this.#lastRangeRead = ${this.#lastRangeRead}`);
            for (let R = SheetJSRangeCells.s.r; R <= SheetJSRangeCells.e.r; ++R) {
                
                // Obtiene los datos de la celda de la primera columna.
                const A1FirstColumnCellAddress = XLSX.utils.encode_cell({
                    r: R, c: SheetJSRangeCells.s.c
                });
                const SheetJSFirstColumnCell = sheet[A1FirstColumnCellAddress];

                // Obtiene los datos de la celda de la asistencia.
                const A1LastColumnCellAddress = XLSX.utils.encode_cell({
                    r: R, c: SheetJSRangeCells.e.c
                });
                const SheetJSLastColumnCell = sheet[A1LastColumnCellAddress];

                // Guarda la celda, si tiene datos.
                const row = {};
                if (SheetJSFirstColumnCell) {
                    row[this.#lastRangeRead.firstColumn] = SheetJSFirstColumnCell.v;
                    row[this.#lastRangeRead.lastColumn] = SheetJSLastColumnCell ? SheetJSLastColumnCell.v : 0;
                    this.#lastRangeRead.data.push(row);
                }
            }

            console.info("Rango leído.");
            console.debug(this.#lastRangeRead);
        }
    }

    // Recibe un elemento <table> como argumento e inserta dentro los datos
    // leídos del archivo.
    insertDataIntoTable(htmlTable, title) {
        if (this.#loadedWorkbook) {

            /* Crea la siguiente estructura dentro de la tabla:
                <thead>
                    <tr>
                        <td colSpan="2">title</td>
                    </tr>
                    <tr>
                        <td>this.#lastRangeRead.firstColumn</td>
                        <td>this.#lastRangeRead.lastColumn</td>
                    </tr>
                </thead>
                <tbody>
                    // Contenido que se agrega a continuación.
                </tbody>
            */
            let htmlTableChildren = htmlTable.childNodes;
            while (htmlTable.firstChild) {
                htmlTable.removeChild(htmlTable.firstChild);
            }
            htmlTable.appendChild(
                document.createElement("thead")
            ).appendChild(
                document.createElement("tr")
            ).appendChild(
                document.createElement("td")
            ).appendChild(
                document.createTextNode(title)
            ).parentNode.parentNode.parentNode // thead
            .appendChild(
                document.createElement("tr")
            ).appendChild(
                document.createElement("td")
            ).appendChild(
                document.createTextNode(this.#lastRangeRead.firstColumn)
            ).parentNode.parentNode // tr
            .appendChild(
                document.createElement("td")
            ).appendChild(
                document.createTextNode(this.#lastRangeRead.lastColumn)
            ).parentNode.parentNode.parentNode.parentNode // htmlTable
            .appendChild(
                document.createElement("tbody")
            );
            htmlTable
                .childNodes[0] // thead
                .childNodes[0] // thead.tr[0]
                .childNodes[0] // thead.tr[0].td
                .setAttribute("colSpan", "2")
            console.debug(htmlTable.outerHTML);

            // Agrega el contenido de las celdas leídas dentro del <tbody> de la htmlTable.
            for (let register = 0; register < this.#lastRangeRead.data.length; register++) {
                let tableRow = document.createElement("tr");
                let firstColumnTableData = document.createElement("td");
                let lastColumnTableData = document.createElement("td");
                let sheetJSFirstColumnCellObject = this.#lastRangeRead.data[register][this.#lastRangeRead.firstColumn];
                let sheetJSLastColumnCellObject = this.#lastRangeRead.data[register][this.#lastRangeRead.lastColumn];
                firstColumnTableData.innerHTML = sheetJSFirstColumnCellObject;
                lastColumnTableData.innerHTML = sheetJSLastColumnCellObject;
                tableRow.appendChild(firstColumnTableData);
                tableRow.appendChild(lastColumnTableData);
                htmlTable.childNodes[1].appendChild(tableRow);
            }
            console.debug(htmlTable.outerHTML);
        }
    }


    /* Private */

    #loadedWorkbook;
    #lastRangeRead;
}

export default SpreadsheetManipulator;