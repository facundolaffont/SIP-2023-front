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

export function GroupCalificationRegistering() {

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

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una.
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    // Restaura el estado desde el contexto
    useEffect(() => {
        const savedData = getSpreadsheetData('group-califications');
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

    // Obtiene la lista de eventos de evaluación de la cursada.
    useEffect(() => {
        if (!course) return;

        const getEventsList = async () => {
            const auth0Token = await getAccessTokenSilently()
                .catch(error => { throw error; });

            const eventsList = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-evaluation-events`,
                {
                    params: { 'course-id': course.getId() },
                    headers: { Authorization: `Bearer ${auth0Token}` },
                }
            ).catch(error => error.response);

            if (eventsList.status !== 200) {
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
            } else if (eventsList.data.eventList.length === 0) {
                history.push('/profile?no-events');
            } else {
                let eventsSelect = document.getElementById("events-select");
                while (eventsSelect.firstChild) {
                    eventsSelect.removeChild(eventsSelect.firstChild);
                }
                const listFirstElement = document.createElement("option");
                listFirstElement.innerHTML = "SELECCIONAR EVENTO";
                listFirstElement.value = 0;
                eventsSelect.appendChild(listFirstElement);
                eventsList.data.eventList.forEach(eventElement => {
                    let nameString = '';
                    if (eventElement.name !== null) nameString = ` "${eventElement.name}"`;

                    let dateTimeString = "";
                    if (eventElement.initialDateTime !== null && eventElement.endDateTime !== null) {
                        const initialDate = Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(eventElement.initialDateTime));
                        const initialTime = Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(eventElement.initialDateTime));
                        const endDate = Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(eventElement.endDateTime));
                        const endTime = Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(eventElement.endDateTime));
                        dateTimeString = initialDate.valueOf() === endDate.valueOf()
                            ? `: ${initialDate} de ${initialTime} a ${endTime}`
                            : `: ${initialDate} ${initialTime} - ${endDate} ${endTime}`;
                    }

                    const eventDescription = `${eventElement.type}${nameString}${dateTimeString}`;
                    const listElement = document.createElement("option");
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
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];
        if (error === null) {
            msgContainer.classList.add("not-displayed");
        } else {
            setOkStudentsList([]);
            setNotOkStudentsList([]);
            setInvalidRegistersList([]);
            setDuplicatedStudentsList([]);
            setAllOverwritesChecked(false);

            const errorMsgTextContainer = document.getElementsByClassName("info-msg-description")[0];
            errorMsgTextContainer.innerHTML = error;
            msgContainer.classList.remove("not-displayed");
        }
    }, [error]);

    // Actualiza las tablas.
    useEffect(() => {
        let notValidFormatTable = document.getElementsByClassName("not-valid-format-table")[0];
        if (invalidRegistersList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notValidFormatTable,
                {
                    tableRows: invalidRegistersList,
                    columnNames: ["_row:Fila Excel", "formatInfo:Error"],
                    columnClasses: ["calification:centered"],
                },
                `Grupos con formato inválido (${invalidRegistersList.length})`
            );
            notValidFormatTable.classList.remove("not-displayed");
        } else notValidFormatTable.classList.add("not-displayed");

        let notOkStudentsTable = document.getElementsByClassName("not-ok-students-table")[0];
        if (notOkStudentsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notOkStudentsTable,
                {
                    tableRows: notOkStudentsList,
                    columnNames: ["dossier:Legajo", "groupName:Grupo", "errorDescription:Descripción del error"],
                },
                `Legajos que no se pueden registrar (${notOkStudentsList.length})`
            );
            notOkStudentsTable.classList.remove("not-displayed");
        } else notOkStudentsTable.classList.add("not-displayed");

        let okStudentsTableContainer = document.getElementsByClassName("ok-students-table-container")[0];
        if (okStudentsList.length !== 0) {
            let okStudentsTable = document.getElementsByClassName("ok-students-table")[0];
            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    tableRows: okStudentsList,
                    columnNames: ["state:Estado", "dossier:Legajo", "name:Nombre", "groupName:Grupo", "calification:Calificación"],
                    columnClasses: ["state:wrapped", "calification:centered", "groupName:centered"],
                },
                `Estudiantes para registrar calificación (${okStudentsList.length}) - ${selectedEvent?.eventDescription}`
            );
            okStudentsTableContainer.classList.remove("not-displayed");
        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okStudentsList, notOkStudentsList, invalidRegistersList, tableManualUpdateTrigger]);

    useState(() => {
        const savedData = getSpreadsheetData('group-califications');
        if (!savedData) {
            setSpreadsheetManipulator(new SpreadsheetManipulator());
        }
    }, []);

    const finishedLoading = spreadsheetManipulator => {
        spreadsheetManipulator.loadRangeSides(sheetNameValue, cellRangeName, ["Grupo", "Calificación"]);
        let calificationsTable = document.getElementsByClassName("calification-table")[0];
        spreadsheetManipulator.insertDataIntoTable(calificationsTable, "Tabla de calificaciones por grupos");
        calificationsTable.classList.remove("not-displayed");
        setSpreadsheetManipulator(spreadsheetManipulator);
    }

    const loadFile = event => {
        event.preventDefault();
        let sm = new SpreadsheetManipulator();
        sm.loadFile(fileHandle, finishedLoading);
    }

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
                saveSpreadsheetData('group-califications', { sheetNameValue: singleSheet, cellRangeName: suggestedRange });
            } else {
                saveSpreadsheetData('group-califications', { sheetNameValue: singleSheet });
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
        setDuplicatedStudentsList([]);
        setAllOverwritesChecked(false);
        spreadsheetManipulator.loadFile(file, () => {
            loadSheetNames();
            saveSpreadsheetData('group-califications', {
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
        clearSpreadsheetData('group-califications');
        
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
        saveSpreadsheetData('group-califications', { cellRangeName: val });
    }

    const handleEventSelection = event => {
        setEventId(Number(event.target.value));
        setEventDescription(event.target.selectedOptions[0].label);
    }

    const handleRangeLoading = async event => {
        event.preventDefault();
        setRegisterButtonEnabled(true);

        if (sheetNameValue === "") {
            setError("Debe seleccionar un nombre de pestaña.");
        } else if (cellRangeName === "") {
            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");
        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {
            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido; debe ser '<letras><números>:<letras><números>'.");
        } else if (eventId === 0) {
            setError("El campo 'Evento' no contiene un evento seleccionado.");
        } else {
            setError(null);

            // Fetch groups to map groupName -> dossiers
            const auth0Token = await getAccessTokenSilently();
            const groupsResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-student-groups`,
                {
                    params: { courseId: course.getId() },
                    headers: { Authorization: `Bearer ${auth0Token}` },
                }
            );
            const existingGroups = groupsResponse.data.groups || [];
            const groupNameToDossiers = {};
            existingGroups.forEach(g => {
                groupNameToDossiers[g.groupName] = g.studentDossiers;
            });

            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, ["groupName", "calification"]);
            let readRange = spreadsheetManipulator.getLastReadRange();

            let validFormatRange = []; 
            let invalidFormatRange = []; 
            let flattenedReadData = []; 

            readRange.data.forEach(row => {
                let invalidFormat = false;
                // Verificamos si el grupo existe.
                const gName = String(row.groupName).trim();
                if (!gName || !groupNameToDossiers[gName]) {
                    row.formatInfo = `El grupo '${gName}' no existe en esta cursada.`;
                    invalidFormat = true;
                } else {
                    var regex = new RegExp("^(A-?|D|[0-9]((\\.|,)\\d+)?|10|)$");
                    if (!regex.test(String(row.calification).trim().toUpperCase())) {
                        row.formatInfo = "El campo de calificación debe contener un valor de 0 a 10, ó D, A o A-";
                        invalidFormat = true;
                    }
                }

                row.calification = String(row.calification).trim().toUpperCase();
                if (String(row.calification) == '') row.calification = 'AUSENTE';

                if (invalidFormat) {
                    invalidFormatRange.push({ _row: row._row, formatInfo: row.formatInfo });
                } else {
                    const dossiers = groupNameToDossiers[gName];
                    if (dossiers.length === 0) {
                        invalidFormatRange.push({ _row: row._row, formatInfo: `El grupo '${gName}' no tiene alumnos.` });
                    } else {
                        dossiers.forEach(dossier => {
                            const flattenedRow = {
                                dossier: dossier,
                                groupName: gName,
                                calification: row.calification,
                                _row: row._row
                            };
                            validFormatRange.push(flattenedRow);
                            flattenedReadData.push(flattenedRow);
                        });
                    }
                }
            });

            const validDossiersArray = validFormatRange.map(element => element.dossier);

            setSelectedEvent({
                eventId: eventId,
                eventDescription: eventDescription,
            });

            const studentsCheckedInfo = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/check-califications-dossiers-in-event`,
                { eventId: eventId, dossiersList: validDossiersArray },
                { headers: { Authorization: `Bearer ${auth0Token}` } }
            ).catch(error => error.response);

            if (studentsCheckedInfo.status !== 200) {
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
            } else {
                setInvalidRegistersList(invalidFormatRange);

                setOkStudentsList(
                    studentsCheckedInfo.data.ok.map(student => {
                        let studentLoadedData = flattenedReadData.find(register => register.dossier == student.dossier);
                        let studentInfo = {};
                        studentInfo.dossier = student.dossier;
                        studentInfo.id = student.id;
                        studentInfo.name = student.name;
                        studentInfo.groupName = studentLoadedData.groupName;
                        studentInfo.calification = String(studentLoadedData.calification).replace(',', '.');
                        studentInfo._row = studentLoadedData._row;
                        studentInfo.state = 'Pendiente';
                        return studentInfo;
                    })
                );

                if (studentsCheckedInfo.data.nok !== undefined) {
                    let nokList = [];
                    let duplicatedList = [];
                    studentsCheckedInfo.data.nok.forEach(dossierInfo => {
                        let studentLoadedData = flattenedReadData.find(register => register.dossier == dossierInfo.dossier);
                        if (dossierInfo.errorCode === 3) {
                            duplicatedList.push({
                                _row: studentLoadedData._row,
                                groupName: studentLoadedData.groupName,
                                dossier: dossierInfo.dossier,
                                oldCalification: dossierInfo.oldCalification,
                                newCalification: String(studentLoadedData.calification).replace(',', '.'),
                                overwrite: false,
                                state: "Pendiente"
                            });
                        } else {
                            nokList.push({
                                _row: studentLoadedData._row,
                                groupName: studentLoadedData.groupName,
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

    const handleRegistering = async () => {
        setRegisterButtonEnabled(false);

        const calificationRegistrationInfo = [
            ...okStudentsList,
            ...duplicatedStudentsList.filter(student => student.overwrite)
        ].map(studentInfo => {
            return {
                dossier: studentInfo.dossier,
                calification: String(studentInfo.calification || studentInfo.newCalification).replace(',', '.')
            }
        });

        const auth0Token = await getAccessTokenSilently();
        const response = await axios.post(
            `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-califications`,
            { eventId: selectedEvent.eventId, calificationList: calificationRegistrationInfo },
            { headers: { Authorization: `Bearer ${auth0Token}` } }
        ).catch(error => error);

        if (response.status !== 200) {
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
        } else {
            let updatedDuplicated = [...duplicatedStudentsList];
            response.data.ok.forEach(registeredStudentDossier => {
                let registeredStudent = okStudentsList.find(student => student.dossier === registeredStudentDossier);
                if (registeredStudent) registeredStudent.state = "Registrado";

                let duplicatedStudent = updatedDuplicated.find(student => student.dossier === registeredStudentDossier);
                if (duplicatedStudent && duplicatedStudent.overwrite) {
                    duplicatedStudent.state = `Sobrescrito (Anterior: ${duplicatedStudent.oldCalification} -> Actual: ${duplicatedStudent.newCalification})`;
                }
            });
            setDuplicatedStudentsList(updatedDuplicated);

            if (response.data.nok !== undefined) {
                response.data.nok.forEach(notRegisteredStudentInfo => {
                    let notRegisteredStudent = okStudentsList.find(student => student.dossier === notRegisteredStudentInfo.dossier);
                    switch (notRegisteredStudentInfo.errorCode) {
                        case 1: notRegisteredStudent.state = "No registrado: el legajo no existe en sistema."; break;
                        case 2: notRegisteredStudent.state = "No registrado: calificación ya registrada."; break;
                    };
                });
            }

            setTableManualUpdateTrigger(!tableManualUpdateTrigger);
        }
    }

    const handleSendEmail = async () => {
        if (!selectedEvent) return;
        setEmailSendState('sending');
        try {
            const auth0Token = await getAccessTokenSilently();
            await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/send-grades-email`,
                null,
                { params: { 'event-id': selectedEvent.eventId }, headers: { Authorization: `Bearer ${auth0Token}` } }
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

    const handleSheetNameValueChange = event => {
        const val = event.target.value;
        if (val !== "SELECCIONAR PESTAÑA") {
            setSheetNameValue(val);
            const suggestedRange = spreadsheetManipulator.getSuggestedRange(val);
            if (suggestedRange) {
                setCellRangeName(suggestedRange);
                const cellRangeInput = document.getElementById("cell-range");
                if (cellRangeInput) cellRangeInput.value = suggestedRange;
                saveSpreadsheetData('group-califications', { sheetNameValue: val, cellRangeName: suggestedRange });
            } else {
                saveSpreadsheetData('group-califications', { sheetNameValue: val });
            }
        } else {
            setSheetNameValue("");
            saveSpreadsheetData('group-califications', { sheetNameValue: "" });
        }
    }

    const handleTemplateDownload = async () => {
        try {
            const token = await getAccessTokenSilently();
            const groupsResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-student-groups`,
                { params: { courseId: course.getId() }, headers: { Authorization: `Bearer ${token}` } }
            );
            const groups = groupsResponse.data.groups || [];

            let comment = "Números del 1 al 10, o A/A-/D, o dejar en blanco para indicar ausencia.";
            let sheetComments = [["A2", comment]];
            let sheetContent = [["Grupo", "Calificación"]];
            
            groups.forEach(g => {
                sheetContent.push([g.groupName, ""]);
            });

            spreadsheetManipulator.create(
                "Plantilla de calificaciones por grupos",
                "registro-calificaciones-grupos",
                sheetContent,
                sheetComments
            );
        } catch (error) {
            console.error("Error obteniendo grupos:", error);
            spreadsheetManipulator.create(
                "Plantilla de calificaciones por grupos",
                "registro-calificaciones-grupos",
                [["Grupo", "Calificación"]],
                [["A2", "Números del 1 al 10, o A/A-/D, o dejar en blanco para indicar ausencia."]]
            );
        }
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Registrar/Sobrescribir calificaciones por grupos</h1>
            <h2 className="selected-course-info">
                {course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`}
                {course === null && 'Sin cursada seleccionada'}
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
                <select id="sheet-names" onChange={handleSheetNameValueChange} required></select>
                
                <p>Rango de celdas a cargar (excluir encabezados)</p>
                <input type="text" id="cell-range" placeholder="Ejemplo para cargar los primeros dos registros: A2:B3" onChange={handleCellRangeName} required />
                
                <label htmlFor="events-select"><p>Evento</p></label>
                <select id="events-select" onChange={handleEventSelection} required></select>
                <div id="eventos-container"></div>

                <button type="submit" className="load-button" onClick={handleRangeLoading}>
                    Cargar registros
                </button>
            </form>

            <div><table className="not-valid-format-table table-container not-displayed"></table></div>
            <div><table className="not-ok-students-table table-container not-displayed"></table></div>
            
            {duplicatedStudentsList.length > 0 && (
                <div className="duplicated-students-table-container table-container">
                    <table className="duplicated-students-table">
                        <thead>
                            <tr><td colSpan="7">Alumnos con calificación existente ({duplicatedStudentsList.length})</td></tr>
                            <tr>
                                <td><input type="checkbox" checked={allOverwritesChecked} onChange={handleToggleAllOverwrites} /> Sobrescribir</td>
                                <td>Fila Excel</td>
                                <td>Grupo</td>
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
                                    <td>{student.groupName}</td>
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

            {!registerButtonEnabled && selectedEvent && (
                <div style={{ marginTop: '1rem' }}>
                    {emailSendState === 'idle' && (
                        <button type="button" onClick={handleSendEmail}>Enviar calificaciones por email</button>
                    )}
                    {emailSendState === 'sending' && (
                        <p className="send-email-status send-email-status--sending">Envío de calificaciones: Enviando correos en segundo plano...</p>
                    )}
                    {emailSendState === 'sent' && (
                        <p className="send-email-status send-email-status--sent">Envío de calificaciones: El envío fue iniciado. Los alumnos recibirán su calificación en breve.</p>
                    )}
                    {emailSendState === 'error' && (
                        <>
                            <button type="button" onClick={handleSendEmail}>Reintentar envío</button>
                            <p className="send-email-status send-email-status--error">Envío de calificaciones: Hubo un error. Intentá nuevamente.</p>
                        </>
                    )}
                </div>
            )}
        </PageLayout>
    );
}
