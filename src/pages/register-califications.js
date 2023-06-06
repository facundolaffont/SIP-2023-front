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
  const [spreadsheetManipulator, setSpreadSheet] = useState('');
  const [firstColumn, setFirstColumn] = useState('Legajo');
  const [lastColumn, setLastColumn] = useState('Calificación');
  const [selectedEventId, setSelectedEventId] = useState(null); // Estado para almacenar el ID del evento seleccionado


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
    setSpreadSheet(spreadsheetManipulator);
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
    const selectedDate = event.target.value;
    setCalificationDate(selectedDate);
    
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get?date=${selectedDate}`, {
      method: 'GET',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los eventos de la cursada");
        }
        return response.json();
      })
      .then((classEvents) => {

        // Aca vamos armando los elementos necesarios para mostrar los eventos
        console.log(classEvents);
        const eventosContainer = document.getElementById('eventos-container');
        const tituloContainer = document.createElement('h2');

        tituloContainer.textContent = 'Eventos para la fecha';
        eventosContainer.innerHTML = '';
  
        // Iterar sobre los eventos y crear un cuadro para cada uno
        classEvents.forEach((evento, index) => {

          const cuadroEvento = document.createElement('div');
          cuadroEvento.classList.add('cuadro-cursada');

          // Agregar un atributo de datos para almacenar el índice del evento
          cuadroEvento.setAttribute('data-index', index);

          // Mostrar los detalles del evento dentro del cuadro
          const nombreEvento = document.createElement('h3');
          nombreEvento.textContent = `Tipo de evento: ` + evento.tipoEvento.nombre;

          const detallesEvento = document.createElement('p');
          detallesEvento.textContent = `Fecha de Inicio: ${formatDateTime(evento.fechaHoraInicio)}, Fecha de Fin: ${formatDateTime(evento.fechaHoraFin)}`;

          cuadroEvento.appendChild(nombreEvento);
          cuadroEvento.appendChild(detallesEvento);

          // Agregar un evento de clic al cuadro del evento
          cuadroEvento.addEventListener('click', () => {

            // Obtener el índice del evento seleccionado
            const selectedIndex = parseInt(cuadroEvento.getAttribute('data-index'), 10);

            const selectedEventId = classEvents[selectedIndex].id;

            // Verificar si el cuadro ya está seleccionado
            const isAlreadySelected = cuadroEvento.classList.contains('selected');

            // Resalto visualmente el evento seleccionado o lo deselecciono
            const cuadrosEventos = document.getElementsByClassName('cuadro-cursada');
            for (let i = 0; i < cuadrosEventos.length; i++) {
              cuadrosEventos[i].classList.remove('selected');
            }

            if (!isAlreadySelected) {
              // Seteo el evento seleccionado
              setSelectedEventId(selectedEventId);
              cuadroEvento.classList.add('selected');
            } else {
              // Deseleccionar el evento
              setSelectedEventId(null);
            }
          });
          eventosContainer.appendChild(cuadroEvento);
        });
      })
      .catch((error) => {
        // Maneja los errores de la solicitud
        console.error(error);
      });
  }
    
  const formatDateTime = (dateTimeString) => {
    const dateTime = new Date(dateTimeString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return dateTime.toLocaleString('es-ES', options);
  };

  const handleRegistering = () => {

    // Verificar si se ha seleccionado un evento
    if (selectedEventId) {

      // Obtener la lista de calificaciones
      const calificacionData = spreadsheetManipulator.get().data.map((item) => {
        console.log(spreadsheetManipulator.get());
        return {
          studentDossier: item[firstColumn], // Utiliza el valor de 'Legajo' como studentDossier
          calification: item[lastColumn], // Utiliza el valor de 'Calificacion' como calification
        };
      });

      console.log(calificacionData);

      // Crear el objeto de datos a enviar al endpoint
      const data = {
        courseEventId: selectedEventId,
        califications: calificacionData
      };

      // Realizar la solicitud al endpoint para registrar la calificacion
      fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/add-califications-on-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al registrar la calificacion");
        }
        return response.json();
      })
      .then((result) => {
        // Realizar las operaciones necesarias con el resultado de la solicitud
        console.log(result);
      })
      .catch((error) => {
        // Manejar los errores de la solicitud
        console.error(error);
      });
    } else {
      // Mostrar un mensaje de error o realizar alguna acción en caso de no haber seleccionado un evento
      console.error("No se ha seleccionado un evento");
    }
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
        <div id="eventos-container"></div>
      </form>
      <table className="calification-table not-displayed">
      </table>
    </PageLayout>
  );
}