import { useState } from "react";

import { PageLayout } from "../components/page-layout";
import '../styles/register-students.css';
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

export function StudentRegistering() {
  const [fileName, setFileName] = useState('');
  const [fileHandler, setFileHandler] = useState('');
  const [sheetNameValue, setSheetNameValue] = useState('');
  const [cellRangeName, setCellRangeName] = useState('');

  const loadFile = (event) => {

    console.debug(`Se ejecuta la función loadFile. [event = ${event}]`);

    // Evita que se ejecute la llamada del submit.
    event.preventDefault();

    // Carga el archivo Excel y establece la función callback que se llamará al
    // finalizar la carga.
    let spreadsheetManipulator = new SpreadsheetManipulator();
    spreadsheetManipulator.loadFile(fileHandler, loadRange);
    
  }

  /**
   * Carga el rango obtenido desde el formulario, e inserta los datos en la
   * tabla.
   * 
   * @param {File} spreadsheetManipulator 
   */
  const loadRange = (spreadsheetManipulator) => {

    // debugger // Ya se cargó el archivo.

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

  // const handleRegistering = (event) => {
  //   const handleRegisterAttendance = () => {
  //     // Verificar si se ha seleccionado un evento
  //     if (selectedEventId) {
  //       // Obtener la lista de calificaciones
  //       //const calificaciones = obtenerListaDeCalificaciones(); // Debes implementar esta función según tus necesidades
  //       const attendanceData = spreadsheetManipulator.get().data.map((item) => {
  //         return {
  //           studentDossier: item[firstColumn], // Utiliza el valor de 'Legajo' como studentDossier
  //           attendance: item[lastColumn], // Utiliza el valor de 'Asistencia' como attendance
  //         };
  //       });
  //       console.log(attendanceData);
  //       // Crear el objeto de datos a enviar al endpoint
  //       const data = {
  //         courseEventId: selectedEventId,
  //         attendance: attendanceData
  //       };
  //       // Realizar la solicitud al endpoint para registrar la asistencia
  //       fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/add-attendance-on-event`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json'
  //         },
  //         body: JSON.stringify(data)
  //       })
  //       .then((response) => {
  //         if (!response.ok) {
  //           throw new Error("Error al registrar la asistencia");
  //         }
  //         return response.json();
  //       })
  //       .then((result) => {
  //         // Realizar las operaciones necesarias con el resultado de la solicitud
  //         console.log(result);
  //       })
  //       .catch((error) => {
  //         // Manejar los errores de la solicitud
  //         console.error(error);
  //       });
  //     } else {
  //       // Mostrar un mensaje de error o realizar alguna acción en caso de no haber seleccionado un evento
  //       console.error("No se ha seleccionado un evento");
  //     }
  //   }
  // }

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
          // onClick={handleRegistering}
        >Registrar estudiantes</button>
      </form>
      <table className="student-table not-displayed">
      </table>
    </PageLayout>
  );
}