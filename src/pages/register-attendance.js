// Componentes externos.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Estilos.
import '../styles/register-attendance.css';

export function AttendanceRegistering() {

    // #region ==== Definición de parámetros. ====
    
    const [fileName, setFileName] = useState('');
    const [fileHandle, setFileHandle] = useState(null);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    const [sheetNameValue, setSheetNameValue] = useState('');
    const [cellRangeName, setCellRangeName] = useState('');

    const [registerButtonEnabled, setRegisterButtonEnabled] = useState(true);

    const [eventId, setEventId] = useState(0);
    const [eventDescription, setEventDescription] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    const [okStudentsList, setOkStudentsList] = useState([]);
    const [notOkStudentsList, setNotOkStudentsList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);

    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);

    const [error, setError] = useState(null);

    const { getAccessTokenSilently } = useAuth0();

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();
    
    // #endregion ==== Definición de parámetros. ====
    
    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    // Actualiza el mensaje de error que se mostrará al usuario.
    useEffect(() => { 

        // Obtiene el contenedor principal del mensaje de error.
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];

        if (error === null) {

            msgContainer.classList.add("not-displayed");

        } else {

            // Oculta las tablas.
            setOkStudentsList([]);
            setNotOkStudentsList([]);
            setInvalidRegistersList([]);

            // Obtiene el elemento HTML que contendrá el texto del mensaje.
            const errorMsgTextContainer = document.getElementsByClassName("info-msg-description")[0];

            // Guarda el mensaje.
            errorMsgTextContainer.innerHTML = error;

            // Muestra el mensaje.
            msgContainer.classList.remove("not-displayed");

        }

    }, [error]);

    // Actualiza el estado del botón de registración.
    useEffect(() => { 

        // Obtiene el manejador del botón de registración.
        const registerButton = document.getElementsByClassName("register-button")[0];

        // Habilita el botón de registración.
        if (registerButtonEnabled) {
            registerButton.disabled = false;
            registerButton.classList.remove("disabled");
        
        // Inhabilita el botón de registración.
        } else {
            registerButton.disabled = true;
            registerButton.classList.add("disabled");
        }

    }, [registerButtonEnabled]);
    
    // Obtiene la lista de eventos de la cursada.
    useEffect(() => { 

        // Evita que el primer render arroje una excepción porque course es null.
        if (!course) return;

        const getEventsList = async () => {

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
            .catch(error => {
                throw error;
            });

            // Obtiene los eventos.
            const eventsList = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-class-events`,
                {
                    params: {
                        'course-id': course.getId(),
                    },
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            );

            // Condición que se cumple cuando el resultado de la petición HTTP no fue
            // existoso.
            if (eventsList.status !== 200) {
            
                // Guarda el mensaje de error traído del back al usuario, y
                // en el próximo renderizado se mostrará el mensaje.
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

            // Condición que se cumple cuando la cursada no tiene eventos asociados.
            } else if (eventsList.data.eventList.length === 0) {

                // Redirige a la página de creación de eventos.
                history.push('/profile?no-events');

            } else {

                // Carga los eventos en la lista de selección.
                let eventsSelect = document.getElementById("events-select");
                while (eventsSelect.firstChild) {
                    eventsSelect.removeChild(eventsSelect.firstChild);
                }
                const listFirstElement = document.createElement("option");
                listFirstElement.innerHTML = "SELECCIONAR EVENTO";
                listFirstElement.value = 0;
                eventsSelect.appendChild(listFirstElement);
                eventsList.data.eventList.forEach(eventElement => {

                    const listElement = document.createElement("option");

                    // Contruye el string que contendrá el nombre del evento, solamente si se ingresó un nombre
                    // al momento de dar de alta el evento.
                    let nameString = '';
                    if (eventElement.name !== null)
                        nameString = `"${eventElement.name}" `;

                    // Construye el string que contendrá el rango de fechas, solamente si ambas fechas
                    // fueron ingresadas en la carga del evento; o será una cadena vacía, si alguna
                    // de las fechas no fue ingresada.
                    let dateTimeString = "";
                    if (eventElement.initialDateTime !== null && eventElement.endDateTime !== null) {
                        const initialDate =
                            Intl.DateTimeFormat(
                                'es-AR',
                                {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                }
                            ).format(new Date(eventElement.initialDateTime));
                        const initialTime = 
                            Intl.DateTimeFormat(
                                'es-AR',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }
                            ).format(new Date(eventElement.initialDateTime));
                        const endDate =
                            Intl.DateTimeFormat(
                                'es-AR',
                                {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                }
                            ).format(new Date(eventElement.endDateTime));
                        const endTime = 
                            Intl.DateTimeFormat(
                                'es-AR',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }
                            ).format(new Date(eventElement.endDateTime));
                        dateTimeString =
                            initialDate.valueOf() === endDate.valueOf()
                            ? `: ${initialDate} de ${initialTime} a ${endTime}`
                            : `: ${initialDate} ${initialTime} - ${endDate} ${endTime}`;
                    }
                    
                    let mandatoryString;
                    if (eventElement.mandatory) mandatoryString = 'Asistencia obligatoria'
                    else mandatoryString = 'Asistencia no obligatoria';

                    const eventDescription = 
                            `${eventElement.type} ${nameString}(${mandatoryString})${dateTimeString}`;

                    listElement.innerHTML = eventDescription;
                    listElement.value = eventElement.eventId;
                    eventsSelect.appendChild(listElement);
                });

            }

        }
        getEventsList()
        .catch(error => error.response);

    }, [course]);

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
                        "attendance:Asistencia",
                        "formatInfo:Error de formato",
                    ],
                    columnClasses: [
                        "attendance:centered",
                    ],
                },
                `Registros con formato inválido (${invalidRegistersList.length})`
            );
            notValidFormatTable.classList.remove("not-displayed");
        } else notValidFormatTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que no están aptos para ser registrados.
        let notOkStudentsTable = document.getElementsByClassName(
            "not-ok-students-table"
        )[0];
        if (notOkStudentsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notOkStudentsTable,
                {
                    tableRows: notOkStudentsList,
                    columnNames: [
                        "dossier:Legajo",
                        "errorDescription:Descripción del error",
                    ],
                },
                `Legajos que no se pueden registrar (${notOkStudentsList.length})`
            );
            notOkStudentsTable.classList.remove("not-displayed");
        } else notOkStudentsTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que están aptos para ser registrados.
        let okStudentsTableContainer = document.getElementsByClassName(
            "ok-students-table-container"
        )[0];
        let okStudentsTable = document.getElementsByClassName(
            "ok-students-table"
        )[0];
        if (okStudentsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    tableRows: okStudentsList,
                    columnNames: [
                        "state:Estado",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "attendance:Asistencia",
                    ],
                    columnClasses: [
                        "state:wrapped",
                        "attendance:centered",
                    ],
                },
                `Estudiantes para registrar asistencia (${okStudentsList.length}) - ${selectedEvent.eventDescription}`
            );
            okStudentsTableContainer.classList.remove("not-displayed");
        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okStudentsList, notOkStudentsList, invalidRegistersList, tableManualUpdateTrigger]);

    // Inicializa el objeto que manipula las planillas.
    useState(() => { 

        setSpreadsheetManipulator(new SpreadsheetManipulator());
        
    }, []);

    /**
     * Carga el rango en memoria y lo muestra en pantalla.
     */
    const finishedLoading = spreadsheetManipulator => { 

        // Lee un rango de celdas.
        spreadsheetManipulator.loadRangeSides(sheetNameValue, cellRangeName, ["Legajo", "Asistencia"]);

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
     * Carga los nombres de pestaña para que sean seleccionados.
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
        setOkStudentsList([]);
        setNotOkStudentsList([]);
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
     * Manejador del evento que se genera cuando se selecciona
     * un valor en el select de eventos.
     */
    const handleEventSelection = event => { 

        setEventId(Number(event.target.value));
        setEventDescription(event.target.selectedOptions[0].label);

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

        // Habilita el botón de registración.
        setRegisterButtonEnabled(true);

        // Notifica al usuario si no se seleccionó el nombre de la pestaña
        // de la planilla.
        if (sheetNameValue === "") {

            setError("Debe seleccionar un nombre de pestaña.");

        // Notifica al usuario si el rango no fue ingresado.
        } else if (cellRangeName === "") {

            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");

        // Notifica al usuario si el rango fue ingresado con un mal formato.
        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {

            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido; debe ser '&lt;letras&gt;&lt;números&gt;:&lt;letras&gt;&lt;números&gt;'.");

        // Notifica al usuario si no se seleccionó un evento.
        } else if (eventId === 0) {

            setError("El campo 'Evento' no contiene un evento seleccionado.");

        } else {

            // Limpia el eventual mensaje de error que se encuentre en pantalla
            // (HU002.007.001/CU01.2).
            setError(null);

            // Lee un rango de celdas.
            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, [
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
                }

                // Separa los registros con formato válido de los que tienen formato inválido.
                if (invalidFormat) {
                    invalidFormatRange.push(row);
                } else {
                    validFormatRange.push(row);
                }

            });

            // Guarda los registros con formato correcto en un arreglo.
            /** @type {Array.<number>} */ const validDossiersArray = validFormatRange.map(
                element => element["dossier"]
            );

            // Guarda el ID y la descripción del evento seleccionado, para ser mostrado
            // luego en la tabla de asistencias a registrar.
            setSelectedEvent({
                eventId: eventId,
                eventDescription: eventDescription,
            });

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

            // Envía el ID del evento junto a la lista de legajos para ser verificados.
            const studentsCheckedInfo = await axios
                .post(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/check-dossiers-in-event`,
                    {
                        eventId: eventId,
                        dossiersList: validDossiersArray,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                )
                .then(okReponse => okReponse)
                .catch(error => error.response);

            if (studentsCheckedInfo.status !== 200) {
                
                // Guarda el mensaje de error traído del back al usuario, y
                // en el próximo renderizado se mostrará el mensaje.
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

            } else {

                // Permite que, cuando se renueve el ciclo de React, se muestren
                // los registros con formato inválido.
                setInvalidRegistersList(
                    invalidFormatRange
                );

                // Permite que, cuando se renueve el ciclo de React, se muestren
                // los registros con formato válido que, además, pasaron el control
                // en el backend.
                setOkStudentsList(
                    studentsCheckedInfo.data.ok.map(
                        student => {

                            // Obtiene el registro de readRange que tiene mismo legajo.
                            let studentLoadedData = readRange.data.find(
                                register => register.dossier == student.dossier
                            );

                            // Une la información traída del back con la que se cargó del Excel.
                            let studentInfo = {};
                            studentInfo.dossier = student.dossier;
                            studentInfo.id = student.id;
                            studentInfo.name = student.name;
                            studentInfo.attendance =
                                String(studentLoadedData.attendance).trim() !== ''
                                ? 'x'
                                : '';
                            studentInfo._row = studentLoadedData._row;

                            // Agrega el estado de registración en sistema.
                            studentInfo.state = 'Pendiente';

                            return studentInfo;

                        }
                    )
                );

                // Luego del ciclo React, muestra los registros que no pasaron
                // el control en el backend.
                if(studentsCheckedInfo.data.nok !== undefined) {
                    setNotOkStudentsList(
                        studentsCheckedInfo.data.nok.map(
                            dossierInfo => {

                                // Obtiene el registro de readRange que tiene mismo legajo.
                                let studentLoadedData = readRange.data.find(
                                    register => register.dossier == dossierInfo.dossier
                                );

                                // Indica el objeto que va a formar parte del arreglo. 
                                return {
                                    _row: studentLoadedData._row,
                                    dossier: dossierInfo.dossier,
                                    errorDescription: dossierInfo.errorDescription,
                                };

                            }
                        )
                    )
                }

            }

        }

    }

    /**
     * Manejador del evento clic en el botón de registración
     * masiva de asistencia de alumnos.
     */
    const handleRegistering = async () => { 

        // Inhabilita el botón de registración.
        setRegisterButtonEnabled(false);

        // Prepara la lista de estudiantes para ser enviada.
        const attendanceRegistrationInfo = okStudentsList
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
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-attendance`,
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

        // Si el código HTML no fue OK...
        if (response.status !== 200) {
            
            // Guarda el mensaje de error traído del back al usuario y,
            // en el próximo renderizado, se mostrará el mensaje.
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

        // Si el código HTML fue OK...
        } else {

            // Actualiza la información de los estudiantes que se registraron correctamente.
            response.data.ok.forEach(registeredStudentDossier => {
                let registeredStudent = okStudentsList
                    .find(student => student.dossier === registeredStudentDossier);
                registeredStudent.state = "Registrado";
            });

            // Actualiza la información de los estudiantes que no se registraron correctamente.
            if (response.data.nok !== undefined) {
                response.data.nok.forEach(notRegisteredStudentInfo => {
                    let notRegisteredStudent = okStudentsList
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

    const handleTemplateDownload = () => { 
        spreadsheetManipulator.create(
            "Plantilla de carga de asistencia",
            "registro-asistencias",
            [
                ["Legajo", "Asistencia"],
                [166364, "x"]
            ]
        );
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
                <div className="label_button download-button">
                    <label htmlFor="download-button">
                        Descargar plantilla
                    </label>
                </div>
                <input
                    type="button"
                    id="download-button"
                    onClick={handleTemplateDownload}
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
                <p>Rango de celdas a cargar (excluir encabezados)</p>
                <input
                    type="text"
                    id="cell-range"
                    placeholder="Ejemplo para cargar los primeros dos registros: A2:B3"
                    onChange={handleCellRangeName}
                    required
                />
                <label htmlFor="events-select"><p>Evento</p></label>
                <select
                    id="events-select"
                    onChange={handleEventSelection}
                    required
                >
                </select>
                <div id="eventos-container"></div>

                <button type="submit" className="load-button" onClick={handleRangeLoading}>
                    Cargar registros
                </button>
            </form>

            <div>
                <table className="not-valid-format-table table-container not-displayed"></table>
            </div>
            <div>
                <table className="not-ok-students-table table-container not-displayed"></table>
            </div>
            <div className="ok-students-table-container table-container not-displayed">
                <table className="ok-students-table"></table>
                <button
                    type="button"
                    className="register-button"
                    onClick={handleRegistering}
                >
                    Registrar asistencia
                </button>
            </div>

        </PageLayout>
    );

}
