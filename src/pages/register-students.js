import { useState } from "react";

import { PageLayout } from "../components/page-layout";
import '../styles/register-students.css';
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

export function StudentRegistering() {
  const [fileName, setFileName] = useState('');
  const [fileHandler, setFileHandler] = useState('');
  const [sheetNameValue, setSheetNameValue] = useState('');
  const [cellRangeName, setCellRangeName] = useState('');
  const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(new SpreadsheetManipulator());

  const loadFile = (event) => {

    console.debug(`Se ejecuta la función loadFile. [event = ${event}]`);

    // Evita que se ejecute la llamada del submit.
    event.preventDefault();

    // Carga el archivo Excel y establece la función callback que se llamará al
    // finalizar la carga.
    spreadsheetManipulator.loadFile(fileHandler, loadRange);
    
  }

  /**
   * Carga el rango obtenido desde el formulario, e inserta los datos en la
   * tabla.
   */
  const loadRange = () => {

    console.debug(`Se ejecuta la función loadRange. [spreadsheetManipulator = ${spreadsheetManipulator}]`);

    // Lee un rango de celdas.
    spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, ["Legajo", "DNI", "Apellido", "Nombre", "Email"]);
    
    // Muestra los resultados en la tabla.
    let studentsTable = document.getElementsByClassName("student-table")[0];
    spreadsheetManipulator.insertDataIntoTable(studentsTable, "Tabla de estudiantes");
    studentsTable.classList.remove("not-displayed");

  }

  const handleFileSelection = (event) => {

    console.debug(`Se ejecuta el método handleFileSelection. [event = ${event}]`);

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

  const handleRegistering = () => {
    
    // Obtiene la lista de estudiantes.
    const studentsRequest =
      spreadsheetManipulator
      .getLastReadRange()
      .data
      .map((item) => {
        console.debug(`spreadsheetManipulator.getLastReadRange() = ${spreadsheetManipulator.getLastReadRange()}`);
        return {
          legajo: item["Legajo"],
          dni: item["DNI"],
          nombre: item["Apellido"],
          apellido: item["Nombre"],
          email: item["Email"],
        };
      });

    console.debug(`studentsRequest = ${studentsRequest}`);

    // Realiza la solicitud al endpoint para registrar la calificación.
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({students:studentsRequest})
    })
    .then((response) => {
      if (!response.ok) { throw new Error("Error al registrar los estudiantes."); }
      return response.json();
    })
    .then((response) => {
      // TODO: realiza las operaciones necesarias con el resultado de la solicitud.
      console.debug(response);
    })
    .catch((error) => {
      // TODO: maneja los errores de la solicitud.
      console.error(error);
    });

  }

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Registro de estudiantes</h1>
      <form onSubmit={loadFile}>
        <label htmlFor="file"><p>Seleccionar archivo de estudiantes</p></label>
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
        <button type="submit" className="load-button">Cargar archivo</button>
        <button
          type="button"
          className="register-student-button"
          onClick={handleRegistering}
        >Registrar estudiantes</button>
      </form>
      <table className="student-table not-displayed">
      </table>
    </PageLayout>
  );
}