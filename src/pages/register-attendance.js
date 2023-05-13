import { useState } from "react";
import { PageLayout } from "../components/page-layout";
import * as XLSX from 'xlsx';

export function AttendanceRegistering() {
  const [fileName, setFileName] = useState('');
  const [fileHandler, setFileHandler] = useState('');
  const [sheetNameValue, setSheetNameValue] = useState('');
  const [cellRangeName, setCellRangeName] = useState('');

  const handleFileSelection = (event) => {
    console.debug("handleFileSelection(...)");

    // Obtiene el nombre del archivo.
    const file = event.target.files[0];
    setFileName(file.name);
    setFileHandler(file);
  }

  const loadFile = (event) => {
    console.debug("loadFile(...)");
    console.debug(`Nombre del archivo: "${fileName}"`);
    console.debug(`Nombre de la pestaña de la planilla: "${sheetNameValue}"`);
    console.debug(`Nombre del rango de celdas a seleccionar: "${cellRangeName}"`);
    
    // Evita que se ejecute la llamada del submit.
    event.preventDefault();

    // Establece la función que se ejecutará cuando
    // se termine de cargar el archivo.
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      console.debug("Archivo cargado.");
      console.debug("Leyendo rango...");

      // Carga todos los datos de la planilla.
      const data = new Uint8Array(loadEvent.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Establece el nombre de la pestaña que se quiere seleccionar, y
      // obtiene un manejador.
      const sheetName = sheetNameValue;
      const sheet = workbook.Sheets[sheetName];

      // Lee el rango y almacena sólo la primera y última columna.
      const SheetJSRangeCells = XLSX.utils.decode_range(cellRangeName);
      const subrange = [];
      for (let R = SheetJSRangeCells.s.r; R <= SheetJSRangeCells.e.r; ++R) {
        
        // Obtiene los datos de la celda del legajo.
        const A1DossierCellAddress = XLSX.utils.encode_cell({
          r: R, c: SheetJSRangeCells.s.c
        });
        const SheetJSDossierCell = sheet[A1DossierCellAddress];
        const A1DossierColumnName = XLSX.utils.encode_col(SheetJSRangeCells.s.c);

        // Obtiene los datos de la celda de la asistencia.
        const A1AttendanceCellAddress = XLSX.utils.encode_cell({
          r: R, c: SheetJSRangeCells.e.c
        });
        const SheetJSAttendanceCell = sheet[A1AttendanceCellAddress];
        const A1AttendanceColumnName = XLSX.utils.encode_col(SheetJSRangeCells.e.c);

        // Guarda la celda, si tiene datos.
        const row = {};
        if (SheetJSDossierCell) {
          row["Legajo"] = SheetJSDossierCell.v;
          row["Asistencia"] = SheetJSAttendanceCell ? SheetJSAttendanceCell.v : 0;
          subrange.push(row);
        }
      }

      // Muestro los legajos y asistencias.
      console.debug("Rango leído:");
      console.debug(subrange);
    }

    // Lee el archivo.
    console.debug("Cargando archivo...");
    reader.readAsArrayBuffer(fileHandler);
  }

  const handleSheetNameValueChange = (event) => {
    setSheetNameValue(event.target.value);
  }

  const handleCellRangeName = (event) => {
    setCellRangeName(event.target.value);
  }

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Registro de asistencias</h1>
      <form onSubmit={loadFile}>
        <label htmlFor="file"><p>Seleccionar archivo de asistencias</p></label>
          <input
            type="file"
            id="file"
            onChange={handleFileSelection}
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
          /><p>{fileName}</p>
          <label htmlFor="sheet-name"><p>Nombre de la pestaña en la planilla</p></label>
          <input
            type="text"
            id="sheet-name"
            value={sheetNameValue}
            onChange={handleSheetNameValueChange}
            required
          />
          <label htmlFor="cell-range"><p>Rango de celdas a cargar</p></label>
          <input
            type="text"
            id="cell-range"
            value={cellRangeName}
            onChange={handleCellRangeName}
            required
          />
        <button type="submit" className="loadButton">Cargar archivo</button>
      </form>
    </PageLayout>
  );
}