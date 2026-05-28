// Componentes externos.
import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import { useHistory } from 'react-router-dom';

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o.js";

// Estilos.
import "../styles/components/table.css";
import "../styles/register-students.css";

export function StudentRegistering() {

    const [fileName, setFileName] = useState("");
    const [fileHandle, setFileHandle] = useState(null);

    const [sheetNameValue, setSheetNameValue] = useState("");
    const [cellRangeName, setCellRangeName] = useState("");
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [registerButtonEnabled, setRegisterButtonEnabled] = useState(true);

    const [okList, setOkList] = useState([]);
    const [notOkList, setNotOkList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);

    // Para manejar duplicados
    const [duplicatedList, setDuplicatedList] = useState([]);
    const [allOverwritesChecked, setAllOverwritesChecked] = useState(false); 

    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);

    const [error, setError] = useState(null);

    const { getAccessTokenSilently } = useAuth0();
    
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    useEffect(() => { 
        const registerButton = document.getElementsByClassName("register-button")[0];
        if(registerButton) {
            if (registerButtonEnabled) {
                registerButton.disabled = false;
                registerButton.classList.remove("disabled");
            } else {
                registerButton.disabled = true;
                registerButton.classList.add("disabled");
            }
        }
    }, [registerButtonEnabled]);

    useEffect(() => { 
        let notValidFormatTable = document.getElementsByClassName("not-valid-format-table")[0];
        if (invalidRegistersList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notValidFormatTable,
                {
                    columnNames: ["_row:Fila", "formatInfo:Error de formato"],
                    tableRows: invalidRegistersList,
                    columnClasses: ["_row:id"],
                },
                `Registros con formato inválido (${invalidRegistersList.length})`
            );
            notValidFormatTable.classList.remove("not-displayed");
        } else notValidFormatTable.classList.add("not-displayed");

        let notOkStudentsTable = document.getElementsByClassName("not-ok-table")[0];
        if (notOkList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notOkStudentsTable,
                {
                    columnNames: ["_row:Fila", "dossier:Legajo", "errorDescription:Descripción del error"],
                    tableRows: notOkList,
                    columnClasses: ["_row:id centered"],
                },
                `Legajos que no se pueden registrar (${notOkList.length})`
            );
            notOkStudentsTable.classList.remove("not-displayed");
        } else notOkStudentsTable.classList.add("not-displayed");

        let okStudentsTableContainer = document.getElementsByClassName("ok-table-container")[0];
        if (okList.length !== 0) {
            let okStudentsTable = document.getElementsByClassName("ok-table")[0];
            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    columnNames: [
                        "_row:Fila", "state:Estado", "dossier:Legajo", "id:DNI", 
                        "name:Nombre", "email:Email", "allPreviousSubjectsApproved:Correlativas", "alreadyStudied:Recursante"
                    ],
                    tableRows: okList,
                    columnClasses: ["_row:id centered", "state:wrapped"],
                },
                `Estudiantes para registrar en la comisión (${okList.length})`
            );
            okStudentsTableContainer.classList.remove("not-displayed");
        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okList, notOkList, invalidRegistersList, tableManualUpdateTrigger]);

    useEffect(() => { 
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];
        if (error === null) {
            msgContainer.classList.add("not-displayed");
        } else {
            setOkList([]);
            setNotOkList([]);
            setInvalidRegistersList([]);
            setDuplicatedList([]); 
            setAllOverwritesChecked(false);

            const errorMsgTextContainer = document.getElementsByClassName("info-msg-description")[0];
            errorMsgTextContainer.innerHTML = error;
            msgContainer.classList.remove("not-displayed");
        }
    }, [error]);

    useState(() => { 
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    const handleFileSelection = event => { 
        const file = event.target.files[0];
        setFileName(file.name);
        setFileHandle(file);

        setError(null);
        setOkList([]);
        setNotOkList([]);
        setInvalidRegistersList([]);
        setDuplicatedList([]);
        setAllOverwritesChecked(false);

        spreadsheetManipulator.loadFile(file, loadSheetNames);
        document.getElementById("file").value = '';
    };

    // NUEVO: Handlers de Sobreescritura
    const handleToggleAllOverwrites = (e) => {
        const isChecked = e.target.checked;
        setAllOverwritesChecked(isChecked);
        setDuplicatedList(duplicatedList.map(s => ({ ...s, overwrite: isChecked })));
    };

    const handleToggleOverwrite = (dossier) => {
        const newList = duplicatedList.map(s =>
            s.dossier === dossier ? { ...s, overwrite: !s.overwrite } : s
        );
        setDuplicatedList(newList);
        setAllOverwritesChecked(newList.length > 0 && newList.every(s => s.overwrite));
    };

    const handleRangeLoading = async event => { 
        event.preventDefault();
        setRegisterButtonEnabled(true);

        if (cellRangeName === "") {
            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");
        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {
            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido...");
        } else {
            setError(null);

            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, [
                "dossier", "id", "name", "email", "allPreviousSubjectsApproved", "alreadyStudied",
            ]);

            let readRange = spreadsheetManipulator.getLastReadRange();
            let validFormatRange = [];
            let invalidFormatRange = [];

            // Validación Regex y Máscaras
            readRange.data.forEach(row => {
                let emailRegEx = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
                let properNameRegEx = /[a-zA-Z ]+/;
                let invalidFormat = false;
                
                if (typeof row.dossier !== 'number' || row.dossier <= 0) {
                    row.formatInfo = "El legajo no es un entero positivo."; invalidFormat = true;
                } else if (typeof row.id !== 'number' || row.id <= 0) {
                    row.formatInfo = "El dni no es un entero positivo."; invalidFormat = true;
                } else if (typeof row.name !== 'string' || !properNameRegEx.exec(row.name)) {
                    row.formatInfo = "El nombre no es alfabético."; invalidFormat = true;
                } else if (typeof row.email !== 'string' || !emailRegEx.exec(row.email.trim())) {
                    row.formatInfo = "El mail no tiene el formato adecuado."; invalidFormat = true;
                } else if (!(row.alreadyStudied.trim() === '' || row.alreadyStudied.trim().toLowerCase() === 'x')) {
                    row.formatInfo = "El campo de recursante debe estar vacío o debe contener el valor 'x'."; invalidFormat = true;
                } else {
                    let duplicateMask = 0;
                    for (const element of readRange.data) {
                        if(row._row !== element._row) {
                            if(row.dossier === element.dossier) duplicateMask |= 1;
                            if(row.id === element.id) duplicateMask |= 2;
                            if(row.email === element.email) duplicateMask |= 4;
                        }
                    }
                    if(duplicateMask) invalidFormat = true;
                    switch(duplicateMask) {
                        case 1: row.formatInfo = "El legajo está duplicado."; break;
                        case 2: row.formatInfo = "El DNI está duplicado."; break;
                        case 3: row.formatInfo = "El legajo y DNI están duplicados."; break;
                        case 4: row.formatInfo = "El email está duplicado."; break;
                        case 5: row.formatInfo = "El legajo y email están duplicado."; break;
                        case 6: row.formatInfo = "El DNI y email están duplicados."; break;
                        case 7: row.formatInfo = "El legajo, DNI y email están duplicados."; break;
                        default: break;
                    }
                }

                if (invalidFormat) {
                    invalidFormatRange.push(row);
                } else {
                    validFormatRange.push(row);
                }
            });

            const newStudentsArray = validFormatRange.map(element => ({
                "dossier": element["dossier"], "id": element["id"], "email": element["email"]
            }));

            const auth0Token = await getAccessTokenSilently().catch(error => { throw error; });

            const checkedInfo = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/new-students-check`,
                { courseId: course.getId(), studentsList: newStudentsArray },
                { headers: { Authorization: `Bearer ${auth0Token}` } }
            ).then(okReponse => okReponse).catch(error => error.response);

            if (checkedInfo.status !== 200) {
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
            } else {
                setInvalidRegistersList(invalidFormatRange);

                let okListData = [];
                okListData = [...checkedInfo.data.nonExistingDossiers, ...checkedInfo.data.existingStudents.map(s => s.dossier)].map(dossier => {
                    let studentLoadedData = readRange.data.find(r => r.dossier == dossier);
                    let isExisting = checkedInfo.data.existingStudents.some(s => s.dossier === dossier);
                    
                    return {
                        dossier: dossier,
                        _row: studentLoadedData._row,
                        id: studentLoadedData.id,
                        name: studentLoadedData.name.trim(),
                        email: studentLoadedData.email.trim(),
                        alreadyStudied: studentLoadedData.alreadyStudied.trim().toLowerCase(),
                        allPreviousSubjectsApproved: String(studentLoadedData.allPreviousSubjectsApproved).trim().length !== 0 ? 'P' : false,
                        state: isExisting ? 'Pendiente (v)' : 'Pendiente'
                    };
                });
                okListData = okListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setOkList(okListData);

                // MODIFICADO: Parseo de Errores vs Duplicados (errorCode === 1)
                let notOkListData = [];
                let duplicateListData = [];

                if (checkedInfo.data.nok !== undefined) {
                    checkedInfo.data.nok.forEach(dossierInfo => {
                        let studentLoadedData = readRange.data.find(r => r.dossier == dossierInfo.dossier);
                        
                        // En tu servicio, errorCode === 1 significa "Ya vinculado con la cursada".
                        if (dossierInfo.errorCode === 1) {
                            duplicateListData.push({
                                _row: studentLoadedData._row,
                                dossier: dossierInfo.dossier,
                                id: studentLoadedData.id,
                                name: studentLoadedData.name.trim(),
                                email: studentLoadedData.email.trim(),
                                alreadyStudied: studentLoadedData.alreadyStudied.trim().toLowerCase(),
                                allPreviousSubjectsApproved: String(studentLoadedData.allPreviousSubjectsApproved).trim().length !== 0 ? 'P' : false,
                                
                                // Datos viejos desde el back
                                oldRecursante: dossierInfo.oldAlreadyStudied ? 'x' : '', 
                                oldCorrelativas: dossierInfo.oldAllPreviousSubjectsApproved ? 'P' : '',
                                oldName: dossierInfo.oldName,
                                oldDni: dossierInfo.oldDni,
                                oldEmail: dossierInfo.oldEmail,

                                overwrite: false,
                                state: "Pendiente"
                            });
                        } else {
                            let errorDescription;
                            switch (dossierInfo.errorCode) {
                                case 2: errorDescription = "El DNI ya existe en el registro de otro alumno."; break;
                                case 4: errorDescription = "El email ya existe en el registro de otro alumno."; break;
                                default: errorDescription = "Error desconocido.";
                            }
                            notOkListData.push({
                                _row: studentLoadedData._row,
                                dossier: dossierInfo.dossier,
                                errorDescription: errorDescription,
                            });
                        }
                    });
                }

                notOkListData = notOkListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setNotOkList(notOkListData);
                
                duplicateListData = duplicateListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setDuplicatedList(duplicateListData);
                setAllOverwritesChecked(false);
            }
        }
    };

    const loadSheetNames = () => { 
        let sheetNamesList = spreadsheetManipulator.getSheetNamesList();
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

    const handleSheetNameValueChange = event => { 
        if(event.target.value !== "SELECCIONAR PESTAÑA") 
            setSheetNameValue(event.target.value);
        else setSheetNameValue("");
    };

    const handleCellRangeName = event => { 
        setCellRangeName(event.target.value.toUpperCase());
    };

    const handleRegistering = async () => { 
        setRegisterButtonEnabled(false);

        // MODIFICADO: Unimos Lista OK + Duplicados marcados para sobreescribir.
        const studentsToRegister = [
            ...okList,
            ...duplicatedList.filter(student => student.overwrite)
        ];

        const studentsRegistrationInfo = studentsToRegister.map(studentInfo => ({
            dossier: studentInfo.dossier,
            id: studentInfo.id,
            name: studentInfo.name,
            email: studentInfo.email,
            alreadyStudied: studentInfo.alreadyStudied === 'x',
            allPreviousSubjectsApproved: studentInfo.allPreviousSubjectsApproved === 'P',
        }));

        const auth0Token = await getAccessTokenSilently().catch(error => { throw error; });

        const response = await axios.post(
            `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/register-students`,
            { courseId: course.getId(), newStudentsList: studentsRegistrationInfo },
            { headers: { Authorization: `Bearer ${auth0Token}` } }
        ).then(okResponse => okResponse).catch(error => error);

        if (response.status !== 200) {
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
        } else {
            let updatedDuplicated = [...duplicatedList];
            
            response.data.ok.forEach(registeredStudentDossier => {
                let okStudent = okList.find(s => s.dossier === registeredStudentDossier);
                if (okStudent) okStudent.state = "Registrado";

                let dupStudent = updatedDuplicated.find(s => s.dossier === registeredStudentDossier);
                if (dupStudent && dupStudent.overwrite) {
                    dupStudent.state = "Sobrescrito exitosamente";
                }
            });
            
            setDuplicatedList(updatedDuplicated);

            if (response.data.nok !== undefined) {
                response.data.nok.forEach(notRegisteredStudentInfo => {
                    let notRegisteredStudent = okList.find(s => s.dossier === notRegisteredStudentInfo.dossier);
                    if (notRegisteredStudent) {
                        notRegisteredStudent.state = "Error al registrar.";
                    }
                });
            }

            setTableManualUpdateTrigger(!tableManualUpdateTrigger);
        }
    };

    const handleTemplateDownload = () => { 
        let sheetContent = [
            ["Legajo", "DNI", "Nombre", "Mail", "Correlativas", "Recursante"],
            [192656, 24977506, "WALTER JAVIER ALAMO", "walterjalamo@hotmail.com", "P", "x"],
        ];
        spreadsheetManipulator.create("Plantilla de alta de estudiantes", "alta-alumnos", sheetContent);
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Registrar estudiantes</h1>
            <h2 className="selected-course-info">
                { course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}` }
                { course === null && 'Sin cursada seleccionada' }
            </h2>
            
            <div className="info-msg-container not-displayed">
                <div className="info-msg-desc-container"><p className="info-msg-description"></p></div>
            </div>
            
            <form>
                <p>Seleccionar archivo de estudiantes</p>
                <div className="label_button">
                    <label htmlFor="file">Cargar archivo</label>
                </div>
                <input type="file" id="file" onChange={handleFileSelection} accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required hidden />
                
                <div className="label_button download-button">
                    <label htmlFor="download-button">Descargar plantilla</label>
                </div>
                <input type="button" id="download-button" onClick={handleTemplateDownload} required hidden />
                <p>{fileName}</p>

                <p>Nombre de la pestaña en la planilla</p>
                <select id="sheet-names" onChange={handleSheetNameValueChange} required></select>
                
                <p>Rango de celdas a cargar (excluir encabezados)</p>
                <input type="text" id="cell-range" placeholder="Ejemplo para cargar los primeros dos registros: A2:F3" onChange={handleCellRangeName} required />
                
                <button type="submit" className="load-button" onClick={handleRangeLoading}>Cargar registros</button>
            </form>

            <div>
                <table className="not-valid-format-table table-container not-displayed"></table>
            </div>
            <div>
                <table className="not-ok-table table-container not-displayed"></table>
            </div>

            {/* Tabla para los duplicados de la cursada */}
            {duplicatedList.length > 0 && (
                <div className="duplicated-students-table-container table-container">
                    <table className="duplicated-students-table">
                        <thead>
                            <tr>
                                <td colSpan="8">Registros ya inscriptos en la cursada ({duplicatedList.length})</td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" checked={allOverwritesChecked} onChange={handleToggleAllOverwrites} /> Sobrescribir</td>
                                <td>Fila / Legajo</td>
                                <td>DNI (Sistema ➔ Excel)</td>
                                <td>Nombre (Sistema ➔ Excel)</td>
                                <td>Email (Sistema ➔ Excel)</td>
                                <td>Recursante</td>
                                <td>Correlativas</td>
                                <td>Estado</td>
                            </tr>
                        </thead>
                        <tbody>
                            {duplicatedList.map((student, index) => (
                                <tr key={index} className={index % 2 !== 0 ? "even-row" : ""}>
                                    <td><input type="checkbox" checked={student.overwrite} onChange={() => handleToggleOverwrite(student.dossier)} /></td>
                                    <td>{student._row} - {student.dossier}</td>
                                    
                                    {/* Comparamos visualmente si hay cambios. Si son iguales, solo muestra uno. */}
                                    <td>
                                        {student.oldDni === student.id ? student.id : <>{student.oldDni} ➔ <b>{student.id}</b></>}
                                    </td>
                                    <td>
                                        {student.oldName === student.name ? student.name : <>{student.oldName} ➔ <b>{student.name}</b></>}
                                    </td>
                                    <td>
                                        {student.oldEmail === student.email ? student.email : <>{student.oldEmail} ➔ <b>{student.email}</b></>}
                                    </td>
                                    
                                    <td>
                                        {(student.oldRecursante === 'x' ? 'Sí' : 'No')} ➔ {(student.alreadyStudied === 'x' ? 'Sí' : 'No')}
                                    </td>
                                    <td>
                                        {(student.oldCorrelativas === 'P' ? 'Sí' : 'No')} ➔ {(student.allPreviousSubjectsApproved === 'P' ? 'Sí' : 'No')}
                                    </td>
                                    <td>{student.state}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="ok-table-container table-container not-displayed">
                <table className="ok-table"></table>
            </div>

            {(okList.length > 0 || duplicatedList.length > 0) && (
                <button
                    type="button"
                    className={"register-button" + (!registerButtonEnabled ? " disabled" : "")}
                    disabled={!registerButtonEnabled}
                    onClick={handleRegistering}
                >
                    Registrar/Sobrescribir estudiantes
                </button>
            )}

        </PageLayout>
    );
}