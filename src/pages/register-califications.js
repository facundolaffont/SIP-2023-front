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
import { useSpreadsheetContext } from "../contexts/spreadsheet/spreadsheet-provider.js";
import { DragAndDropFile } from "../components/drag-and-drop-file.js";

// Imports de estilos.
import '../styles/register-califications.css';

export function CalificationRegistering() {

    const [fileName, setFileName] = useState('');
    const [fileHandle, setFileHandle] = useState(null);

    const [sheetNameValue, setSheetNameValue] = useState('');
    const [cellRangeName, setCellRangeName] = useState('');

    const [registerButtonEnabled, setRegisterButtonEnabled] = useState(true);

    const [eventId, setEventId] = useState(0);
    const [eventDescription, setEventDescription] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [okStudentsList, setOkStudentsList] = useState([]);
    const [notOkStudentsList, setNotOkStudentsList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);
    const [duplicatedStudentsList, setDuplicatedStudentsList] = useState([]);
    const [allOverwritesChecked, setAllOverwritesChecked] = useState(false);

    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);

    const [error, setError] = useState(null);
    // Estado del envío de email: 'idle' | 'sending' | 'sent' | 'error'
    const [emailSendState, setEmailSendState] = useState('idle');

    const { getAccessTokenSilently } = useAuth0();

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();
    const { getSpreadsheetData, saveSpreadsheetData, clearSpreadsheetData } = useSpreadsheetContext();

    // Restaura el estado desde el contexto
    useEffect(() => {
        const savedData = getSpreadsheetData('califications');
        if (savedData) {
            setFileName(savedData.fileName);
            setSheetNameValue(savedData.sheetNameValue || "");
            setCellRangeName(savedData.cellRangeName || "");
            setSpreadsheetManipulator(savedData.manipulator);
            
            // Re-poblar inputs luego de que el DOM esté listo
            setTimeout(() => {
                const sheetNamesList = savedData.manipulator.getSheetNamesList();
                let sheetNamesSelect = document.getElementById("sheet-names");
                if (sheetNamesSelect) {
                    while (sheetNamesSelect.firstChild) sheetNamesSelect.removeChild(sheetNamesSelect.firstChild);
                    const listFirstElement = document.createElement("option");
                    listFirstElement.innerHTML = "SELECCIONAR PESTAÑA";
                    sheetNamesSelect.appendChild(listFirstElement);
                    sheetNamesList.forEach(sheetName => {
                        const listElement = document.createElement("option");
                        listElement.innerHTML = sheetName;
                        sheetNamesSelect.appendChild(listElement);
                    });
                    if (savedData.sheetNameValue) {
                        sheetNamesSelect.value = savedData.sheetNameValue;
                    }
                }
                const cellRangeInput = document.getElementById("cell-range");
                if (cellRangeInput && savedData.cellRangeName) {
                    cellRangeInput.value = savedData.cellRangeName;
                }
            }, 100);
        }
    }, []);

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);



    // Obtiene la lista de eventos de evaluación de la cursada.
    useEffect(() => {

        // Evita que el primer render arroje una excepción porque course es null.
        if (!course) return;

        const getEventsList = async () => {

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

            // Obtiene los eventos de evaluación de la cursada.
            const eventsList = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-evaluation-events`,
                {
                    params: {
                        'course-id': course.getId(),
                    },
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
                .then(okReponse => okReponse)
                .catch(error => error.response);

            if (eventsList.status !== 200) {

                // Guarda el mensaje de error traído del back al usuario, y
                // en el próximo renderizado se mostrará el mensaje.
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

            } else if (eventsList.data.eventList.length === 0) {

                // Redirige a la página de selección de eventos, si la cursada no tiene eventos
                // asociados.
                history.push('/profile?no-events');

            } else {

                // Carga los eventos de evaluación en la lista de selección.
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
                        nameString = ` "${eventElement.name}"`;

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

                    const eventDescription =
                        `${eventElement.type}${nameString}${dateTimeString}`;

                    listElement.innerHTML = eventDescription;
                    listElement.value = eventElement.eventId;
                    eventsSelect.appendChild(listElement);

                });

            }

        }
        getEventsList();

    }, [course]);

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
            setDuplicatedStudentsList([]);
            setAllOverwritesChecked(false);

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

            // Inserta los datos en la tabla.
            HTMLTableManipulator.insertDataIntoTable(
                notValidFormatTable,
                {
                    tableRows: invalidRegistersList,
                    columnNames: [
                        "_row:Fila",
                        "formatInfo:Error de formato",
                    ],
                    columnClasses: [
                        "calification:centered",
                    ],
                },
                `Registros con formato inválido (${invalidRegistersList.length})`
            );

            // Muestra la tabla.
            notValidFormatTable.classList.remove("not-displayed");

        } else notValidFormatTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que no están aptos para ser registrados.
        let notOkStudentsTable = document.getElementsByClassName(
            "not-ok-students-table"
        )[0];
        if (notOkStudentsList.length !== 0) {

            // Inserta los datos en la tabla.
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

            // Muestra la tabla.
            notOkStudentsTable.classList.remove("not-displayed");

        } else notOkStudentsTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que están aptos para que su calificación
        // sea registrada.
        let okStudentsTableContainer = document.getElementsByClassName(
            "ok-students-table-container"
        )[0];
        if (okStudentsList.length !== 0) {

            // Obtiene el manejador de la tabla.
            let okStudentsTable = document.getElementsByClassName(
                "ok-students-table"
            )[0];

            // Inserta los datos en la tabla.
            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    tableRows: okStudentsList,
                    columnNames: [
                        "state:Estado",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "calification:Calificación",
                    ],
                    columnClasses: [
                        "state:wrapped",
                        "calification:centered",
                    ],
                },
                `Estudiantes para registrar calificación (${okStudentsList.length}) - ${selectedEvent.eventDescription}`
            );

            // Muestra la tabla.
            okStudentsTableContainer.classList.remove("not-displayed");

        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okStudentsList, notOkStudentsList, invalidRegistersList, tableManualUpdateTrigger]);

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        const savedData = getSpreadsheetData('califications');
        if (!savedData) {
            setSpreadsheetManipulator(new SpreadsheetManipulator());
        }
    }, []);

    /**
     * Carga el rango en memoria y lo muestra en pantalla.
     */
    const finishedLoading = spreadsheetManipulator => {

        // Lee un rango de celdas.
        spreadsheetManipulator.loadRangeSides(sheetNameValue, cellRangeName, ["Legajo", "Calificación"]);

        // Muestra los resultados en la tabla.
        let calificationsTable = document.getElementsByClassName("calification-table")[0];
        spreadsheetManipulator.insertDataIntoTable(calificationsTable, "Tabla de calificaciones");
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
        let sheetNamesList = spreadsheetManipulator.getSheetNamesList();
        let sheetNamesSelect = document.getElementById("sheet-names");
        if (sheetNamesSelect) {
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

        // Auto-selección y sugerencia de rango si hay una sola hoja
        if (sheetNamesList.length === 1) {
            const singleSheet = sheetNamesList[0];
            setSheetNameValue(singleSheet);
            if (sheetNamesSelect) sheetNamesSelect.value = singleSheet;
            
            const suggestedRange = spreadsheetManipulator.getSuggestedRange(singleSheet);
            if (suggestedRange) {
                setCellRangeName(suggestedRange);
                const cellRangeInput = document.getElementById("cell-range");
                if (cellRangeInput) cellRangeInput.value = suggestedRange;
                saveSpreadsheetData('califications', { sheetNameValue: singleSheet, cellRangeName: suggestedRange });
            } else {
                saveSpreadsheetData('califications', { sheetNameValue: singleSheet });
            }
        }
    }

    /**
     * Manejador del evento que surge cuando se carga un
     * nuevo archivo con el explorador de archivos.
     *
     * @param {Event} event Evento de cambio de la etiqueta input.
     */
    const handleFileSelection = file => {
        setFileName(file.name);
        setFileHandle(file);

        setError(null);
        setOkStudentsList([]);
        setNotOkStudentsList([]);
        setInvalidRegistersList([]);
        setDuplicatedStudentsList([]);
        setAllOverwritesChecked(false);

        spreadsheetManipulator.loadFile(file, () => {
            loadSheetNames();
            saveSpreadsheetData('califications', {
                fileName: file.name,
                manipulator: spreadsheetManipulator
            });
        });
    }

    const handleFileRemove = () => {
        setFileName("");
        setFileHandle(null);
        setSheetNameValue("");
        setCellRangeName("");
        setError(null);
        setOkStudentsList([]);
        setNotOkStudentsList([]);
        setInvalidRegistersList([]);
        setDuplicatedStudentsList([]);
        setAllOverwritesChecked(false);
        setSpreadsheetManipulator(new SpreadsheetManipulator());
        clearSpreadsheetData('califications');
        
        let sheetNamesSelect = document.getElementById("sheet-names");
        if (sheetNamesSelect) {
            while (sheetNamesSelect.firstChild) {
                sheetNamesSelect.removeChild(sheetNamesSelect.firstChild);
            }
        }
        let cellRangeInput = document.getElementById("cell-range");
        if (cellRangeInput) {
            cellRangeInput.value = "";
        }
    };

    /**
     * Manejador del evento que se genera cuando se cambia
     * el valor del campo de rango de celdas.
     */
    const handleCellRangeName = event => {
        const val = event.target.value.toUpperCase();
        setCellRangeName(val);
        saveSpreadsheetData('califications', { cellRangeName: val });
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

            // Limpia el eventual mensaje de error que se encuentre en pantalla.
            setError(null);

            // Lee un rango de celdas.
            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, [
                "dossier",
                "calification",
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
                } else {
                    var regex = new RegExp("^(A-?|D|[0-9]((\\.|,)\\d+)?|10|)$");
                    if (!regex.test(String(row.calification).trim().toUpperCase())) {
                        row.formatInfo = "El campo de calificación debe contener un valor de 0 a 10, ó D, A o A-";
                        invalidFormat = true;
                    }
                }

                // Acomoda los datos para ser registrados.
                row.calification = String(row.calification).trim().toUpperCase();
                if (String(row.calification) == '') row.calification = 'AUSENTE';

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
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/check-califications-dossiers-in-event`,
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

                setInvalidRegistersList(
                    invalidFormatRange
                );

                // 4
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
                            studentInfo.calification = String(studentLoadedData.calification).replace(',', '.');
                            studentInfo._row = studentLoadedData._row;

                            // Agrega el estado de registración en sistema.
                            studentInfo.state = 'Pendiente';

                            return studentInfo;

                        }
                    )
                );

                if (studentsCheckedInfo.data.nok !== undefined) {
                    let nokList = [];
                    let duplicatedList = [];
                    studentsCheckedInfo.data.nok.forEach(dossierInfo => {
                        // Obtiene el registro de readRange que tiene mismo legajo.
                        let studentLoadedData = readRange.data.find(
                            register => register.dossier == dossierInfo.dossier
                        );

                        if (dossierInfo.errorCode === 3) {
                            duplicatedList.push({
                                _row: studentLoadedData._row,
                                dossier: dossierInfo.dossier,
                                oldCalification: dossierInfo.oldCalification,
                                newCalification: String(studentLoadedData.calification).replace(',', '.'),
                                overwrite: false,
                                state: "Pendiente"
                            });
                        } else {
                            nokList.push({
                                _row: studentLoadedData._row,
                                dossier: dossierInfo.dossier,
                                errorDescription: dossierInfo.errorDescription,
                            });
                        }
                    });
                    setNotOkStudentsList(nokList);
                    setDuplicatedStudentsList(duplicatedList);
                    setAllOverwritesChecked(false);
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
        const calificationRegistrationInfo = [
            ...okStudentsList,
            ...duplicatedStudentsList.filter(student => student.overwrite)
        ].map(studentInfo => {
            return {
                dossier: studentInfo.dossier,
                calification: String(studentInfo.calification || studentInfo.newCalification).replace(',', '.')
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
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-califications`,
                {
                    eventId: selectedEvent.eventId,
                    calificationList: calificationRegistrationInfo,
                },
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .then(response => response)
            .catch(error => error);

        // Si la respuesta del backend no fue satisfactoria...
        if (response.status !== 200) {

            // Guarda el mensaje de error traído del back al usuario y,
            // en el próximo renderizado, se mostrará el mensaje.
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

            // Si la respuesta del backend fue satisfactoria...
        } else {

            // El front inserta un símbolo en la primera columna de cada registro para indicar
            // que se registró en el sistema. [usar okStudentsList y notOkStudentsList]

            // Actualiza la información de los estudiantes que se registraron correctamente.
            let updatedDuplicated = [...duplicatedStudentsList];
            response.data.ok.forEach(registeredStudentDossier => {
                let registeredStudent = okStudentsList
                    .find(student => student.dossier === registeredStudentDossier);
                if (registeredStudent) {
                    registeredStudent.state = "Registrado";
                }

                let duplicatedStudent = updatedDuplicated
                    .find(student => student.dossier === registeredStudentDossier);
                if (duplicatedStudent && duplicatedStudent.overwrite) {
                    duplicatedStudent.state = `Sobrescrito (Anterior: ${duplicatedStudent.oldCalification} -> Actual: ${duplicatedStudent.newCalification})`;
                }
            });
            setDuplicatedStudentsList(updatedDuplicated);

            // Actualiza la información de los estudiantes que no se registraron correctamente.
            if (response.data.nok !== undefined) {
                response.data.nok.forEach(notRegisteredStudentInfo => {
                    let notRegisteredStudent = okStudentsList
                        .find(student => student.dossier === notRegisteredStudentInfo.dossier);
                    switch (notRegisteredStudentInfo.errorCode) {
                        case 1: notRegisteredStudent.state = "No registrado: el legajo no existe en sistema.";
                            break;
                        case 2: notRegisteredStudent.state = "No registrado: calificación ya registrada.";
                            break;
                    };
                });
            }

            // Actualiza la información de la tabla.
            setTableManualUpdateTrigger(!tableManualUpdateTrigger);

        }

    }

    /**
     * Envía las calificaciones por email para el evento seleccionado.
     */
    const handleSendEmail = async () => {
        if (!selectedEvent) return;
        setEmailSendState('sending');
        try {
            const auth0Token = await getAccessTokenSilently();
            await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/send-grades-email`,
                null,
                {
                    params: { 'event-id': selectedEvent.eventId },
                    headers: { Authorization: `Bearer ${auth0Token}` },
                }
            );
            setEmailSendState('sent');
        } catch (err) {
            setEmailSendState('error');
        }
    };

    const handleToggleAllOverwrites = (e) => {
        const isChecked = e.target.checked;
        setAllOverwritesChecked(isChecked);
        setDuplicatedStudentsList(duplicatedStudentsList.map(s => ({ ...s, overwrite: isChecked })));
    };

    const handleToggleOverwrite = (dossier) => {
        const newList = duplicatedStudentsList.map(s =>
            s.dossier === dossier ? { ...s, overwrite: !s.overwrite } : s
        );
        setDuplicatedStudentsList(newList);
        setAllOverwritesChecked(newList.length > 0 && newList.every(s => s.overwrite));
    };

    /**
     * Manejador del evento de cambio del campo de selección
     * de nombre de pestaña.
     */
    const handleSheetNameValueChange = event => {
        const val = event.target.value;
        if (val !== "SELECCIONAR PESTAÑA") {
            setSheetNameValue(val);
            const suggestedRange = spreadsheetManipulator.getSuggestedRange(val);
            if (suggestedRange) {
                setCellRangeName(suggestedRange);
                const cellRangeInput = document.getElementById("cell-range");
                if (cellRangeInput) cellRangeInput.value = suggestedRange;
                saveSpreadsheetData('califications', { sheetNameValue: val, cellRangeName: suggestedRange });
            } else {
                saveSpreadsheetData('califications', { sheetNameValue: val });
            }
        } else {
            setSheetNameValue("");
            saveSpreadsheetData('califications', { sheetNameValue: "" });
        }
    }

    const handleTemplateDownload = () => {

        // Define el comentario que tendrá la hoja de cálculo.
        let comment = "Números del 1 al 10, o A/A-/D, o dejar en blanco para indicar ausencia.";
        let sheetComments = [
            ["A2", comment]
        ];

        // Define el contenido de la plantilla.
        let sheetContent = [
            ["Legajo", "Calificación"],
            [166364, 4],
        ];

        // Crea y descarga la plantilla.
        spreadsheetManipulator.create(
            "Plantilla de carga de calificaciones",
            "registro-calificaciones",
            sheetContent,
            sheetComments
        );

    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Registrar/Sobrescribir calificaciones</h1>
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
                <DragAndDropFile 
                    onFileDrop={handleFileSelection} 
                    onFileRemove={handleFileRemove}
                    accept=".xlsx,.xls,.ods" 
                    fileName={fileName} 
                />
                <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                    <button
                        type="button"
                        className="load-button"
                        onClick={handleTemplateDownload}
                    >
                        Descargar plantilla
                    </button>
                </div>

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
            {duplicatedStudentsList.length > 0 && (
                <div className="duplicated-students-table-container table-container">
                    <table className="duplicated-students-table">
                        <thead>
                            <tr>
                                <td colSpan="6">Registros duplicados ({duplicatedStudentsList.length})</td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" checked={allOverwritesChecked} onChange={handleToggleAllOverwrites} /> Sobrescribir</td>
                                <td>Fila</td>
                                <td>Legajo</td>
                                <td>Nota anterior</td>
                                <td>Nota nueva</td>
                                <td>Estado</td>
                            </tr>
                        </thead>
                        <tbody>
                            {duplicatedStudentsList.map((student, index) => (
                                <tr key={index} className={index % 2 !== 0 ? "even-row" : ""}>
                                    <td><input type="checkbox" checked={student.overwrite} onChange={() => handleToggleOverwrite(student.dossier)} /></td>
                                    <td>{student._row}</td>
                                    <td>{student.dossier}</td>
                                    <td>{student.oldCalification}</td>
                                    <td>{student.newCalification}</td>
                                    <td>{student.state}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="ok-students-table-container table-container not-displayed">
                <table className="ok-students-table"></table>
            </div>
            {(okStudentsList.length > 0 || duplicatedStudentsList.length > 0) && (
                <button
                    type="button"
                    className={"register-button" + (!registerButtonEnabled ? " disabled" : "")}
                    disabled={!registerButtonEnabled}
                    onClick={handleRegistering}
                >
                    Registrar/Sobrescribir calificaciones
                </button>
            )}

            {/* Botón de envío de email: aparece una vez que se registraron las calificaciones */}
            {!registerButtonEnabled && selectedEvent && (
                <div style={{ marginTop: '1rem' }}>
                    {emailSendState === 'idle' && (
                        <button type="button" onClick={handleSendEmail}>
                            Enviar calificaciones por email
                        </button>
                    )}
                    {emailSendState === 'sending' && (
                        <p className="send-email-status send-email-status--sending">
                            Envío de calificaciones: Enviando correos en segundo plano...
                        </p>
                    )}
                    {emailSendState === 'sent' && (
                        <p className="send-email-status send-email-status--sent">
                            Envío de calificaciones: El envío fue iniciado. Los alumnos recibirán su calificación en breve.
                        </p>
                    )}
                    {emailSendState === 'error' && (
                        <>
                            <button type="button" onClick={handleSendEmail}>
                                Reintentar envío
                            </button>
                            <p className="send-email-status send-email-status--error">
                                Envío de calificaciones: Hubo un error. Intentá nuevamente.
                            </p>
                        </>
                    )}
                </div>
            )}

        </PageLayout>
    );

}
