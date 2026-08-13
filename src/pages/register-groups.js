// Componentes externos.
import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import { useHistory } from 'react-router-dom';
import toast from "react-hot-toast";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o.js";

// Estilos.
import "../styles/components/table.css";
import "../styles/register-groups.css";

export function GroupRegistering() {

    const [fileName, setFileName] = useState("");
    const [fileHandle, setFileHandle] = useState(null);

    const [sheetNameValue, setSheetNameValue] = useState("");
    const [cellRangeName, setCellRangeName] = useState("");
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [registerButtonEnabled, setRegisterButtonEnabled] = useState(true);

    const [okList, setOkList] = useState([]);
    const [nokList, setNokList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);
    const [withoutGroupList, setWithoutGroupList] = useState([]);

    // Para manejar duplicados (alumnos que ya tienen grupo asignado).
    const [duplicatedList, setDuplicatedList] = useState([]);
    const [allOverwritesChecked, setAllOverwritesChecked] = useState(false);

    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);

    const [error, setError] = useState(null);

    const { getAccessTokenSilently } = useAuth0();

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una.
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    useEffect(() => {
        const registerButton = document.getElementsByClassName("register-button")[0];
        if (registerButton) {
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

        let notOkTable = document.getElementsByClassName("not-ok-table")[0];
        if (nokList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                notOkTable,
                {
                    columnNames: ["_row:Fila", "dossier:Legajo", "errorDescription:Descripción del error"],
                    tableRows: nokList,
                    columnClasses: ["_row:id centered"],
                },
                `Legajos que no se pueden asociar a un grupo (${nokList.length})`
            );
            notOkTable.classList.remove("not-displayed");
        } else notOkTable.classList.add("not-displayed");

        let okTableContainer = document.getElementsByClassName("ok-table-container")[0];
        if (okList.length !== 0) {
            let okTable = document.getElementsByClassName("ok-table")[0];
            HTMLTableManipulator.insertDataIntoTable(
                okTable,
                {
                    columnNames: ["_row:Fila", "state:Estado", "dossier:Legajo", "name:Nombre", "groupName:Grupo"],
                    tableRows: okList,
                    columnClasses: ["_row:id centered", "state:wrapped"],
                },
                `Estudiantes para asignar grupo (${okList.length})`
            );
            okTableContainer.classList.remove("not-displayed");
        } else okTableContainer.classList.add("not-displayed");

    }, [okList, nokList, invalidRegistersList, tableManualUpdateTrigger]);

    useEffect(() => {
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];
        if (error === null) {
            msgContainer.classList.add("not-displayed");
        } else {
            setOkList([]);
            setNokList([]);
            setInvalidRegistersList([]);
            setDuplicatedList([]);
            setWithoutGroupList([]);
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
        setNokList([]);
        setInvalidRegistersList([]);
        setDuplicatedList([]);
        setWithoutGroupList([]);
        setAllOverwritesChecked(false);

        spreadsheetManipulator.loadFile(file, loadSheetNames);
        document.getElementById("file").value = '';
    };

    // Handlers de Sobreescritura (mismo patrón que register-students).
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
                "dossier", "groupName",
            ]);

            let readRange = spreadsheetManipulator.getLastReadRange();
            let validFormatRange = [];
            let invalidFormatRange = [];

            // Validación de formato.
            readRange.data.forEach(row => {
                let invalidFormat = false;

                if (isNaN(row.dossier) || row.dossier <= 0) {
                    row.formatInfo = "El legajo no es un entero positivo."; invalidFormat = true;
                } else if (row.groupName === undefined || row.groupName === null) {
                    // Si el grupo está vacío, se permite pero se advertirá luego.
                    row.groupName = "";
                }

                // Convertir groupName a string por si viene como número desde Excel.
                if (!invalidFormat) {
                    row.groupName = String(row.groupName).trim();
                }

                if (invalidFormat) {
                    invalidFormatRange.push(row);
                } else {
                    validFormatRange.push(row);
                }
            });

            // Arma la lista para enviar al backend.
            const groupEntriesArray = validFormatRange.map(element => ({
                "dossier": element["dossier"],
                "groupName": element["groupName"]
            }));

            const auth0Token = await getAccessTokenSilently().catch(error => { throw error; });

            const checkedInfo = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/check-student-groups`,
                { courseId: course.getId(), groupEntries: groupEntriesArray },
                { headers: { Authorization: `Bearer ${auth0Token}` } }
            ).then(okResponse => okResponse).catch(error => error.response);

            if (checkedInfo.status !== 200) {
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
            } else {
                setInvalidRegistersList(invalidFormatRange);

                // Lista OK: alumnos que no tenían grupo.
                let okListData = checkedInfo.data.ok.map(entry => {
                    let studentLoadedData = readRange.data.find(r => r.dossier == entry.dossier);
                    return {
                        dossier: entry.dossier,
                        _row: studentLoadedData ? studentLoadedData._row : '?',
                        name: entry.name,
                        groupName: entry.groupName,
                        state: 'Pendiente'
                    };
                });
                okListData = okListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setOkList(okListData);

                // Lista NOK: legajos con errores.
                let nokListData = [];
                if (checkedInfo.data.nok !== undefined) {
                    checkedInfo.data.nok.forEach(nokEntry => {
                        let studentLoadedData = readRange.data.find(r => r.dossier == nokEntry.dossier);
                        nokListData.push({
                            _row: studentLoadedData ? studentLoadedData._row : '?',
                            dossier: nokEntry.dossier,
                            errorDescription: nokEntry.errorDescription,
                        });
                    });
                }
                nokListData = nokListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setNokList(nokListData);

                // Lista Duplicados: alumnos que ya tienen grupo asignado.
                let duplicateListData = [];
                if (checkedInfo.data.duplicated !== undefined) {
                    checkedInfo.data.duplicated.forEach(dupEntry => {
                        let studentLoadedData = readRange.data.find(r => r.dossier == dupEntry.dossier);
                        duplicateListData.push({
                            _row: studentLoadedData ? studentLoadedData._row : '?',
                            dossier: dupEntry.dossier,
                            name: dupEntry.name,
                            groupName: dupEntry.groupName,
                            oldGroupName: dupEntry.oldGroupName,
                            overwrite: false,
                            state: "Pendiente"
                        });
                    });
                }
                duplicateListData = duplicateListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setDuplicatedList(duplicateListData);
                setAllOverwritesChecked(false);

                // Lista sin grupo: alumnos cuya celda de grupo estaba vacía.
                if (checkedInfo.data.withoutGroup !== undefined) {
                    setWithoutGroupList(checkedInfo.data.withoutGroup);
                }
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
        if (event.target.value !== "SELECCIONAR PESTAÑA")
            setSheetNameValue(event.target.value);
        else setSheetNameValue("");
    };

    const handleCellRangeName = event => {
        setCellRangeName(event.target.value.toUpperCase());
    };

    const handleRegistering = async () => {
        setRegisterButtonEnabled(false);

        // Unimos Lista OK + Duplicados marcados para sobreescribir.
        const entriesToRegister = [
            ...okList.map(s => ({ dossier: s.dossier, groupName: s.groupName })),
            ...duplicatedList.filter(s => s.overwrite).map(s => ({ dossier: s.dossier, groupName: s.groupName }))
        ];

        const auth0Token = await getAccessTokenSilently().catch(error => { throw error; });

        const response = await axios.post(
            `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-student-groups`,
            { courseId: course.getId(), groupEntries: entriesToRegister },
            { headers: { Authorization: `Bearer ${auth0Token}` } }
        ).then(okResponse => okResponse).catch(error => error);

        if (response.status !== 200) {
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
        } else {
            let updatedDuplicated = [...duplicatedList];

            response.data.ok.forEach(registeredDossier => {
                let okStudent = okList.find(s => s.dossier === registeredDossier);
                if (okStudent) okStudent.state = "Registrado";

                let dupStudent = updatedDuplicated.find(s => s.dossier === registeredDossier);
                if (dupStudent && dupStudent.overwrite) {
                    dupStudent.state = "Sobrescrito exitosamente";
                }
            });

            setDuplicatedList(updatedDuplicated);

            if (response.data.nok !== undefined) {
                response.data.nok.forEach(notRegisteredInfo => {
                    let notRegisteredStudent = okList.find(s => s.dossier === notRegisteredInfo.dossier);
                    if (notRegisteredStudent) {
                        notRegisteredStudent.state = "Error al registrar.";
                    }
                });
            }

            setTableManualUpdateTrigger(!tableManualUpdateTrigger);
        }
    };

    const handleTemplateDownload = async () => {
        try {
            const token = await getAccessTokenSilently();

            // 1. Obtener todos los alumnos de la cursada
            const studentsResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-students?courseId=${course.getId()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const studentsList = studentsResponse.data.studentsList || [];

            // 2. Obtener los grupos actuales
            const groupsResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-student-groups`,
                {
                    params: { courseId: course.getId() },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const groups = groupsResponse.data.groups || [];

            // 3. Mapear legajo -> nombre_grupo
            const studentGroupMap = {};
            groups.forEach(g => {
                g.studentDossiers.forEach(dossier => {
                    studentGroupMap[dossier] = g.groupName;
                });
            });

            // 4. Armar el Excel
            let sheetContent = [["Legajo", "Grupo"]];
            studentsList.forEach(student => {
                const currentGroup = studentGroupMap[student.dossier] || "";
                sheetContent.push([student.dossier, currentGroup]);
            });

            spreadsheetManipulator.create("Plantilla de grupos de estudiantes", "grupos-estudiantes", sheetContent);
        } catch (error) {
            console.error("Error obteniendo alumnos/grupos para plantilla:", error);
            let sheetContent = [["Legajo", "Grupo"]];
            spreadsheetManipulator.create("Plantilla de grupos de estudiantes", "grupos-estudiantes", sheetContent);
        }
    };

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Registrar grupos de estudiantes</h1>
            <h2 className="selected-course-info">
                {course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`}
                {course === null && 'Sin cursada seleccionada'}
            </h2>

            <div className="info-msg-container not-displayed">
                <div className="info-msg-desc-container"><p className="info-msg-description"></p></div>
            </div>

            <form>
                <p>Seleccionar archivo con grupos de estudiantes</p>
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
                <input type="text" id="cell-range" placeholder="Ejemplo para cargar los primeros tres registros: A2:B4" onChange={handleCellRangeName} required />

                <button type="submit" className="load-button" onClick={handleRangeLoading}>Cargar registros</button>
            </form>

            <div>
                <table className="not-valid-format-table table-container not-displayed"></table>
            </div>
            <div>
                <table className="not-ok-table table-container not-displayed"></table>
            </div>

            {/* Aviso de alumnos sin grupo asignado en la planilla */}
            {withoutGroupList.length > 0 && (
                <div className="without-group-warning table-container">
                    <p className="warning-text">
                        ⚠️ Los siguientes legajos no tenían grupo asignado en la planilla y serán ignorados: {withoutGroupList.join(', ')}
                    </p>
                </div>
            )}

            {/* Tabla de duplicados (alumnos que ya tienen grupo) */}
            {duplicatedList.length > 0 && (
                <div className="duplicated-students-table-container table-container">
                    <table className="duplicated-students-table">
                        <thead>
                            <tr>
                                <td colSpan="6">Estudiantes que ya tienen grupo asignado ({duplicatedList.length})</td>
                            </tr>
                            <tr>
                                <td><input type="checkbox" checked={allOverwritesChecked} onChange={handleToggleAllOverwrites} /> Sobrescribir</td>
                                <td>Fila / Legajo</td>
                                <td>Nombre</td>
                                <td>Grupo actual ➔ Grupo nuevo</td>
                                <td>Estado</td>
                            </tr>
                        </thead>
                        <tbody>
                            {duplicatedList.map((student, index) => (
                                <tr key={index} className={index % 2 !== 0 ? "even-row" : ""}>
                                    <td><input type="checkbox" checked={student.overwrite} onChange={() => handleToggleOverwrite(student.dossier)} /></td>
                                    <td>{student._row} - {student.dossier}</td>
                                    <td>{student.name}</td>
                                    <td>
                                        {student.oldGroupName === student.groupName
                                            ? student.groupName
                                            : <>{student.oldGroupName} ➔ <b>{student.groupName}</b></>
                                        }
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
                    Registrar/Sobrescribir grupos
                </button>
            )}

        </PageLayout>
    );
}
