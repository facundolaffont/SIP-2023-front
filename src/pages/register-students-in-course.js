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
import "../styles/register-students-in-course.css";

export function CourseStudentRegistering() {
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
                        "Legajo:Legajo",
                        "Correlativas:Correlativas",
                        "Recursante:Recursante",
                        "formatInfo:Error de formato",
                    ],
                    tableRows: invalidRegistersList,
                    columnClasses: [
                        "Correlativas:centered",
                        "Recursante:centered",
                    ]
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
                        "dossier:Legajo",
                        "errorDescription:Descripción del error",
                    ],
                    tableRows: notOkStudentsList,
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
                        "state:Estado",
                        "dossier:Legajo",
                        "id:DNI",
                        "name:Nombre",
                        "surname:Apellido",
                        "previousSubjectsApproved:Correlativas",
                        "studiedPreviously:Es recursante",
                    ],
                    tableRows: okStudentsList,
                    columnClasses: [
                        "state:wrapped",
                        "previousSubjectsApproved:centered",
                        "studiedPreviously:centered",
                    ]
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
                "Legajo",
                "Correlativas",
                "Recursante",
            ]);

            /*
             * --- Procedimiento normal ---
             *
             * !0. El usuario indica que quiere cargar un rango de datos de una pestaña de la planilla.
             *
             * 1. Envía al back la lista de legajos al endpoint /api/v1/course/students-registration-check.
             *
             *    dossierList:
             *    - # <numérico> - Legajo
             *    # ...
             *
             * !2. El back procesa los datos y devuelve información que determina (a) cuáles legajos existen ya
             * en sistema y no están registrados en la cursada, (b) cuáles están registrados en sistema y además
             * en la cursada, y (c) cuáles no están registrados en sistema. Esta información es devuelta por el
             * back en formato JSON, con la siguiente estructura (representada en YAML).:
             *
             *    ok:
             *    - dossier: # <numérico> - Legajo
             *      id: # <numérico> - DNI
             *      name: # <texto>
             *      surname: # <texto>
             *    # ...
             *    nok:
             *    - # <numérico> - Legajo
             *    # ...
             *
             * 3. Muestra al usuario en una tabla los registros del rango especificado, junto con los datos
             * traídos del back de los estudiantes que ya están registrados.
             *
             * --- Procedimientos alternativos ---
             *
             * 0.A. Hay registros que no tienen un número en la primera columna, o tienen su segundo o tercer
             * campo con un valor diferente de 'x' o de la cadena vacía.
             *
             *      0.A.1. El sistema muestra la notación A1 de los registros en una tabla independiente.
             *
             * 2.A. El back devuelve legajos que no pueden ser registrados en la cursada indicando el motivo:
             * no existe el legajo o ya está registrado el alumno en la cursada.
             *
             *      2.A.1. El front muestra los legajos y el motivo en una tabla independiente.
             */

            // Obtiene el rango seleccionado del Excel.
            let readRange = spreadsheetManipulator.getLastReadRange();

            // Separa los registros con formato incorrecto.
            let validFormatRange = [];
            let invalidFormatRange = [];
            readRange.data.forEach(row => {

                //// Normaliza los datos.
                //row.Correlativas = row.Correlativas.toLowerCase();
                //row.Recursante = row.Recursante.toLowerCase();

                // Determina si el formato es inválido y añade una descripción del problema.
                let invalidFormat = false;
                if (typeof row.Legajo !== 'number') {
                    row.formatInfo = "El legajo no es un entero.";
                    invalidFormat = true;
                } else if (row.Correlativas !== "" && row.Correlativas !== "x") {
                    row.formatInfo = "El campo que indica si tiene todas las correlativas debe estar marcado por una 'x' o debe estar vacío.";
                    invalidFormat = true;
                } else if (row.Recursante !== "" && row.Recursante !== "x") {
                    row.formatInfo = "El campo que indica si es recursante debe estar marcado por una 'x' o debe estar vacío.";
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
                element => element["Legajo"]
            );

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

            // (1) (2)
            const studentsCheckedInfo = await axios
                .post(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/students/students-registration-check`,
                    {
                        courseId: course.getId(),
                        dossierList: dossierArray,
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

                // La actualización ejecuta (0.A.1)
                setInvalidRegistersList(
                    invalidFormatRange
                );

                // (2.a)
                // La actualización de okStudentsList ejecuta (3)
                setOkStudentsList(
                    studentsCheckedInfo.data.ok.map(
                        studentInfo => {

                            // Obtiene el registro de readRange que tiene mismo legajo.
                            let studentLoadedData = readRange.data.find(
                                register => register.Legajo == studentInfo.dossier
                            );

                            // Une la información traída del back con la que se cargó del Excel.
                            studentInfo.previousSubjectsApproved = 
                                studentLoadedData.Correlativas === 'x'
                                ? true
                                : false;
                            studentInfo.studiedPreviously =
                                studentLoadedData.Recursante === 'x'
                                ? true
                                : false;

                            // Agrega el estado de registración en sistema.
                            studentInfo.state = 'Pendiente';

                            return studentInfo;

                        }
                    )
                );

                // (2.b)
                // (2.c)
                // La actualización de notOkStudentsList ejecuta (2.A.1)
                setNotOkStudentsList(
                    studentsCheckedInfo.data.nok.map(
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

    const handleSheetNameValueChange = event => {
        setSheetNameValue(event.target.value);
    };

    const handleCellRangeName = event => {
        setCellRangeName(event.target.value.toUpperCase());
    };

    /**
     * Manejador del evento clic en el botón de registración
     * masiva de alumnos a cursada.
     */
    const handleRegistering = async () => {

        /*
         * 1. Envía al back los datos al endpoint /api/v1/course/register-students.
         *   
         *   courseId: # <numérico>
         *   studentsRegistrationList:
         *   - dossier: # <numérico> - Legajo
         *     previousSubjectsApproved: # <booleano> - true, si tiene todas las correlativas aprobadas.
         *     studiedPreviously: # <booleano> - true, si es recursante.
         *   # ...
         *   
         * !2. El back devuelve un mensaje indicando que la registración fue exitosa.
         *
         *   ok:
         *   - # <numérico> - Legajo
         *   # ...
         *   nok:
         *   - dossier: # <numérico> - Legajo
         *     errorCode: # <numérico> - Número que representa la razón
         *                # por la que no se puede registrar el legajo.
         *                # Posibles valores:
         *                # - 1: el legajo no existe en el sistema.
         *                # - 2: el legajo ya está registrado en la cursada.
         *   # ...
         *
         * 3. El front inserta un símbolo en la primera columna de cada registro para indicar que se registró en el sistema.
         *
         * ---
         *
         * 2.A.-El back devuelve legajos que no se pudieron registrar, junto con el motivo.
         *
         * 2.A.1.-El front muestra los legajos y el motivo en una tabla independiente.
         */

        // Prepara la lista de estudiantes para ser enviada.
        const studentsRegistrationInfo = okStudentsList
            .map(studentRegistrationInfo => {
                return {
                    dossier: studentRegistrationInfo.dossier,
                    previousSubjectsApproved: studentRegistrationInfo.previousSubjectsApproved,
                    studiedPreviously: studentRegistrationInfo.studiedPreviously,
                }
            });

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // (1) (2)
        // Realiza la solicitud al endpoint para registrar la calificación.
        const response = await axios
            .post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/register-students`,
                {
                    courseId: course.getId(),
                    studentsRegistrationList: studentsRegistrationInfo,
                },
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .then(response => {
                // Arroja un error si la petición no fue exitosa.
                if (response.status !== 200)
                    throw new Error(`${response.status}: ${response.statusText}`);

                // Devuelve el contenido de la respuesta.
                return response;
            })
            .catch(error => {
                throw error;
            });

        // (3)
        // El front inserta un símbolo en la primera columna de cada registro para indicar
        // que se registró en el sistema. [usar okStudentsList y notOkStudentsList]

        // Actualiza la información de los estudiantes que se registraron correctamente.
        response.data.body.ok.forEach(registeredStudentDossier => {
            let registeredStudent = okStudentsList
                .find(student => student.dossier === registeredStudentDossier);
            registeredStudent.state = "Registrado";
        });

        // Actualiza la información de los estudiantes que no se registraron correctamente.
        response.data.body.nok.forEach(notRegisteredStudentInfo => {
            let notRegisteredStudent = okStudentsList
                .find(student => student.dossier === notRegisteredStudentInfo.dossier);
            switch(notRegisteredStudentInfo.errorCode) {
                case 1: notRegisteredStudent.state = "No registrado: el legajo no existe en sistema.";
                    break;
                case 2: notRegisteredStudent.state = "No registrado: el legajo ya estaba registrado.";
                    break;
            };
        });

        // Actualiza la información de la tabla.
        setTableManualUpdateTrigger(!tableManualUpdateTrigger);

    };

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Registro de estudiantes en comisión
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
