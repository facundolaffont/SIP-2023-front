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

    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);

    const [error, setError] = useState(null);

    const { getAccessTokenSilently } = useAuth0();
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

    const history = useHistory();

    // Condición que se cumple si todavía no se seleccionó una cursada, o
    // si se actualiza la página, ya que se pierde el contexto de la
    // selección que se había hecho.
    useEffect(() => { console.debug("debug");

        // Redirige a la página de selección de cursada.
        if (course === null) history.push('/profile?course-missing');

    }, []);

    // Actualiza el estado del botón de registración.
    useEffect(() => { console.debug("debug");

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

    // Actualiza las tablas.
    useEffect(() => { console.debug("debug");

        // Actualiza la tabla de registros con formato incorrecto.
        let notValidFormatTable = document.getElementsByClassName(
            "not-valid-format-table"
        )[0];
        if (invalidRegistersList.length !== 0) {

            // Inserta los datos en la tabla.
            HTMLTableManipulator.insertDataIntoTable(
                notValidFormatTable,
                {
                    columnNames: [
                        "_row:Fila",
                        "formatInfo:Error de formato",
                    ],
                    tableRows: invalidRegistersList,
                    columnClasses: [
                        "_row:id",
                    ],
                },
                `Registros con formato inválido (${invalidRegistersList.length})`
            );

            // Muestra la tabla.
            notValidFormatTable.classList.remove("not-displayed");

        } else notValidFormatTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que no están aptos para ser registrados.
        let notOkStudentsTable = document.getElementsByClassName(
            "not-ok-table"
        )[0];
        if (notOkList.length !== 0) {

            // Inserta los datos en la tabla.
            HTMLTableManipulator.insertDataIntoTable(
                notOkStudentsTable,
                {
                    columnNames: [
                        "_row:Fila",
                        "dossier:Legajo",
                        "errorDescription:Descripción del error",
                    ],
                    tableRows: notOkList,
                    columnClasses: [
                        "_row:id centered",
                    ],
                },
                `Legajos que no se pueden registrar (${notOkList.length})`
            );

            // Muestra la tabla.
            notOkStudentsTable.classList.remove("not-displayed");

        } else notOkStudentsTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que están aptos para ser registrados.
        let okStudentsTableContainer = document.getElementsByClassName(
            "ok-table-container"
        )[0];
        if (okList.length !== 0) {

            // Obtiene el manejador de la tabla.
            let okStudentsTable = document.getElementsByClassName(
                "ok-table"
            )[0];

            // Inserta en la tabla los registros de estudiantes que no están registrados en
            // sistema (mostrando la misma información cargada del Excel), y también
            // muestra los registros de estudiantes que están registrados en sistema pero no
            // están vinculadas con la cursada (mostrando la información traída del backend).
            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    columnNames: [
                        "_row:Fila",
                        "state:Estado",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "email:Email",
                        "allPreviousSubjectsApproved:Correlativas",
                        "alreadyStudied:Recursante",
                    ],
                    tableRows: okList,
                    columnClasses: [
                        "_row:id centered",
                        "state:wrapped",
                    ],
                },
                `Estudiantes para registrar en la comisión (${okList.length})`
            );

            // Muestra la tabla.
            okStudentsTableContainer.classList.remove("not-displayed");

        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okList, notOkList, invalidRegistersList, tableManualUpdateTrigger]);

    // Actualiza el mensaje de error que se mostrará al usuario.
    useEffect(() => { console.debug("debug");

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
    useState(() => { console.debug("debug");
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    /**
     * Manejador del evento que surge cuando se carga un
     * nuevo archivo con el explorador de archivos.
     *
     * @param {Event} event Evento de cambio de la etiqueta input.
     */
    const handleFileSelection = event => { console.debug("debug");

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

    /**
     * Manejador del evento clic en el botón de carga de archivo a memoria.
     *
     * Carga el archivo de la planilla a memoria y llama a la función que
     * cargará, también a memoria, un rango específico de la planilla.
     *
     * @param {Event} event Evento de clic.
     */
    const handleRangeLoading = async event => { console.debug("debug");

        // Evita que se ejecute la llamada del submit.
        event.preventDefault();

        // Habilita el botón de registración.
        setRegisterButtonEnabled(true);

        // Notifica al usuario si el rango no fue ingresado.
        if (cellRangeName === "") {

            setError("El campo 'Rango de celdas a cargar' no puede estar vacío.");

        } else if (!cellRangeName.match("[A-Z]+[0-9]+:[A-Z]+[0-9]+")) {

            setError("El campo 'Rango de celdas a cargar' no tiene un formato válido; debe ser '&lt;letras&gt;&lt;números&gt;:&lt;letras&gt;&lt;números&gt;'.");

        } else {

            // Limpia el eventual mensaje de error que se encuentre en pantalla.
            setError(null);

            // Lee un rango de celdas.
            spreadsheetManipulator.loadRange(sheetNameValue, cellRangeName, [
                "dossier",
                "id",
                "name",
                "email",
                "allPreviousSubjectsApproved",
                "alreadyStudied",
            ]);

            // Obtiene el rango seleccionado del Excel.
            let readRange = spreadsheetManipulator.getLastReadRange();

            // Separa los registros con formato incorrecto.
            let validFormatRange = [];
            let invalidFormatRange = [];
            readRange.data.forEach(row => {

                // Determina si el formato es inválido y añade una descripción del problema.
                let emailRegEx = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
                let properNameRegEx = /[a-zA-Z ]+/;
                let invalidFormat = false;
                if (
                    typeof row.dossier !== 'number'
                    ||
                    row.dossier <= 0
                ) {
                    row.formatInfo = "El legajo no es un entero positivo.";
                    invalidFormat = true;
                } else if (
                    typeof row.id !== 'number'
                    ||
                    row.id <= 0
                ) {
                    row.formatInfo = "El dni no es un entero positivo.";
                    invalidFormat = true;
                } else if (
                    typeof row.name !== 'string'
                    ||
                    !properNameRegEx.exec(row.name)
                ) {
                    row.formatInfo = "El nombre no es alfabético.";
                    invalidFormat = true;
                } else if (
                    typeof row.email !== 'string'
                    ||
                    !emailRegEx.exec(row.email.trim())
                ) {
                    row.formatInfo = "El mail no tiene el formato adecuado.";
                    invalidFormat = true;
                } else if (!(
                    row.alreadyStudied.trim() === ''
                    ||
                    row.alreadyStudied.trim().toLowerCase() === 'x'
                )) {
                    row.formatInfo = "El campo de recursante debe estar vacío o debe contener el valor 'x'.";
                    invalidFormat = true;
                } else {

                    // 202503231645 - Marca los registros con campos duplicados.

                    let duplicateMask = 0;
                    for (const element of readRange.data) {
                        
                        if(row._row !== element._row) {
                            if(row.dossier === element.dossier) duplicateMask |= 1; // 001
                            if(row.id === element.id) duplicateMask |= 2; // 010
                            if(row.email === element.email) duplicateMask |= 4; // 100
                        }

                    }

                    if(duplicateMask) invalidFormat = true;
                    switch(duplicateMask) {
                        case 1: // 001
                            row.formatInfo = "El legajo está duplicado.";
                            break;
                        case 2: // 010
                            row.formatInfo = "El DNI está duplicado.";
                            break;
                        case 3: // 011
                            row.formatInfo = "El legajo y DNI están duplicados.";
                            break;
                        case 4: // 100
                            row.formatInfo = "El email está duplicado.";
                            break;
                        case 5: // 101
                            row.formatInfo = "El legajo y email están duplicado.";
                            break;
                        case 6: // 110
                            row.formatInfo = "El DNI y email están duplicados.";
                            break;
                        case 7: // 111
                            row.formatInfo = "El legajo, DNI y email están duplicados.";
                            break;
                    }

                    // 202503231645
                
                }

                // Separa los registros con formato válido de los que tienen formato inválido.
                if (invalidFormat) {
                    invalidFormatRange.push(row);
                } else {
                    validFormatRange.push(row);
                }

            });

            // Guarda los registros con formato correcto en un arreglo.
            /** @type {Array.<number>} */ const newStudentsArray = validFormatRange.map(
                element => ({
                    "dossier": element["dossier"],
                    "id": element["id"],
                    "email": element["email"]
                })
            );

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

            const checkedInfo = await axios
                .post(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/new-students-check`,
                    {
                        courseId: course.getId(),
                        studentsList: newStudentsArray,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                )
                .then(okReponse => okReponse)
                .catch(error => error.response);

            if (checkedInfo.status !== 200) {
                
                // Guarda el mensaje de error traído del back al usuario, y
                // en el próximo renderizado se mostrará el mensaje.
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

            } else {

                setInvalidRegistersList(
                    invalidFormatRange
                );

                // 202503232333 - Guarda información de los estudiantes que pueden ser registrados, ya sea porque no están
                // registrados en sistema ni vinculados con la cursada, o porque están registrados en sistema
                // pero no están vinculados con la cursada. {

                // Crea el arreglo que contendrá la información de ambos tipos de estudiantes.
                let okListData = {};

                // Se agregan los estudiantes que no existen en sistema.
                okListData = [...
                    checkedInfo.data.nonExistingDossiers.map(
                        dossier => {

                            // Obtiene el registro de readRange que tiene mismo legajo.
                            let studentLoadedData = readRange.data.find(
                                register => register.dossier == dossier
                            );

                            // Une la información traída del back con la que se cargó del Excel.
                            let studentInfo = {dossier: dossier};
                            studentInfo._row = studentLoadedData._row;
                            studentInfo.id = studentLoadedData.id;
                            studentInfo.name = studentLoadedData.name.trim();
                            studentInfo.email = studentLoadedData.email.trim();
                            studentInfo.alreadyStudied = studentLoadedData.alreadyStudied.trim().toLowerCase();
                            studentInfo.allPreviousSubjectsApproved =
                                String(studentLoadedData.allPreviousSubjectsApproved).trim().length !== 0
                                ? 'P'
                                : false;

                            // Agrega el estado de registración en sistema.
                            studentInfo.state = 'Pendiente';

                            return studentInfo;

                        }
                    )
                ];

                // Se agregan los estudiantes que existen en sistema, pero que no están
                // vinculados con la cursada.
                okListData.push(...
                    checkedInfo.data.existingStudents.map(
                        registeredInfoOfStudent => {

                            // Obtiene el registro de readRange que tiene mismo legajo.
                            let studentLoadedData = readRange.data.find(
                                register => register.dossier == registeredInfoOfStudent.dossier
                            );

                            // Une la información traída del back con la que se cargó del Excel.
                            let studentInfo = {dossier: registeredInfoOfStudent.dossier};
                            studentInfo._row = studentLoadedData._row;
                            studentInfo.id = registeredInfoOfStudent.id;
                            studentInfo.name = registeredInfoOfStudent.name.trim();
                            studentInfo.email = registeredInfoOfStudent.email.trim();
                            studentInfo.alreadyStudied = studentLoadedData.alreadyStudied.trim().toLowerCase();
                            studentInfo.allPreviousSubjectsApproved =
                                String(studentLoadedData.allPreviousSubjectsApproved).trim().length !== 0
                                ? 'P'
                                : false;

                            // Agrega el estado de registración en sistema.
                            studentInfo.state = 'Pendiente (v)';

                            return studentInfo;

                        }
                    )
                );

                // Ordena el arreglo, y asigna el arreglo a la variable que permite mostrarlo en pantalla.
                okListData = okListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setOkList(okListData);

                // } 202503232333

                let notOkListData = checkedInfo.data.nok.map(
                    dossierInfo => {

                        // Establece el mensaje de error, según el código.
                        let errorDescription;
                        switch (dossierInfo.errorCode) {
                            case 1:
                                errorDescription = "El legajo ya está registrado en el sistema.";
                                break;
                            case 2:
                                errorDescription = "El DNI ya está registrado en el sistema.";
                                break;
                            case 4:
                                errorDescription = "El email ya está registrado en el sistema."
                                break;
                        }
                        
                        // Obtiene el registro de readRange que tiene mismo legajo.
                        let studentLoadedData = readRange.data.find(
                            register => register.dossier == dossierInfo.dossier
                        );

                        // Indica el objeto que va a formar parte del arreglo. 
                        return {
                            _row: studentLoadedData._row,
                            dossier: dossierInfo.dossier,
                            errorDescription: errorDescription,
                        };

                    }
                )

                // Ordena el arreglo, y asigna el arreglo a la variable que permite mostrarlo en pantalla.
                notOkListData = notOkListData.sort((a, b) => parseInt(a._row) - parseInt(b._row));
                setNotOkList(notOkListData);

            }

        }

    };

    /**
     * Carga los nombres de pestaña para que sean seleccionados.
     */
    const loadSheetNames = () => { console.debug("debug");
        
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
     * Manejador del evento de cambio del campo de selección
     * de nombre de pestaña.
     */
    const handleSheetNameValueChange = event => { console.debug("debug");

        if(event.target.value !== "SELECCIONAR PESTAÑA") 
            setSheetNameValue(event.target.value);
        else setSheetNameValue("");

    };

    /** 
     * Manejador del evento de cambio del campo de rango.
     */
    const handleCellRangeName = event => { console.debug("debug");
        setCellRangeName(event.target.value.toUpperCase());
    };

    /**
     * Manejador del evento clic en el botón de registración
     * masiva de alumnos a cursada.
     */
    const handleRegistering = async () => { console.debug("debug");

        // Inhabilita el botón de registración.
        setRegisterButtonEnabled(false);

        // Prepara la lista de estudiantes para ser enviada.
        const studentsRegistrationInfo = okList
            .map(studentRegistrationInfo => {
                return {
                    dossier: studentRegistrationInfo.dossier,
                    id: studentRegistrationInfo.id,
                    name: studentRegistrationInfo.name,
                    email: studentRegistrationInfo.email,
                    alreadyStudied:
                        studentRegistrationInfo.alreadyStudied == 'x'
                        ? true
                        : false,
                    allPreviousSubjectsApproved:
                        studentRegistrationInfo.allPreviousSubjectsApproved == 'P'
                        ? true
                        : false,
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
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/register-students`,
                {
                    courseId: course.getId(),
                    newStudentsList: studentsRegistrationInfo,
                },
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .then(okResponse => okResponse)
            .catch(error => error);

        // Si la petición no fue exitosa, se muestra un mensaje de error.
        if (response.status !== 200) {
            
            // Guarda el mensaje de error traído del back al usuario y,
            // en el próximo renderizado, se mostrará el mensaje.
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

        // Si la petición fue exitosa, se actualiza la información de los estudiantes.
        } else {

            // Actualiza la información de los estudiantes que se registraron correctamente.
            response.data.ok.forEach(registeredStudentDossier => {
                let registeredStudent = okList
                    .find(student => student.dossier === registeredStudentDossier);
                registeredStudent.state = "Registrado";
            });

            // Actualiza la información de los estudiantes que no se registraron correctamente.
            response.data.nok.forEach(notRegisteredStudentInfo => {
                let notRegisteredStudent = okList
                    .find(student => student.dossier === notRegisteredStudentInfo.dossier);
                switch(notRegisteredStudentInfo.errorCode) {
                    case 1: notRegisteredStudent.state = "No registrado: el legajo ya existe en sistema.";
                        break;
                };
            });

            // Actualiza la información de la tabla.
            setTableManualUpdateTrigger(!tableManualUpdateTrigger);
            
        }

    };

    const handleTemplateDownload = () => { console.debug("debug");

        // Define el contenido de la plantilla.
        let sheetContent = [
            ["Legajo", "DNI", "Nombre", "Mail", "Correlativas", "Recursante"],
            [192656, 24977506, "WALTER JAVIER ALAMO", "walterjalamo@hotmail.com", "P", "x"],
        ];

        // Crea y descarga la plantilla.
        spreadsheetManipulator.create(
            "Plantilla de alta de estudiantes",
            "alta-alumnos",
            sheetContent
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Registrar estudiantes
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
                    placeholder="Ejemplo para cargar los primeros dos registros: A2:F3"
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
                    className="register-button"
                    onClick={handleRegistering}
                >
                    Registrar estudiantes
                </button>
            </div>
        </PageLayout>
    );

}
