import { useState } from "react";

import { PageLayout } from "../components/page-layout";
import '../styles/register-attendance.css';
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

export function AttendanceRegistering() {
  const [fileName, setFileName] = useState('');
  const [fileHandler, setFileHandler] = useState('');
  const [sheetNameValue, setSheetNameValue] = useState('');
  const [cellRangeName, setCellRangeName] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');

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
    spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, "Legajo", "Asistencia");
    
    // Muestra los resultados en la tabla.
    let calificationsTable = document.getElementsByClassName("attendance-table")[0];
    spreadsheetManipulator.insertDataIntoTable(calificationsTable, "Tabla de asistencias");
    calificationsTable.classList.remove("not-displayed");
  }

  // TODO: obtiene, si existe, el evento de cursada establecido
  // en un día para una comisión.
  const getClassEventByDateAndCommission = async (event) => {};

  const handleFileSelection = (event) => {
    console.debug("handleFileSelection(...)");

    // Obtiene el nombre y objeto File del archivo.
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

  const handleAttendanceDate = (event) => {
    setAttendanceDate(
      event.target.value
    );
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
          <label htmlFor="attendance-date"><p>Fecha de asistencia</p></label>
          <input
            type="date"
            id="attendance-date"
            onChange={handleAttendanceDate}
            required
          />
        <button type="submit" className="load-button">Cargar archivo</button>
        <button type="button" className="register-attendance-button">Registrar asistencia</button>
      </form>
      <table className="attendance-table not-displayed">
      </table>
    </PageLayout>
  );
}