import { useState } from "react";

import { PageLayout } from "../components/page-layout";
import '../styles/register-califications.css';
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

export function CalificationRegistering() {
  const [fileName, setFileName] = useState('');
  const [fileHandler, setFileHandler] = useState('');
  const [sheetNameValue, setSheetNameValue] = useState('');
  const [cellRangeName, setCellRangeName] = useState('');
  const [calificationDate, setCalificationDate] = useState('');

  const loadFile = (event) => {
    // Evita que se ejecute la llamada del submit.
    event.preventDefault();

    // Carga el archivo Excel y establece la función callback que se llamará al
    // finalizar la carga.
    let spreadsheetManipulator = new SpreadsheetManipulator();
    spreadsheetManipulator.loadFile(fileHandler, finishedLoading);
    
  }

  const finishedLoading = (spreadsheetManipulator) => {
    // Lee un rango de celdas.
    spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, "Legajo", "Calificación");
    
    // Muestra los resultados en la tabla.
    let calificationsTable = document.getElementsByClassName("calification-table")[0];
    spreadsheetManipulator.insertDataIntoTable(calificationsTable, "Tabla de calificaciones");
    calificationsTable.classList.remove("not-displayed");
  }

  const handleFileSelection = (event) => {
    console.debug("handleFileSelection(...)");

    // Obtiene el nombre del archivo.
    const file = event.target.files[0];
    setFileName(file.name);
    setFileHandler(file);
    console.debug(file);
  }

  const handleSheetNameValueChange = (event) => {
    setSheetNameValue(event.target.value);
  }

  const handleCellRangeName = (event) => {
    setCellRangeName(event.target.value);
  }

  const handleCalificationDate = (event) => {
    setCalificationDate(
      event.target.value
    );
  }

  const handleRegistering = (event) => {
    // Construir JSON y enviarlo al back a la API
  }

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Registro de calificaciones</h1>
      <form onSubmit={loadFile}>
        <label htmlFor="file"><p>Seleccionar archivo de calificaciones</p></label>
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
            onChange={handleSheetNameValueChange}
            required
          />
          <label htmlFor="cell-range"><p>Rango de celdas a cargar</p></label>
          <input
            type="text"
            id="cell-range"
            onChange={handleCellRangeName}
            required
          />
          <label htmlFor="calification-date"><p>Fecha de la instancia de evaluación</p></label>
          <input
            type="date"
            id="calification-date"
            onChange={handleCalificationDate}
            required
          />
        <button type="submit" className="load-button">Cargar archivo</button>
        <button
          type="button"
          className="register-calification-button"
          onClick={handleRegistering}
        >Registrar calificaciones</button>
      </form>
      <table className="calification-table not-displayed">
      </table>
    </PageLayout>
  );
}