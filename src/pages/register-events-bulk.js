// Imports externos.
import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";

// Imports internos.
import { PageLayout } from "../components/page-layout.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service.js";
import HTMLTableManipulator from "../services/html-table-manipulator.js";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o.js";

// Estilos.
import "../styles/components/table.css";
import "../styles/register-events-bulk.css";

// Imágenes
import icono from "../img/icono-informativo.jpg"

export function EventsBulkRegistering() {

    const [fileName, setFileName] = useState("");
    const [fileHandle, setFileHandle] = useState(null);
    const [sheetNameValue, setSheetNameValue] = useState("");
    const [cellRangeName, setCellRangeName] = useState("");
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    const [okList, setOkList] = useState([]);
    const [notOkList, setNotOkList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);
    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);
    const [error, setError] = useState(null);
    const { getAccessTokenSilently } = useAuth0();
    const [, changeCourse] = useSelectedCourse(true);
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (course === null)
            window.location.replace(`${process.env.REACT_APP_DOMAIN_URL}/profile?redirected`);

    }, []);

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
                    columnNames: [
                        "eventTypeId:Tipo de evento",
                        "initialDatetime:Fecha y hora de inicio",
                        "endDatetime:Fecha y hora de fin",
                        "formatInfo:Error de formato",
                    ],
                    tableRows: invalidRegistersList,
                },
                `Registros con formato inválido (${invalidRegistersList.length})`
            );
            notValidFormatTable.classList.remove("not-displayed");
        } else notValidFormatTable.classList.add("not-displayed");

        /* // Actualiza la tabla de estudiantes que no están aptos para ser registrados.
        let notOkTable = document.getElementsByClassName(
            "not-ok-table"
        )[0];
        if (notOkList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notOkTable,
                {
                    columnNames: [
                        "dossier:Legajo",
                        "errorDescription:Descripción del error",
                    ],
                    tableRows: notOkList,
                },
                `Eventos que no se pueden registrar (${notOkList.length})`
            );
            notOkTable.classList.remove("not-displayed");
        } else notOkTable.classList.add("not-displayed"); */

        // Actualiza la tabla de estudiantes que están aptos para ser registrados.
        let okTable = document.getElementsByClassName(
            "ok-table"
        )[0];
        let okTableContainer = document.getElementsByClassName(
            "ok-table-container"
        )[0];
        if (okList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                okTable,
                {
                    columnNames: [
                        "state:Estado",
                        "eventDescription:Tipo de evento",
                        "initialDatetime:Fecha y hora inicial",
                        "endDatetime:Fecha y hora final",
                        "obligatory:Obligatorio",
                    ],
                    tableRows: okList,
                    columnClasses: [
                        "state:wrapped",
                    ]
                },
                `Eventos para crear (${okList.length})`
            );
               okTableContainer.classList.remove("not-displayed");
        } else okTableContainer.classList.add("not-displayed");

    }, [okList, notOkList, invalidRegistersList, tableManualUpdateTrigger]);

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

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

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

        // Notifica al usuario si no se seleccionó el nombre de la pestaña
        // de la planilla.
        if (sheetNameValue === "") {

            setError("Debe seleccionar un nombre de pestaña.");

        // Notifica al usuario si el rango no fue ingresado.
        } else if (cellRangeName === "") {

            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");

        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {

            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido; debe ser '&lt;letras&gt;&lt;números&gt;:&lt;letras&gt;&lt;números&gt;'.");

        } else {

            // Limpia el eventual mensaje de error que se encuentre en pantalla.
            setError(null);

            // Lee un rango de celdas.
            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, [
                "eventTypeId",
                "initialDatetime",
                "endDatetime",
                "obligatory",
            ]);

            // Agrega, al rango de celdas leído, el número de fila como identificador temporal.


            // Obtiene el rango seleccionado del Excel.
            let readRange = spreadsheetManipulator.getLastReadRange();

            // Verifica los registros con formato incorrecto y los separa.
            let validFormatRange = [];
            let invalidFormatRange = [];
            readRange.data.forEach(row => {

                //try {
                    let invalidFormat = false;
                    var dateRegex = new RegExp("^\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}$");

                    // Verifica si el formato del tipo de clase es correcto.
                    if (
                        typeof row.eventTypeId !== 'number'
                        ||
                        row.eventTypeId <= 0
                    ) {
                        row.formatInfo = "El tipo de evento debe ser un valor numérico mayor a cero."
                        invalidFormat = true;
                    }

                    // Verifica si el formato de los campos de fecha y hora son correctos.
                    else if (!dateRegex.test(String(row.initialDatetime).trim())) {
                        row.formatInfo = "El campo de fecha y hora inicial debe tener el formato DD/MM/AAAA HH:MM.";
                        invalidFormat = true;
                    } else if (!dateRegex.test(String(row.endDatetime).trim())) {
                        row.formatInfo = "El campo de fecha y hora final debe tener el formato DD/MM/AAAA HH:MM.";
                        invalidFormat = true;
                    }
                    
                    // Verifica si el formato del campo que indica la obligatoriedad tiene un formato correcto.
                    else if (
                        typeof row.obligatory !== 'string'
                        || (
                            row.obligatory !== ""
                            && row.obligatory.toLowerCase() !== "x"
                        )
                    ) {
                        row.formatInfo = "El campo que indica si la clase es obligatoria debe estar marcada por una 'x' o debe estar vacía.";
                        invalidFormat = true;
                    }

                    // Separa los registros con formato válido de los que tienen formato inválido.
                    if (invalidFormat) {
                        invalidFormatRange.push(row);
                    } else {
                        validFormatRange.push(row);
                    }
                
                //} catch (e) {console.error(e)}

            });

            // Establece, si hubiere, la lista de registros con formato inválido para ser mostrados
            // al actualizar el componente de React.
            setInvalidRegistersList(
                invalidFormatRange
            );

            // Si hay registros con formato válido, envía la petición de chequeo de información
            // al back, para saber cuáles registros podrían registrarse y cuáles no.
            if (validFormatRange.length != 0) {

                // Guarda los registros con formato correcto en el arreglo con el formato necesario
                // para ser enviado al back.
                /** @type {Array.<number>} */ const newEventsArray = validFormatRange.map(element => {
                    return {
                        eventTempId: element._row,
                        eventTypeId: element.eventTypeId,
                        initialDatetime: 
                            element.initialDatetime.substring(6, 10) +
                            "-" +
                            element.initialDatetime.substring(3, 5) +
                            "-" +
                            element.initialDatetime.substring(0, 2) +
                            "T" +
                            element.initialDatetime.substring(11, 16),
                        endDatetime:
                            element.endDatetime.substring(6, 10) +
                            "-" +
                            element.endDatetime.substring(3, 5) +
                            "-" +
                            element.endDatetime.substring(0, 2) +
                            "T" +
                            element.endDatetime.substring(11, 16),
                        obligatory: element.obligatory.toLowerCase() == "x" ? true : false
                    }
                });

                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently()
                    .then(response => response)
                    .catch(error => {
                        throw error;
                    });

                // Verifica que la información pueda ser registrada en la base de datos.
                const checkedInfo = await axios
                    .post(
                        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/events-registration-check`,
                        {
                            courseId: course.getId(),
                            eventsList: newEventsArray,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${auth0Token}`,
                            },
                        }
                    )
                    .then(okReponse => okReponse)
                    .catch(error => error.response);

                // Si la petición al back no finalizó correctamente, se establece el mensaje de error
                // que se le mostrará al usuario.
                if (checkedInfo.status === 500)
                    setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
                else if (checkedInfo.status !== 200)
                    setError(checkedInfo.data.errorDescription);
                
                // Si la petición al back finalizó correctamente, se establecen los registros de formato
                // inválido, si los hubiere, así como también los de formato válido, para que sean mostrados
                // en la próxima actualización del componente de React.
                else {

                    // Establece, si hubiere, la lista de registros que pueden ser procesados y almacenados
                    // por el back al actualizar el componente de React.
                    setOkList(
                        checkedInfo.data.ok.map(
                            eventInfo => {

                                // Obtiene el registro de readRange que tiene mismo legajo.
                                let eventLoadedData = readRange.data.find(
                                    readRegister => readRegister._row == eventInfo.eventTempId
                                );

                                // Une la información traída del back con la que se cargó del Excel.
                                eventInfo.eventTypeId = eventLoadedData.eventTypeId;
                                eventInfo.initialDatetime = eventLoadedData.initialDatetime;
                                eventInfo.endDatetime = eventLoadedData.endDatetime;
                                eventInfo.obligatory = eventLoadedData.obligatory;

                                // Agrega el estado de registración en sistema.
                                eventInfo.state = 'Pendiente';

                                return eventInfo;

                            }
                        )
                    );

                    /* setNotOkList(
                        checkedInfo.data.nok.map(
                            dossierInfo => {
                                let errorDescription;
                                switch (dossierInfo.errorCode) {
                                    case 1:
                                        errorDescription = "El legajo no está registrado en el sistema.";
                                        break;
                                    case 2:
                                        errorDescription =
                                            "El estudiante ya está registrado en la cursada.";
                                        break;
                                }
                                return {
                                    dossier: dossierInfo.dossier,
                                    errorDescription: errorDescription,
                                };
                            }
                        )
                    ); */

                }

            }

        }

    };

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

        // Muestra el botón de actualizar.

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

    };

    const handleSheetNameValueChange = event => {

        if(event.target.value !== "SELECCIONAR PESTAÑA") 
            setSheetNameValue(event.target.value);
        else setSheetNameValue("");

    };

    const handleCellRangeName = event => {
        setCellRangeName(event.target.value.toUpperCase());
    };

    /**
     * Manejador del evento clic en el botón de registración
     * masiva de alumnos a cursada.
     */
    const handleRegistering = async () => {

        // Prepara la lista de eventos para ser enviada al back.
        const eventsCreationInfo = okList
            .map(eventCreationInfo => {
                return {
                    eventTempId: eventCreationInfo.eventTempId,
                    eventTypeId: eventCreationInfo.eventTypeId,
                    initialDatetime: 
                            eventCreationInfo.initialDatetime.substring(6, 10) +
                            "-" +
                            eventCreationInfo.initialDatetime.substring(3, 5) +
                            "-" +
                            eventCreationInfo.initialDatetime.substring(0, 2) +
                            "T" +
                            eventCreationInfo.initialDatetime.substring(11, 16),
                    endDatetime:
                            eventCreationInfo.endDatetime.substring(6, 10) +
                            "-" +
                            eventCreationInfo.endDatetime.substring(3, 5) +
                            "-" +
                            eventCreationInfo.endDatetime.substring(0, 2) +
                            "T" +
                            eventCreationInfo.endDatetime.substring(11, 16),
                    obligatory: eventCreationInfo.obligatory.toLowerCase() == 'x' ? true : false
                }
            });

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // Realiza la solicitud al endpoint para crear los eventos.
        const response = await axios
            .post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/create-events-bulk`,
                {
                    courseId: course.getId(),
                    eventsList: eventsCreationInfo,
                },
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .then(response => response)
            .catch(error => error.response);

        // Si la petición al back no finalizó correctamente, se establece el mensaje de error
        // que se le mostrará al usuario.
        if (response.status === 500)
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
        else if (response.status !== 200)
            setError(response.data.errorDescription);

        else {
            
            // El front inserta un símbolo en la primera columna de cada registro para indicar
            // que se registró en el sistema.

            // Actualiza la información de los eventos que se registraron correctamente.
            response.data.ok.forEach(eventInResponse => {
                let matchedEvent = okList
                .find(eventInOkList => eventInOkList.eventTempId === eventInResponse.eventTempId);
                
                matchedEvent.state = "Creado";
            });

            /* // Actualiza la información de los estudiantes que no se registraron correctamente.
            response.data.nok.forEach(notRegisteredStudentInfo => {
                let notRegisteredStudent = okList
                    .find(student => student.dossier === notRegisteredStudentInfo.dossier);
                switch(notRegisteredStudentInfo.errorCode) {
                    case 1: notRegisteredStudent.state = "No registrado: el legajo no existe en sistema.";
                        break;
                    case 2: notRegisteredStudent.state = "No registrado: el legajo ya estaba registrado.";
                        break;
                };
            }); */

            // Actualiza la información de la tabla.
            setTableManualUpdateTrigger(!tableManualUpdateTrigger);

        }

    };

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Carga masiva de eventos
            </h1>
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
            <form>
                <p>Seleccionar archivo de estudiantes</p>
                <div className="label_button">
                    <label htmlFor="file">
                        Cargar archivo
                    </label>
                </div>
                <img
                    src={icono}
                    width="35"
                    height="35"
                    title="Campos: Código de tipo de evento (entero mayor a cero); Fecha y hora inicial (DD/MM/AAAA HH:MM); Fecha y hora final (DD/MM/AAAA HH:MM); Obligatorio (marcar con 'x' cuando el evento es obligatorio)."
                    className="help_icon"
                />
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
                <p>Rango de celdas a cargar</p>
                <img
                    src={icono}
                    width="30"
                    height="30"
                    title="Ejemplo: A2:D9."
                    className="help_icon"
                />
                <input
                    type="text"
                    id="cell-range"
                    onChange={handleCellRangeName}
                    required
                />
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
            <div className="ok-table-container table-container not-displayed">
                <table className="ok-table"></table>
                <button
                    type="button"
                    className="register-events-button"
                    onClick={handleRegistering}
                >
                    Registrar estudiantes
                </button>
            </div>
        </PageLayout>
    );

}
