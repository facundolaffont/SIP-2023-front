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
import { useSpreadsheetContext } from "../contexts/spreadsheet/spreadsheet-provider.js";
import { DragAndDropFile } from "../components/drag-and-drop-file.js";

// Estilos.
import '../styles/register-bulk-attendance.css';

export function BulkAttendanceRegistering() {

    // #region ==== Definición de parámetros. ====
    
    const [fileName, setFileName] = useState('');
    const [fileHandle, setFileHandle] = useState(null);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    const [sheetNameValue, setSheetNameValue] = useState('');
    const [cellRangeName, setCellRangeName] = useState('');

    const [registerButtonEnabled, setRegisterButtonEnabled] = useState(true);

    const [eventsList, setEventsList] = useState([]);
    const [columnEventMap, setColumnEventMap] = useState([]);

    const [okStudentsList, setOkStudentsList] = useState([]);
    const [notOkStudentsList, setNotOkStudentsList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);
    const [bulkAttendanceData, setBulkAttendanceData] = useState(null);

    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);

    const [error, setError] = useState(null);

    const { getAccessTokenSilently } = useAuth0();

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();
    const { getSpreadsheetData, saveSpreadsheetData, clearSpreadsheetData } = useSpreadsheetContext();

    // Restaura el estado desde el contexto
    useEffect(() => {
        const savedData = getSpreadsheetData('bulk-attendance');
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
    
    // #endregion ==== Definición de parámetros. ====
    
    // Redirige si no hay cursada seleccionada.
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    // Actualiza el mensaje de error.
    useEffect(() => { 
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];
        if (error === null) {
            msgContainer.classList.add("not-displayed");
        } else {
            setOkStudentsList([]);
            setNotOkStudentsList([]);
            setInvalidRegistersList([]);
            const errorMsgTextContainer = document.getElementsByClassName("info-msg-description")[0];
            errorMsgTextContainer.innerHTML = error;
            msgContainer.classList.remove("not-displayed");
        }
    }, [error]);

    // Estado del botón de registración.
    useEffect(() => { 
        const registerButton = document.getElementsByClassName("register-button")[0];
        if (registerButtonEnabled) {
            registerButton.disabled = false;
            registerButton.classList.remove("disabled");
        } else {
            registerButton.disabled = true;
            registerButton.classList.add("disabled");
        }
    }, [registerButtonEnabled]);
    
    // Obtiene la lista de eventos de clase de la cursada.
    useEffect(() => { 
        if (!course) return;

        const getEventsList = async () => {
            const auth0Token = await getAccessTokenSilently()
            .catch(error => { throw error; });

            const response = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-class-events`,
                {
                    params: { 'course-id': course.getId() },
                    headers: { Authorization: `Bearer ${auth0Token}` },
                }
            );

            if (response.status !== 200) {
                setError("Hubo un error al obtener los eventos. Por favor, contactarse con Soporte Técnico.");
            } else if (response.data.eventList.length === 0) {
                history.push('/profile?no-events');
            } else {
                setEventsList(response.data.eventList);
            }
        }
        getEventsList()
        .catch(error => error.response);
    }, [course]);

    // Actualiza las tablas.
    useEffect(() => { 

        // Tabla de registros con formato incorrecto.
        let notValidFormatTable = document.getElementsByClassName("not-valid-format-table")[0];
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
                `Registros con formato inválido (${invalidRegistersList.length})`
            );
            notValidFormatTable.classList.remove("not-displayed");
        } else notValidFormatTable.classList.add("not-displayed");

        // Tabla de estudiantes que no se pueden registrar.
        let notOkStudentsTable = document.getElementsByClassName("not-ok-students-table")[0];
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

        // Tabla de estudiantes válidos con preview de asistencia por evento.
        let okStudentsTableContainer = document.getElementsByClassName("ok-students-table-container")[0];
        let okStudentsTable = document.getElementsByClassName("ok-students-table")[0];
        if (okStudentsList.length !== 0) {

            // Construye las columnas dinámicas: una por cada evento.
            const eventColumns = columnEventMap.map(
                mapping => `event_${mapping.eventId}:${mapping.headerText}`
            );
            const allColumns = [
                "state:Estado",
                "dossier:Legajo",
                "id:DNI",
                "name:Nombre",
                ...eventColumns,
            ];

            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    tableRows: okStudentsList,
                    columnNames: allColumns,
                    columnClasses: [
                        "state:wrapped",
                    ],
                },
                `Estudiantes para registrar asistencia (${okStudentsList.length})`
            );
            okStudentsTableContainer.classList.remove("not-displayed");
        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okStudentsList, notOkStudentsList, invalidRegistersList, tableManualUpdateTrigger]);

    // Inicializa SpreadsheetManipulator.
    useState(() => { 
        const savedData = getSpreadsheetData('bulk-attendance');
        if (!savedData) {
            setSpreadsheetManipulator(new SpreadsheetManipulator());
        }
    }, []);

    /**
     * Genera el texto de cabecera para un evento.
     */
    const buildEventHeader = (event) => {
        let nameString = '';
        if (event.name !== null) nameString = `"${event.name}" `;

        let mandatoryString = event.mandatory
            ? 'obligatoria'
            : 'no obligatoria';

        return `${event.type} ${nameString}(${mandatoryString})`;
    };

    /**
     * Descarga la plantilla Excel multi-evento.
     */
    const handleTemplateDownload = () => { 
        if (eventsList.length === 0) {
            setError("No hay eventos de clase cargados en la cursada.");
            return;
        }

        // Construye las cabeceras y el mapeo columna → eventId.
        const headers = ["Legajo"];
        const mapping = [];
        eventsList.forEach((event, index) => {
            const headerText = buildEventHeader(event);
            headers.push(headerText);
            mapping.push({
                columnIndex: index + 1, // +1 porque la columna 0 es "Legajo"
                eventId: event.eventId,
                headerText: headerText,
            });
        });

        // Guarda el mapeo en el estado para usarlo al parsear.
        setColumnEventMap(mapping);

        // Genera el Excel con una fila de ejemplo.
        const exampleRow = [166364, ...eventsList.map(() => "x")];
        spreadsheetManipulator.create(
            "Plantilla de carga masiva de asistencia",
            "registro-asistencias-masivo",
            [headers, exampleRow]
        );
    }

    /**
     * Carga los nombres de pestaña del Excel subido.
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
                saveSpreadsheetData('bulk-attendance', { sheetNameValue: singleSheet, cellRangeName: suggestedRange });
            } else {
                saveSpreadsheetData('bulk-attendance', { sheetNameValue: singleSheet });
            }
        }
    }

    const handleFileSelection = file => { 
        setFileName(file.name);
        setFileHandle(file);
        setError(null);
        setOkStudentsList([]);
        setNotOkStudentsList([]);
        setInvalidRegistersList([]);
        
        spreadsheetManipulator.loadFile(file, () => {
            loadSheetNames();
            saveSpreadsheetData('bulk-attendance', {
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
        setSpreadsheetManipulator(new SpreadsheetManipulator());
        clearSpreadsheetData('bulk-attendance');
        
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

    const handleCellRangeName = event => { 
        const val = event.target.value.toUpperCase();
        setCellRangeName(val);
        saveSpreadsheetData('bulk-attendance', { cellRangeName: val });
    }

    const handleSheetNameValueChange = event => { 
        const val = event.target.value;
        if(val !== "SELECCIONAR PESTAÑA") {
            setSheetNameValue(val);
            const suggestedRange = spreadsheetManipulator.getSuggestedRange(val);
            if (suggestedRange) {
                setCellRangeName(suggestedRange);
                const cellRangeInput = document.getElementById("cell-range");
                if (cellRangeInput) cellRangeInput.value = suggestedRange;
                saveSpreadsheetData('bulk-attendance', { sheetNameValue: val, cellRangeName: suggestedRange });
            } else {
                saveSpreadsheetData('bulk-attendance', { sheetNameValue: val });
            }
        } else {
            setSheetNameValue("");
            saveSpreadsheetData('bulk-attendance', { sheetNameValue: "" });
        }
    }

    /**
     * Regenera el mapeo columna→eventId leyendo las cabeceras del Excel
     * y comparándolas con los eventos de la cursada.
     */
    const rebuildColumnEventMapFromHeaders = (headerRow) => {
        const mapping = [];
        // headerRow[0] es "Legajo", los demás son eventos.
        for (let i = 1; i < headerRow.length; i++) {
            const headerText = String(headerRow[i]).trim();
            // Busca el evento cuyo header generado coincide.
            const matchedEvent = eventsList.find(event => {
                return buildEventHeader(event) === headerText;
            });
            if (matchedEvent) {
                mapping.push({
                    columnIndex: i,
                    eventId: matchedEvent.eventId,
                    headerText: headerText,
                });
            }
        }
        return mapping;
    };

    /**
     * Manejador del evento clic en el botón "Cargar registros".
     * Parsea el Excel multi-columna y envía los legajos a validación.
     */
    const handleRangeLoading = async event => { 

        event.preventDefault();
        setRegisterButtonEnabled(true);

        if (sheetNameValue === "") {
            setError("Debe seleccionar un nombre de pestaña.");
        } else if (cellRangeName === "") {
            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");
        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {
            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido; debe ser '<letras><números>:<letras><números>'.");
        } else {

            setError(null);

            // Construye los nombres de las columnas dinámicamente.
            // Primera columna = dossier, las demás = eventos.
            const columnNames = ["dossier"];
            
            // Determina o regenera el mapeo columna→eventId.
            let currentMapping = columnEventMap;
            if (currentMapping.length === 0 && eventsList.length > 0) {
                // No hay mapeo (no se bajó la plantilla desde esta sesión).
                // Intenta reconstruirlo desde las cabeceras del Excel.
                // Para eso, lee la primera fila (encabezados).
                // Usamos el rango pero una fila antes.
                const rangeMatch = cellRangeName.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
                if (rangeMatch) {
                    const headerRowNum = parseInt(rangeMatch[2]) - 1;
                    if (headerRowNum >= 1) {
                        const headerRange = `${rangeMatch[1]}${headerRowNum}:${rangeMatch[3]}${headerRowNum}`;
                        const headerColumnNames = [];
                        // Genera nombres genéricos para leer las cabeceras.
                        for (let i = 0; i < eventsList.length + 1; i++) {
                            headerColumnNames.push(`col_${i}`);
                        }
                        spreadsheetManipulator.loadRange(sheetNameValue, headerRange, headerColumnNames);
                        const headerData = spreadsheetManipulator.getLastReadRange();
                        if (headerData && headerData.data && headerData.data.length > 0) {
                            const headerRow = headerColumnNames.map(cn => headerData.data[0][cn]);
                            currentMapping = rebuildColumnEventMapFromHeaders(headerRow);
                            setColumnEventMap(currentMapping);
                        }
                    }
                }
            }

            if (currentMapping.length === 0) {
                setError("No se pudo determinar el mapeo de columnas a eventos. Por favor, descargue la plantilla primero.");
                return;
            }

            // Agrega una columna por cada evento mapeado.
            currentMapping.forEach(mapping => {
                columnNames.push(`event_${mapping.eventId}`);
            });

            // Lee el rango de datos del Excel.
            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, columnNames);
            let readRange = spreadsheetManipulator.getLastReadRange();

            // Separa registros con formato inválido.
            let validFormatRange = [];
            let invalidFormatRange = [];
            readRange.data.forEach(row => {
                let invalidFormat = false;
                if (isNaN(row.dossier) || row.dossier <= 0) {
                    row.formatInfo = "El legajo no es un entero positivo.";
                    invalidFormat = true;
                }
                if (invalidFormat) {
                    invalidFormatRange.push(row);
                } else {
                    validFormatRange.push(row);
                }
            });

            // Obtiene los legajos válidos.
            const validDossiersArray = validFormatRange.map(element => element["dossier"]);

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => { throw error; });

            // Envía los legajos para ser verificados contra la cursada.
            const studentsCheckedInfo = await axios
                .post(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/check-dossiers-in-course`,
                    {
                        courseId: course.getId(),
                        dossiersList: validDossiersArray,
                    },
                    {
                        headers: { Authorization: `Bearer ${auth0Token}` },
                    }
                )
                .then(okResponse => okResponse)
                .catch(error => error.response);

            if (studentsCheckedInfo.status !== 200) {
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
            } else {

                setInvalidRegistersList(invalidFormatRange);

                // Construye la lista de estudiantes válidos con su asistencia por evento.
                const okDossiers = new Set(studentsCheckedInfo.data.ok.map(s => s.dossier));

                setOkStudentsList(
                    studentsCheckedInfo.data.ok.map(student => {
                        const studentLoadedData = validFormatRange.find(
                            register => register.dossier == student.dossier
                        );

                        let studentInfo = {
                            state: 'Pendiente',
                            dossier: student.dossier,
                            id: student.id,
                            name: student.name,
                        };

                        // Agrega la asistencia por evento.
                        currentMapping.forEach(mapping => {
                            const cellValue = studentLoadedData
                                ? String(studentLoadedData[`event_${mapping.eventId}`] || '').trim()
                                : '';
                            studentInfo[`event_${mapping.eventId}`] = cellValue !== '' ? 'x' : '';
                        });

                        return studentInfo;
                    })
                );

                // Construye los datos para el registro masivo.
                const attendanceByEvent = currentMapping.map(mapping => {
                    const attendanceList = studentsCheckedInfo.data.ok
                        .map(student => {
                            const studentLoadedData = validFormatRange.find(
                                register => register.dossier == student.dossier
                            );
                            const cellValue = studentLoadedData
                                ? String(studentLoadedData[`event_${mapping.eventId}`] || '').trim()
                                : '';
                            return {
                                dossier: student.dossier,
                                attendance: cellValue !== '',
                            };
                        });
                    return {
                        eventId: mapping.eventId,
                        attendanceList: attendanceList,
                    };
                });
                setBulkAttendanceData({ attendanceByEvent });

                // Muestra los registros que no pasaron la validación.
                if (studentsCheckedInfo.data.nok !== undefined) {
                    setNotOkStudentsList(
                        studentsCheckedInfo.data.nok.map(dossierInfo => ({
                            dossier: dossierInfo.dossier,
                            errorDescription: dossierInfo.errorDescription,
                        }))
                    );
                }

            }

        }

    }

    /**
     * Manejador del evento clic en el botón "Registrar asistencias".
     * Envía los datos de asistencia masiva al backend.
     */
    const handleRegistering = async () => { 

        if (!bulkAttendanceData) return;

        setRegisterButtonEnabled(false);

        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => { throw error; });

        const response = await axios
            .post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-bulk-attendance`,
                bulkAttendanceData,
                {
                    headers: { Authorization: `Bearer ${auth0Token}` },
                }
            )
            .then(response => response)
            .catch(error => error);

        if (response.status !== 200) {
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
        } else {

            // Actualiza el estado de los estudiantes registrados exitosamente.
            let allOk = true;
            response.data.results.forEach(eventResult => {
                eventResult.ok.forEach(registeredDossier => {
                    let student = okStudentsList.find(s => s.dossier === registeredDossier);
                    if (student) student.state = "Registrado";
                });
                if (eventResult.nok && eventResult.nok.length > 0) {
                    allOk = false;
                    eventResult.nok.forEach(failedDossier => {
                        let student = okStudentsList.find(s => s.dossier === failedDossier);
                        if (student) student.state = "Error en algunos eventos";
                    });
                }
            });

            setTableManualUpdateTrigger(!tableManualUpdateTrigger);

        }

    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Registrar asistencias masivamente</h1>
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
            <form onSubmit={(e) => e.preventDefault()}>
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
                        Descargar plantilla masiva
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
                    placeholder="Ejemplo: A2:D50"
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
                <table className="not-ok-students-table table-container not-displayed"></table>
            </div>
            <div className="ok-students-table-container table-container not-displayed">
                <table className="ok-students-table"></table>
                <button
                    type="button"
                    className="register-button"
                    onClick={handleRegistering}
                >
                    Registrar asistencias
                </button>
            </div>

        </PageLayout>
    );

}
