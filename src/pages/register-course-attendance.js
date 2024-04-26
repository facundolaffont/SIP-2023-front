// Imports de componentes externos.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';

// Imports de componentes internos.
import { PageLayout } from "../components/page-layout";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Imports de estilos.
import '../styles/register-attendance.css';

export function CourseAttendanceRegistering() {

    const [fileName, setFileName] = useState('');
    const [fileHandle, setFileHandle] = useState(null);
    const [sheetNameValue, setSheetNameValue] = useState('');
    const [cellRangeName, setCellRangeName] = useState('');
    const [eventId, setEventId] = useState(0);
    const [eventDescription, setEventDescription] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    const [okList, setOkList] = useState([]);
    const [notOkList, setNotOkList] = useState([]);
    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);
    const [error, setError] = useState(null);
    const { getAccessTokenSilently } = useAuth0();
    const [, changeCourse] = useSelectedCourse(true);
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

    const history = useHistory();

    // Obtiene la lista de eventos de la cursada.
    useEffect(async () => {

        // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
        // o si se actualiza la página, ya que se pierde el contexto de la selección que
        // se había hecho.
        if (course === null) history.push('/profile?course-missing');

    }, []);

    // Actualiza el mensaje de error que se mostrará al usuario.
    useEffect(() => {

        // Obtiene el contenedor principal del mensaje de error.
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];

        if (error === null) {

            msgContainer.classList.add("not-displayed");

        } else {

            // Oculta las tablas.
            setOkList([]);
            setNotOkList([]);
            setInvalidRegistersList([]);

            // Obtiene el elemento HTML que contendrá el texto del mensaje.
            const errorMsgTextContainer = document.getElementsByClassName("info-msg-description")[0];

            // Guarda el mensaje.
            errorMsgTextContainer.innerHTML = error;

            // Muestra el mensaje.
            msgContainer.classList.remove("not-displayed");

        }

    }, [error]);

    // Actualiza las tablas.
    useEffect(() => {

        // Actualiza la tabla de registros con formato incorrecto.
        let notValidFormatTable = document.getElementsByClassName(
            "not-valid-format-table"
        )[0];
        if (invalidRegistersList.length !== 0) {

            HTMLTableManipulator.insertDataIntoTable(
                notValidFormatTable,
                {
                    tableRows: invalidRegistersList,
                    columnNames: [
                        "_row:Fila",
                        "dossier:Legajo",
                        "formatInfo:Error de formato",
                    ],
                },
                `Filas con formato inválido (${invalidRegistersList.length})`
            );
            notValidFormatTable.classList.remove("not-displayed");
        } else notValidFormatTable.classList.add("not-displayed");

        // Actualiza la tabla de registros que no se pueden guardar.
        let notOkTable = document.getElementsByClassName(
            "not-ok-table"
        )[0];
        if (notOkList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notOkTable,
                {
                    tableRows: notOkList,
                    columnNames: [
                        "_row:Fila",
                        "errorDescription:Descripción del error",
                    ],
                },
                `Filas que no se pueden registrar (${notOkList.length})`
            );
            notOkTable.classList.remove("not-displayed");
        } else notOkTable.classList.add("not-displayed");

        /*// Actualiza la tabla de registros que pueden guardarse.
        let okTableContainer = document.getElementsByClassName(
            "ok-table-container"
        )[0];
        let okTable = document.getElementsByClassName(
            "ok-table"
        )[0];
        if (okList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                okTable,
                {
                    tableRows: okList,
                    columnNames: [
                        "state:Estado",
                        "eventId:ID de evento",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "surname:Apellido",
                        "attendance:Asistencia",
                    ],
                    columnClasses: [
                        "state:wrapped",
                        "attendance:centered",
                    ],
                },
                `Asistencias para registrar (${okList.length}) - ${selectedEvent.eventDescription}`
            );
            okTableContainer.classList.remove("not-displayed");
        } else okTableContainer.classList.add("not-displayed");*/

    }, [okList, /*notOkList,*/ invalidRegistersList, tableManualUpdateTrigger]);

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    /**
     * Carga el rango en memoria y lo muestra en pantalla.
     */
    const finishedLoading = spreadsheetManipulator => {

        // Lee un rango de celdas.
        spreadsheetManipulator.loadRangeSides(sheetNameValue, cellRangeName, ["ID de evento", "Legajo", "Asistencia"]);

        // Muestra los resultados en la tabla.
        let calificationsTable = document.getElementsByClassName("attendance-table")[0];
        spreadsheetManipulator.insertDataIntoTable(calificationsTable, "Tabla de asistencias");
        calificationsTable.classList.remove("not-displayed");
        setSpreadsheetManipulator(spreadsheetManipulator);

    }

    const formatDateTime = dateTimeString => {

        const dateTime = new Date(dateTimeString);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        return dateTime.toLocaleString('es-ES', options);

    }

    /**
     * Carga el archivo de planilla en memoria y al finalizar llama
     * a la función que carga el rango en memoria y lo muestra en pantalla.
     */
    const loadFile = event => {

        // Evita que se ejecute la llamada del submit.
        event.preventDefault();

        // Carga el archivo Excel y establece la función callback que se llamará al
        // finalizar la carga.
        let spreadsheetManipulator = new SpreadsheetManipulator();
        spreadsheetManipulator.loadFile(fileHandle, finishedLoading);

    }

    /**
     * Carga los nombres de pestaña para que sean seleccionados
     * (HU002.007.001/CU01.1b).
     */
    const loadSheetNames = () => {
        
        // Obtiene la lista de nombres.
        let sheetNamesList = spreadsheetManipulator.getSheetNamesList();

        // Carga las pestañas en la lista de selección.
        let sheetNamesSelect = document.getElementById("sheet-names");
        while (sheetNamesSelect.firstChild) {
            sheetNamesSelect.removeChild(sheetNamesSelect.firstChild);
        }
        const listFirstElement = document.createElement("option");
        listFirstElement.innerHTML = "SELECCIONAR PESTAÑA";
        sheetNamesSelect.appendChild(listFirstElement);
        sheetNamesList.forEach(sheetName => {
            const listElement = document.createElement("option");
            listElement.innerHTML = sheetName;
            sheetNamesSelect.appendChild(listElement);
        });

    }

    /**
     * Manejador del evento que surge cuando se carga un
     * nuevo archivo con el explorador de archivos.
     *
     * @param {Event} event Evento de cambio de la etiqueta input.
     */
    const handleFileSelection = event => {

        // Obtiene y almacena el nombre del archivo.
        const file = event.target.files[0];
        setFileName(file.name);
        setFileHandle(file);
        
        // Limpia la pantalla.
        setError(null);
        setOkList([]);
        setNotOkList([]);
        setInvalidRegistersList([]);

        // Carga el archivo Excel.
        spreadsheetManipulator.loadFile(file, loadSheetNames);

        // Permite que se vuelva a cargar el mismo archivo.
        const inputElement = document.getElementById("file");
        inputElement.value = '';

    }

    /**
     * Manejador del evento que se genera cuando se cambia
     * el valor del campo de rango de celdas.
     */
    const handleCellRangeName = event => {

        setCellRangeName(event.target.value);

    }

    /**
     * Manejador del evento clic en el botón de carga de archivo a memoria.
     *
     * Carga el archivo de la planilla a memoria y llama a la función que
     * cargará, también a memoria, un rango específico de la planilla.
     *
     * @param {Event} event Evento de clic.
     */
    const handleRangeLoading = async event => {

        // Evita que se ejecute la llamada del submit.
        event.preventDefault();

        // Notifica al usuario si el rango no fue ingresado.
        if (cellRangeName === "") {

            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");

        // Notifica al usuario si el rango fue ingresado con un mal formato.
        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {

            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido; debe ser '&lt;letras&gt;&lt;números&gt;:&lt;letras&gt;&lt;números&gt;'.");

        } else {

            // Limpia el eventual mensaje de error que se encuentre en pantalla.
            setError(null);

            // Lee un rango de celdas.
            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, [
                "eventId",
                "dossier",
                "attendance",
            ]);

            // Obtiene el rango seleccionado del Excel.
            let readRange = spreadsheetManipulator.getLastReadRange();

            // Separa los registros con formato incorrecto.
            let validFormatRange = [];
            let invalidFormatRange = [];
            readRange.data.forEach(row => {

                // Determina si el formato es inválido y añade una descripción del problema.
                let invalidFormat = false;
                if (
                    isNaN(row.dossier)
                    ||
                    row.dossier <= 0
                ) {
                    row.formatInfo = "El legajo no es un entero positivo.";
                    invalidFormat = true;
                } else if (!(
                    row.attendance.trim() === ''
                    ||
                    row.attendance.toLowerCase() === 'x'
                )) {
                    row.formatInfo = "El campo de asistencia debe estar vacío o debe contener el valor 'x'.";
                    invalidFormat = true;
                }

                // Separa los registros con formato válido de los que tienen formato inválido.
                if (invalidFormat) {
                    invalidFormatRange.push(row);
                } else {
                    validFormatRange.push(row);
                }

            });

            setInvalidRegistersList(
                invalidFormatRange
            );

        }

    }

    /**
     * Manejador del evento clic en el botón de registración
     * masiva de asistencia de alumnos.
     */
    const handleRegistering = async () => {

        // Prepara la lista de estudiantes para ser enviada.
        const attendanceRegistrationInfo = okList
            .map(studentInfo => {
                return {
                    dossier: studentInfo.dossier,
                    attendance:
                        studentInfo.attendance == 'x'
                        ? true
                        : false
                    ,
                }
            });

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // Realiza la solicitud al endpoint para registrar la calificación.
        const response = await axios
            .post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-course-attendance`,
                {
                    eventId: selectedEvent.eventId,
                    attendanceList: attendanceRegistrationInfo,
                },
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .then(response => response)
            .catch(error => error);

        if (response.status !== 200) {
            
            // Guarda el mensaje de error traído del back al usuario y,
            // en el próximo renderizado, se mostrará el mensaje.
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

        } else {
            
            // El front inserta un símbolo en la primera columna de cada registro para indicar
            // que se registró en el sistema. [usar okList y notOkList]

            // Actualiza la información de los estudiantes que se registraron correctamente.
            response.data.ok.forEach(registeredStudentDossier => {
                let registeredStudent = okList
                    .find(student => student.dossier === registeredStudentDossier);
                registeredStudent.state = "Registrado";
            });

            // Actualiza la información de los estudiantes que no se registraron correctamente.
            if (response.data.nok !== undefined) {
                response.data.nok.forEach(notRegisteredStudentInfo => {
                    let notRegisteredStudent = okList
                        .find(student => student.dossier === notRegisteredStudentInfo.dossier);
                    switch(notRegisteredStudentInfo.errorCode) {
                        case 1: notRegisteredStudent.state = "No registrado: el legajo no existe en sistema.";
                            break;
                        case 2: notRegisteredStudent.state = "No registrado: el legajo ya estaba registrado.";
                            break;
                    };
                });
            }

            // Actualiza la información de la tabla.
            setTableManualUpdateTrigger(!tableManualUpdateTrigger);

        }

    }

    /**
     * Manejador del evento de cambio del campo de selección
     * de nombre de pestaña.
     */
    const handleSheetNameValueChange = event => {

        if(event.target.value !== "SELECCIONAR PESTAÑA") 
            setSheetNameValue(event.target.value);
        else setSheetNameValue("");

    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Registrar asistencias</h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            <div className="info-msg-container not-displayed">
                <div className="info-msg-desc-container">
                    <p className="info-msg-description"></p>
                </div>
            </div>
            <form onSubmit={loadFile}>
                <p>Seleccionar archivo de asistencias</p>
                <div className="label_button">
                    <label htmlFor="file">
                        Cargar archivo
                    </label>
                </div>
                <input
                    type="file"
                    id="file"
                    onChange={handleFileSelection}
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    required
                    hidden
                />
                <p>{fileName}</p>
                <p>Nombre de la pestaña en la planilla</p>
                <select
                    id="sheet-names"
                    onChange={handleSheetNameValueChange}
                    required
                >
                </select>
                <label htmlFor="cell-range"><p>Rango de celdas a cargar</p></label>
                <input
                    type="text"
                    id="cell-range"
                    onChange={handleCellRangeName}
                    required
                />
                <div id="eventos-container"></div>

                <button type="submit" className="load-button" onClick={handleRangeLoading}>
                    Cargar registros
                </button>
            </form>

            <div>
                <table className="not-valid-format-table table-container not-displayed"></table>
            </div>
            <div>
                <table className="not-ok-table table-container not-displayed"></table>
            </div>
            {/*<div className="ok-table-container table-container not-displayed">
                <table className="ok-table"></table>
                <button
                    type="button"
                    className="register-attendance-button"
                    onClick={handleRegistering}
                >
                    Registrar asistencia
                </button>
            </div>*/}

        </PageLayout>
    );

}
