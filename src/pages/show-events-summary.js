// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { VictoryPie } from "victory-pie";

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import HTMLTableManipulator from "../services/html-table-manipulator";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Estilos.
import '../styles/show-events-summary.css';

export const ShowEventsSummary = () => {

    const { getAccessTokenSilently } = useAuth0();

    const [, changeCourse] = useSelectedCourse(true);
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [attendanceSummaryList, setAttendanceSummaryList] = useState([]);
    const [noteSummaryList, setNoteSummaryList] = useState([]);
    const [approvalRateSummaryList, setApprovalRateSummaryList] = useState([]);

    const [piechartData, setPiechartData] = useState([]);
    const [piechartColorScale, setPiechartColorScale] = useState([]);
    const [evaluationData, setEvaluationData] = useState({});

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    // Verifica que se haya seleccionado una cursada.
    useEffect(() => {

        // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
        // o si se actualiza la página, ya que se pierde el contexto de la selección que
        // se había hecho.
        if (course === null)
            window.location.replace(`${process.env.REACT_APP_DOMAIN_URL}/profile?course-missing`);

    });

    // Obtiene el resumen de los eventos, respecto de la cursada seleccionada.
    useEffect(() => {

        const getEventsSummary = async () => {

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

            // Realiza la petición al back para obtener el resumen de eventos.
            axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-events-summary?course-id=${course.getId()}`,
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )

            // Si la petición fue exitosa, se guarda la información obtenida.
            .then(response => {

                response
                .data
                .classEventsSummaryList
                .forEach(element => {
                    element.initialDatetime = element.initialDatetime.replace("T", " ");
                    element.endDatetime = element.endDatetime.replace("T", " ");
                    element.initialDatetime = element.initialDatetime.substring(0, 16);
                    element.endDatetime = element.endDatetime.substring(0, 16);
                });
                response
                .data
                .evaluationEventsByNoteSummaryList
                .forEach(element => {
                    element.initialDatetime = element.initialDatetime.replace("T", " ");
                    element.endDatetime = element.endDatetime.replace("T", " ");
                    element.initialDatetime = element.initialDatetime.substring(0, 16);
                    element.endDatetime = element.endDatetime.substring(0, 16);
                });
                response
                .data
                .evaluationEventsByApprovalRateSummaryList
                .forEach(element => {
                    element.initialDatetime = element.initialDatetime.replace("T", " ");
                    element.endDatetime = element.endDatetime.replace("T", " ");
                    element.initialDatetime = element.initialDatetime.substring(0, 16);
                    element.endDatetime = element.endDatetime.substring(0, 16);
                });

                // // Agrega los porcentajes sobre las cantidades.
                // response.data.classEventsSummaryList.forEach(element => {
                //     let total = 
                //         element.attended
                //         + element.notAttended
                //         + element.missingRegisters;
                //     if (element.attended !== 0) element.attended = element.attended + ` (${(element.attended / total * 100).toFixed(2)}%)`;
                //     if (element.notAttended !== 0) element.notAttended = element.notAttended + ` (${(element.notAttended / total * 100).toFixed(2)}%)`;
                //     if (element.missingRegisters !== 0) element.missingRegisters = element.missingRegisters + ` (${(element.missingRegisters / total * 100).toFixed(2)}%)`;
                // });
                // response.data.evaluationEventsByApprovalRateSummaryList.forEach(element => {
                //     let total = 
                //         element.approvedStudents
                //         + element.disapprovedStudents
                //         + element.nonAttendingStudents
                //         + element.missingRegisters;
                //     if (element.approvedStudents !== 0) element.approvedStudents = element.approvedStudents + ` (${(element.approvedStudents / total * 100).toFixed(2)}%)`;
                //     if (element.disapprovedStudents !== 0) element.disapprovedStudents = element.disapprovedStudents + ` (${(element.disapprovedStudents / total * 100).toFixed(2)}%)`;
                //     if (element.nonAttendingStudents !== 0) element.nonAttendingStudents = element.nonAttendingStudents + ` (${(element.nonAttendingStudents / total * 100).toFixed(2)}%)`;
                //     if (element.missingRegisters !== 0) element.missingRegisters = element.missingRegisters + ` (${(element.missingRegisters / total * 100).toFixed(2)}%)`;
                // });

                setAttendanceSummaryList(response.data.classEventsSummaryList);
                setNoteSummaryList(response.data.evaluationEventsByNoteSummaryList);
                setApprovalRateSummaryList(response.data.evaluationEventsByApprovalRateSummaryList);

            })

            // Si la petición no fue exitosa, se genera una excepción.
            .catch(
                error => error.response
            );

        }
        getEventsSummary();

    }, []); // El array vacío asegura que el efecto se ejecute solo una vez después del montaje del componente.

    // Actualiza las tablas.
    useEffect(() => {

        // Actualiza la tabla de asistencias.
        let attendanceSummaryTable = document.getElementsByClassName(
            "attendance-summary-table"
        )[0];
        let attendanceSummaryTableContainer = document.getElementsByClassName(
            "attendance-summary-table-container"
        )[0];
        if (attendanceSummaryList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                attendanceSummaryTable,
                {
                    tableRows: attendanceSummaryList,
                    columnNames: [
                        "eventId:ID de evento",
                        "eventType:Tipo de evento",
                        "initialDatetime:Fecha de inicio",
                        "endDatetime:Fecha de fin",
                        "obligatory:Obligatorio",
                        "attended:Presentes",
                        "attendedPercentage:%",
                        "notAttended:Ausentes",
                        "notAttendedPercentage:%",
                        "missingRegisters:Sin registro",
                        "missingRegistersPercentage:%",
                    ],
                    columnClasses: [
                        "obligatory:centered",
                        "attended:centered",
                        "attendedPercentage:centered",
                        "notAttended:centered",
                        "notAttendedPercentage:centered",
                        "missingRegisters:centered",
                        "missingRegistersPercentage:centered",
                    ],
                    onMouseoverEventHandler: showClassPiechart,
                    onMouseoverEventHandlerParameters: [
                        "attended", "attendedPercentage",
                        "notAttended", "notAttendedPercentage",
                        "missingRegisters", "missingRegistersPercentage"
                    ],
                    onMouseoutEventHandler: hideClassPiechart,
                },
                "Resumen de asistencias."
            );
            attendanceSummaryTableContainer.classList.remove("not-displayed");
        } else attendanceSummaryTableContainer.classList.add("not-displayed");

        // Actualiza la tabla de resumen de eventos de evaluación por aprobados.
        let approvalRateSummaryTable = document.getElementsByClassName(
            "approval-rate-summary-table"
        )[0];
        let approvalRateSummaryTableContainer = document.getElementsByClassName(
            "approval-rate-summary-table-container"
        )[0];
        if (approvalRateSummaryList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                approvalRateSummaryTable,
                {
                    tableRows: approvalRateSummaryList,
                    columnNames: [
                        "eventId:ID de evento",
                        "eventType:Tipo de evento",
                        "initialDatetime:Fecha de inicio",
                        "endDatetime:Fecha de fin",
                        "obligatory:Obligatorio",
                        "approvedStudents:Aprobados",
                        "approvedStudentsPercentage:%",
                        "disapprovedStudents:Desaprobados",
                        "disapprovedStudentsPercentage:%",
                        "nonAttendingStudents:Ausentes",
                        "nonAttendingStudentsPercentage:%",
                        "missingRegisters:Sin registro",
                        "missingRegistersPercentage:%",
                    ],
                    columnClasses: [
                        "obligatory:centered",
                        "approvedStudents:centered",
                        "approvedStudentsPercentage:centered",
                        "disapprovedStudents:centered",
                        "disapprovedStudentsPercentage:centered",
                        "nonAttendingStudents:centered",
                        "nonAttendingStudentsPercentage:centered",
                        "missingRegisters:centered",
                        "missingRegistersPercentage:centered",
                    ],
                    onMouseoverEventHandler: showEvaluationPiechart,
                    onMouseoverEventHandlerParameters: [
                        "approvedStudents",
                        "approvedStudentsPercentage",
                        "disapprovedStudents",
                        "disapprovedStudentsPercentage",
                        "nonAttendingStudents",
                        "nonAttendingStudentsPercentage",
                        "missingRegisters",
                        "missingRegistersPercentage"
                    ],
                    onMouseoutEventHandler: hideEvaluationPiechart,
                },
                "Resumen de evaluaciones."
            );
            approvalRateSummaryTableContainer.classList.remove("not-displayed");
        } else approvalRateSummaryTableContainer.classList.add("not-displayed");

    }, [attendanceSummaryList, noteSummaryList, approvalRateSummaryList]);

    /**
     * Actualiza el gráfico de torta.
     */
    useEffect(() => {

        console.log("evaluationPiechartChangeFlag");
        
        let elementsToGraph = [];
        let colorScale = [];
        if(
            evaluationData.evaluationEventApprovedQuantity !== 'undefined'
            && evaluationData.evaluationEventApprovedQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Aprobados: ${evaluationData.evaluationEventApprovedQuantity} (${evaluationData.evaluationEventApprovedPercentage}%)`,
                y: evaluationData.evaluationEventApprovedQuantity
            });
            colorScale.push("green");
        }
        if(
            evaluationData.evaluationEventDisapprovedQuantity !== 'undefined'
            && evaluationData.evaluationEventDisapprovedQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Desaprobados: ${evaluationData.evaluationEventDisapprovedQuantity} (${evaluationData.evaluationEventDisapprovedPercentage}%)`,
                y: evaluationData.evaluationEventDisapprovedQuantity
            });
            colorScale.push("tomato");
        }
        if(
            evaluationData.evaluationEventNonAttendingQuantity !== 'undefined'
            && evaluationData.evaluationEventNonAttendingQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Ausentes: ${evaluationData.evaluationEventNonAttendingQuantity} (${evaluationData.evaluationEventNonAttendingPercentage}%)`,
                y: evaluationData.evaluationEventNonAttendingQuantity
            });
            colorScale.push("navy");
        }
        if(
            evaluationData.evaluationEventNoRegisterQuantity !== 'undefined'
            && evaluationData.evaluationEventNoRegisterQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Sin registro: ${evaluationData.evaluationEventNoRegisterQuantity} (${evaluationData.evaluationEventNoRegisterPercentage}%)`,
                y: evaluationData.evaluationEventNoRegisterQuantity
            });
            colorScale.push("gray");
        }
        if(
            evaluationData.classAttendingQuantity !== 'undefined'
            && evaluationData.classAttendingQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Presentes: ${evaluationData.classAttendingQuantity} (${evaluationData.classAttendingPercentage}%)`,
                y: evaluationData.classAttendingQuantity
            });
            colorScale.push("gold");
        }
        if(
            evaluationData.classNonAttendingQuantity !== 'undefined'
            && evaluationData.classNonAttendingQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Ausentes: ${evaluationData.classNonAttendingQuantity} (${evaluationData.classNonAttendingPercentage}%)`,
                y: evaluationData.classNonAttendingQuantity
            });
            colorScale.push("navy");
        }
        if(
            evaluationData.classNoRegisterQuantity !== 'undefined'
            && evaluationData.classNoRegisterQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Sin registro: ${evaluationData.classNoRegisterQuantity} (${evaluationData.classNoRegisterPercentage}%)`,
                y: evaluationData.classNoRegisterQuantity
            });
            colorScale.push("gray");
        }

        setPiechartColorScale(colorScale);
        setPiechartData(elementsToGraph);

    }, [evaluationData]);

    /**
     * Agrega manejadores de evento para que los gráficos sigan al mouse.
     */
    useEffect(() => {
        
        // Agrega el manejador para el gráfico de torta.
        var piechart = document.getElementById("piechart");
        document.addEventListener("mousemove", function(e) {
            piechart.style.left = e.screenX + "px";
            piechart.style.top = e.screenY + "px";
        });

    }, []);

    function getFormattedDateAndTime(initialDateAndTime, endDateAndTime) {

        const initialDate =
            Intl.DateTimeFormat(
                'es-AR',
                {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                }
            ).format(new Date(initialDateAndTime));
        const initialTime = 
            Intl.DateTimeFormat(
                'es-AR',
                {
                    hour: '2-digit',
                    minute: '2-digit',
                }
            ).format(new Date(initialDateAndTime));
        const endDate =
            Intl.DateTimeFormat(
                'es-AR',
                {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                }
            ).format(new Date(endDateAndTime));
        const endTime = 
            Intl.DateTimeFormat(
                'es-AR',
                {
                    hour: '2-digit',
                    minute: '2-digit',
                }
            ).format(new Date(endDateAndTime));

        return initialDate.valueOf() === endDate.valueOf()
            ? `${initialDate} de ${initialTime} a ${endTime}`
            : `${initialDate} ${initialTime} - ${endDate} ${endTime}`;
    }

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = (tableId, filename, sheetName) => {
        spreadsheetManipulator.export(
            document.getElementById(tableId),
            filename,
            sheetName
        );
    }

    /**
     * Cambia los valores del gráfico de torta de los eventos de clase y
     * lo muestra en pantalla.
     * 
     * @param {number} classAttendingData 
     * @param {number} classNonAttendingData 
     * @param {number} classNoRegisterData
     */
    const showClassPiechart = (
        classAttendingQuantity,
        classAttendingPercentage,
        classNonAttendingQuantity,
        classNonAttendingPercentage,
        classNoRegisterQuantity,
        classNoRegisterPercentage,
    ) => {

        // let TempClassAttendingQuantity = 
        //     classAttendingData != 0
        //     ? parseInt(classAttendingData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempClassAttendingPercentage = 
        //     classAttendingData != 0
        //     ? classAttendingData.match(/(.*)/g)[0]
        //     : "(0%)";

        // let TempClassNonAttendingQuantity =
        //     classNonAttendingData != 0
        //     ? parseInt(classNonAttendingData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempClassNonAttendingPercentage = 
        //     classNonAttendingData != 0
        //     ? classNonAttendingData.match(/(.*)/g)[0]
        //     : "(0%)";

        // let TempClassNoRegisterQuantity =
        //     classNoRegisterData != 0
        //     ? parseInt(classNoRegisterData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempClassNoRegisterPercentage = 
        //     classNoRegisterData != 0
        //     ? classNoRegisterData.match(/(.*)/g)[0]
        //     : "(0%)";

        let localEvaluationData = {
            classAttendingQuantity,
            classAttendingPercentage,

            classNonAttendingQuantity,
            classNonAttendingPercentage,

            classNoRegisterQuantity,
            classNoRegisterPercentage,
        }

        setEvaluationData(localEvaluationData);

        const piechart = document.getElementById("piechart");
        piechart.classList.remove("not-displayed");

    }

    /**
     * Esconde el gráfico de torta de los eventos de clase.
     */
    const hideClassPiechart = () => {

        const piechart = document.getElementById("piechart");
        piechart.classList.add("not-displayed");

    }

    /**
     * Cambia los valores del gráfico de torta de los eventos de evaluación y
     * lo muestra en pantalla.
     * 
     * @param {String} evaluationEventApprovedData
     * @param {String} evaluationEventDisapprovedData
     * @param {String} evaluationEventNonAttendingData
     * @param {String} evaluationEventNoRegisterData
     */
    const showEvaluationPiechart = (
        evaluationEventApprovedQuantity,
        evaluationEventApprovedPercentage,
        evaluationEventDisapprovedQuantity,
        evaluationEventDisapprovedPercentage,
        evaluationEventNonAttendingQuantity,
        evaluationEventNonAttendingPercentage,
        evaluationEventNoRegisterQuantity,
        evaluationEventNoRegisterPercentage
    ) => {

        // let TempEvaluationEventApprovedQuantity = 
        //     evaluationEventApprovedData != 0
        //     ? parseInt(evaluationEventApprovedData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempEvaluationEventApprovedPercentage = 
        //     evaluationEventApprovedData != 0
        //     ? evaluationEventApprovedData.match(/(.*)/g)[0]
        //     : "(0%)";

        // let TempEvaluationEventDisapprovedQuantity =
        //     evaluationEventDisapprovedData != 0
        //     ? parseInt(evaluationEventDisapprovedData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempEvaluationEventDisapprovedPercentage = 
        // evaluationEventDisapprovedData != 0
        //     ? evaluationEventDisapprovedData.match(/(.*)/g)[0]
        //     : "(0%)";

        // let TempEvaluationEventNonAttendingQuantity =
        //     evaluationEventNonAttendingData != 0
        //     ? parseInt(evaluationEventNonAttendingData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempEvaluationEventNonAttendingPercentage = 
        //     evaluationEventNonAttendingData != 0
        //     ? evaluationEventNonAttendingData.match(/(.*)/g)[0]
        //     : "(0%)";

        // let TempEvaluationEventNoRegisterQuantity =
        //     evaluationEventNoRegisterData != 0
        //     ? parseInt(evaluationEventNoRegisterData.match(/^\d+/g)[0], 10)
        //     : 0;
        // let TempEvaluationEventNoRegisterPercentage = 
        //     evaluationEventNoRegisterData != 0
        //     ? evaluationEventNoRegisterData.match(/(.*)/g)[0]
        //     : "(0%)";

        let localEvaluationData = {
            evaluationEventApprovedQuantity,
            evaluationEventApprovedPercentage,

            evaluationEventDisapprovedQuantity,
            evaluationEventDisapprovedPercentage,

            evaluationEventNonAttendingQuantity,
            evaluationEventNonAttendingPercentage,

            evaluationEventNoRegisterQuantity,
            evaluationEventNoRegisterPercentage,
        };

        setEvaluationData(localEvaluationData);

        const piechart = document.getElementById("piechart");
        piechart.classList.remove("not-displayed");

    }

    /**
     * Esconde el gráfico de torta de los eventos de evaluación.
     */
    const hideEvaluationPiechart = () => {

        const piechart = document.getElementById("piechart");
        piechart.classList.add("not-displayed");

    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Resumen de eventos
            </h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            <div id="piechart" className="piechart-container black-border white-background center-fixed not-displayed">
                <VictoryPie
                    data={piechartData}
                    colorScale={piechartColorScale}
                    radius={120}
                />
            </div>
            {attendanceSummaryList && (
                <div id="hola" className="attendance-summary-table-container table-container not-displayed">
                    <table id="attendance-summary-table" className="attendance-summary-table"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={() => handleExport("attendance-summary-table", "Resumen de asistencias", "resumen-asistencias")}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
            {approvalRateSummaryList && (
                <div className="approval-rate-summary-table-container table-container not-displayed">
                    <table id="approval-rate-summary-table" className="approval-rate-summary-table"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={() => handleExport("approval-rate-summary-table", "Resumen de calificaciones", "resumen-asistencias")}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
        </PageLayout>
    );
};
