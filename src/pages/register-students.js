// Imports externos.
import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";

// Imports internos.
import { PageLayout } from "../components/page-layout";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Estilos.
import "../styles/components/table.css";
import "../styles/register-students.css";

export function StudentRegistering() {
    const [fileName, setFileName] = useState("");
    const [fileHandle, setFileHandle] = useState(null);
    const [sheetNameValue, setSheetNameValue] = useState("");
    const [cellRangeName, setCellRangeName] = useState("");
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    const [okStudentsList, setOkStudentsList] = useState([]);
    const [notOkStudentsList, setNotOkStudentsList] = useState([]);
    const [invalidRegistersList, setInvalidRegistersList] = useState([]);
    const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);
    const [error, setError] = useState(null);
    const { getAccessTokenSilently } = useAuth0();

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
                        "_row:Fila",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "surname:Apellido",
                        "email:Email",
                        "formatInfo:Error de formato",
                    ],
                    tableRows: invalidRegistersList,
                    columnClasses: [
                        "_row:centered",
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
                    columnNames: [
                        "_row:Fila",
                        "dossier:Legajo",
                        "errorDescription:Descripción del error",
                    ],
                    tableRows: notOkStudentsList,
                    columnClasses: [
                        "_row:centered",
                    ],
                },
                `Legajos que no se pueden registrar (${notOkStudentsList.length})`
            );
            notOkStudentsTable.classList.remove("not-displayed");
        } else notOkStudentsTable.classList.add("not-displayed");

        // Actualiza la tabla de estudiantes que están aptos para ser registrados.
        let okStudentsTable = document.getElementsByClassName(
            "ok-students-table"
        )[0];
        let okStudentsTableContainer = document.getElementsByClassName(
            "ok-students-table-container"
        )[0];
        if (okStudentsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                okStudentsTable,
                {
                    columnNames: [
                        "_row:Fila",
                        "state:Estado",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "surname:Apellido",
                        "email:Email",
                    ],
                    tableRows: okStudentsList,
                    columnClasses: [
                        "_row:centered",
                        "state:wrapped",
                    ],
                },
                `Estudiantes para registrar en la comisión (${okStudentsList.length})`
            );
               okStudentsTableContainer.classList.remove("not-displayed");
        } else okStudentsTableContainer.classList.add("not-displayed");

    }, [okStudentsList, notOkStudentsList, invalidRegistersList, tableManualUpdateTrigger]);

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

        /*** Procedimiento: HU003.001.001/CU01. ***/

        // Evita que se ejecute la llamada del submit.
        event.preventDefault();

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
                "surname",
                "email",
            ]);

            // Obtiene el rango seleccionado del Excel.
            let readRange = spreadsheetManipulator.getLastReadRange();

            // Separa los registros con formato incorrecto.
            let validFormatRange = [];
            let invalidFormatRange = [];
            readRange.data.forEach(row => {

                // 1c.A.
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
                    typeof row.surname !== 'string'
                    ||
                    !properNameRegEx.exec(row.surname)
                ) {
                    row.formatInfo = "El apellido no es alfabético.";
                    invalidFormat = true;
                } else if (
                    typeof row.email !== 'string'
                    ||
                    !emailRegEx.exec(row.email.trim())
                ) {
                    row.formatInfo = "El mail no tiene el formato adecuado.";
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
            /** @type {Array.<number>} */ const dossierArray = validFormatRange.map(
                element => element["dossier"]
            );

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

            // 2
            const studentsCheckedInfo = await axios
                .post(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/new-dossiers-check`,
                    {
                        dossiersList: dossierArray,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                )
                .then(okReponse => okReponse)
                .catch(error => error.response);

            // 2.A
            if (studentsCheckedInfo.status !== 200) {
                
                // 2.A.1
                // Guarda el mensaje de error traído del back al usuario, y
                // en el próximo renderizado se mostrará el mensaje.
                setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

            } else {

                // 1c.A.1
                setInvalidRegistersList(
                    invalidFormatRange
                );

                // 4
                setOkStudentsList(
                    studentsCheckedInfo.data.ok.map(
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
                            studentInfo.surname = studentLoadedData.surname.trim();
                            studentInfo.email = studentLoadedData.email.trim();

                            // Agrega el estado de registración en sistema.
                            studentInfo.state = 'Pendiente';

                            return studentInfo;

                        }
                    )
                );

                // 3.A.1
                setNotOkStudentsList(
                    studentsCheckedInfo.data.nok.map(
                        dossierInfo => {

                            // Establece el mensaje de error, según el código.
                            let errorDescription;
                            switch (dossierInfo.errorCode) {
                                case 1:
                                    errorDescription = "El legajo ya está registrado en el sistema.";
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
                );

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
        setOkStudentsList([]);
        setNotOkStudentsList([]);
        setInvalidRegistersList([]);

        // Carga el archivo Excel.
        spreadsheetManipulator.loadFile(file, loadSheetNames);

        // Permite que se vuelva a cargar el mismo archivo.
        const inputElement = document.getElementById("file");
        inputElement.value = '';

    };

    /**
     * Manejador del evento de cambio del campo de selección
     * de nombre de pestaña.
     */
    const handleSheetNameValueChange = event => {
        setSheetNameValue(event.target.value);
    };

    /** 
     * Manejador del evento de cambio del campo de rango.
     */
    const handleCellRangeName = event => {
        setCellRangeName(event.target.value.toUpperCase());
    };

    /**
     * Manejador del evento clic en el botón de registración
     * masiva de alumnos a cursada.
     */
    const handleRegistering = async () => {

        /*** Procedimiento: HU003.001.001/CU01. ***/

        // Prepara la lista de estudiantes para ser enviada.
        const studentsRegistrationInfo = okStudentsList
            .map(studentRegistrationInfo => {
                return {
                    dossier: studentRegistrationInfo.dossier,
                    id: studentRegistrationInfo.id,
                    name: studentRegistrationInfo.name,
                    surname: studentRegistrationInfo.surname,
                    email: studentRegistrationInfo.email,
                }
            });

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // 6
        // Realiza la solicitud al endpoint para registrar la calificación.
        const response = await axios
            .post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/register-students`,
                {
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

        // 6.A
        if (response.status !== 200) {
            
            // 6.A.1
            // Guarda el mensaje de error traído del back al usuario y,
            // en el próximo renderizado, se mostrará el mensaje.
            setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");

        } else {

            // 3
            // El front inserta un símbolo en la primera columna de cada registro para indicar
            // que se registró en el sistema. [usar okStudentsList y notOkStudentsList]

            // Actualiza la información de los estudiantes que se registraron correctamente.
            response.data.ok.forEach(registeredStudentDossier => {
                let registeredStudent = okStudentsList
                    .find(student => student.dossier === registeredStudentDossier);
                registeredStudent.state = "Registrado";
            });

            // Actualiza la información de los estudiantes que no se registraron correctamente.
            response.data.nok.forEach(notRegisteredStudentInfo => {
                let notRegisteredStudent = okStudentsList
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

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Alta de estudiantes
            </h1>
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
                <p>{fileName}</p>
                <p>Nombre de la pestaña en la planilla</p>
                <select
                    id="sheet-names"
                    onChange={handleSheetNameValueChange}
                    required
                >
                </select>
                <p>Rango de celdas a cargar</p>
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
                <table className="not-ok-students-table table-container not-displayed"></table>
            </div>
            <div className="ok-students-table-container table-container not-displayed">
                <table className="ok-students-table"></table>
                <button
                    type="button"
                    className="register-student-button"
                    onClick={handleRegistering}
                >
                    Registrar estudiantes
                </button>
            </div>
        </PageLayout>
    );

}
