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

    /*const [classPiechartData, setClassPiechartData] = useState([]);
    const [classPiechartColorScale, setClassPiechartColorScale] = useState([]);

    const [evaluationPiechartData, setEvaluationPiechartData] = useState([]);
    const [evaluationPiechartColorScale, setEvaluationPiechartColorScale] = useState([]);*/

    const [piechartData, setPiechartData] = useState([]);
    const [piechartColorScale, setPiechartColorScale] = useState([]);

    const [evaluationPiechartChangeFlag, setEvaluationPiechartChangeFlag] = useState(false);
    const [evaluationPercentData, setEvaluationPercentData] = useState({});
    /*const [evaluationEventApprovedPercent, setEvaluationEventApprovedPercent] = useState(25);
    const [evaluationEventDisapprovedPercent, setEvaluationEventDisapprovedPercent] = useState(25);
    const [evaluationEventNonAttendingPercent, setEvaluationEventNonAttendingPercent] = useState(25);
    const [evaluationEventNoRegisterPercent, setEvaluationEventNoRegisterPercent] = useState(25);*/

    const [classAttendingPercent, setClassAttendingPercent] = useState(25);
    const [classNonAttendingPercent, setClassNonAttendingPercent] = useState(25);
    const [classNoRegisterPercent, setClassNoRegisterPercent] = useState(25);

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
            window.location.replace(`${process.env.REACT_APP_DOMAIN_URL}/profile?redirected`);

    });

    // Obtiene el resumen de los eventos, respecto de la cursada seleccionada.
    useEffect(async () => {

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

            setAttendanceSummaryList(response.data.classEventsSummaryList);
            setNoteSummaryList(response.data.evaluationEventsByNoteSummaryList);
            setApprovalRateSummaryList(response.data.evaluationEventsByApprovalRateSummaryList);

        })

        // Si la petición no fue exitosa, se genera una excepción.
        .catch(
            error => error.response
        );

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
                        "notAttended:Ausentes",
                        "missingRegisters:Sin registro",
                    ],
                    onMouseoverEventHandler: showClassPiechart,
                    onMouseoverEventHandlerParameters: ["attended", "notAttended", "missingRegisters"],
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
                        "disapprovedStudents:Desaprobados",
                        "nonAttendingStudents:Ausentes",
                        "missingRegisters:Sin registro",
                    ],
                    onMouseoverEventHandler: showEvaluationPiechart,
                    onMouseoverEventHandlerParameters: ["approvedStudents", "disapprovedStudents", "nonAttendingStudents", "missingRegisters"],
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
            evaluationPercentData.evaluationEventApprovedPercent !== 'undefined'
            && evaluationPercentData.evaluationEventApprovedPercent > 0
        ) {
            elementsToGraph.push({ x: "Aprobados", y: evaluationPercentData.evaluationEventApprovedPercent });
            colorScale.push("green");
        }
        if(
            evaluationPercentData.evaluationEventDisapprovedPercent !== 'undefined'
            && evaluationPercentData.evaluationEventDisapprovedPercent > 0
        ) {
            elementsToGraph.push({ x: "Desaprobados", y: evaluationPercentData.evaluationEventDisapprovedPercent });
            colorScale.push("tomato");
        }
        if(
            evaluationPercentData.evaluationEventNonAttendingPercent !== 'undefined'
            && evaluationPercentData.evaluationEventNonAttendingPercent > 0
        ) {
            elementsToGraph.push({ x: "Ausentes", y: evaluationPercentData.evaluationEventNonAttendingPercent });
            colorScale.push("navy");
        }
        if(
            evaluationPercentData.evaluationEventNoRegisterPercent !== 'undefined'
            && evaluationPercentData.evaluationEventNoRegisterPercent > 0
        ) {
            elementsToGraph.push({ x: "Sin registro", y: evaluationPercentData.evaluationEventNoRegisterPercent });
            colorScale.push("gray");
        }
        if(
            evaluationPercentData.classAttendingPercent !== 'undefined'
            && evaluationPercentData.classAttendingPercent > 0
        ) {
            elementsToGraph.push({ x: "Presentes", y: evaluationPercentData.classAttendingPercent });
            colorScale.push("gold");
        }
        if(
            evaluationPercentData.classNonAttendingPercent !== 'undefined'
            && evaluationPercentData.classNonAttendingPercent > 0
        ) {
            elementsToGraph.push({ x: "Ausentes", y: evaluationPercentData.classNonAttendingPercent });
            colorScale.push("navy");
        }
        if(
            evaluationPercentData.classNoRegisterPercent !== 'undefined'
            && evaluationPercentData.classNoRegisterPercent > 0
        ) {
            elementsToGraph.push({ x: "Sin registro", y: evaluationPercentData.classNoRegisterPercent });
            colorScale.push("gray");
        }

        setPiechartColorScale(colorScale);
        setPiechartData(elementsToGraph);

    }, [evaluationPercentData]);

    /**
     * Actualiza el gráfico de torta de evento de clase.
     /
    useEffect(() => {

        let elementsToGraph = [];
        let colorScale = [];
        if(classAttendingPercent > 0) {
            elementsToGraph.push({ x: "Presentes", y: classAttendingPercent });
            colorScale.push("gold");
        }
        if(classNonAttendingPercent > 0) {
            elementsToGraph.push({ x: "Ausentes", y: classNonAttendingPercent });
            colorScale.push("navy");
        }
        if(classNoRegisterPercent > 0) {
            elementsToGraph.push({ x: "Sin registro", y: classNoRegisterPercent });
            colorScale.push("gray");
        }

        setClassPiechartColorScale(colorScale);
        setClassPiechartData(elementsToGraph);

    }, [
        classAttendingPercent,
        classNonAttendingPercent,
        classNoRegisterPercent
    ]);

    /**
     * Actualiza el gráfico de torta de evento de evaluación.
     /
    useEffect(() => {

        console.log("evaluationPiechartChangeFlag");
        
        let elementsToGraph = [];
        let colorScale = [];
        if(evaluationPercentData.evaluationEventApprovedPercent > 0) {
            elementsToGraph.push({ x: "Aprobados", y: evaluationPercentData.evaluationEventApprovedPercent });
            colorScale.push("green");
        }
        if(evaluationPercentData.evaluationEventDisapprovedPercent > 0) {
            elementsToGraph.push({ x: "Desaprobados", y: evaluationPercentData.evaluationEventDisapprovedPercent });
            colorScale.push("tomato");
        }
        if(evaluationPercentData.evaluationEventNonAttendingPercent > 0) {
            elementsToGraph.push({ x: "Ausentes", y: evaluationPercentData.evaluationEventNonAttendingPercent });
            colorScale.push("navy");
        }
        if(evaluationPercentData.evaluationEventNoRegisterPercent > 0) {
            elementsToGraph.push({ x: "Sin registro", y: evaluationPercentData.evaluationEventNoRegisterPercent });
            colorScale.push("gray");
        }

        setEvaluationPiechartColorScale(colorScale);
        setEvaluationPiechartData(elementsToGraph);

    }, [evaluationPercentData]);*/

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
    const handleExport = tableId => {
        spreadsheetManipulator.export(
            document.getElementById(tableId)
        );
    }

    /**
     * Cambia los valores del gráfico de torta de los eventos de clase y
     * lo muestra en pantalla.
     * 
     * @param {number} classAttendingPercent 
     * @param {number} classNonAttendingPercent 
     * @param {number} classNoRegisterPercent
     */
    const showClassPiechart = (
        classAttendingPercent,
        classNonAttendingPercent,
        classNoRegisterPercent,
    ) => {

        let localEvaluationPercentData = {
            classAttendingPercent,
            classNonAttendingPercent,
            classNoRegisterPercent,
        }

        /*setClassAttendingPercent(classAttendingPercent);
        setClassNonAttendingPercent(classNonAttendingPercent);
        setClassNoRegisterPercent(classNoRegisterPercent);*/
        setEvaluationPercentData(localEvaluationPercentData);

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
     * @param {number} evaluationEventApprovedPercent 
     * @param {number} evaluationEventDisapprovedPercent 
     * @param {number} evaluationEventNonAttendingPercent 
     * @param {number} evaluationEventNoRegisterPercent 
     */
    const showEvaluationPiechart = (
        evaluationEventApprovedPercent,
        evaluationEventDisapprovedPercent,
        evaluationEventNonAttendingPercent,
        evaluationEventNoRegisterPercent
    ) => {

        let localEvaluationPercentData = {
            evaluationEventApprovedPercent,
            evaluationEventDisapprovedPercent,
            evaluationEventNonAttendingPercent,
            evaluationEventNoRegisterPercent,
        }

        /*setEvaluationEventApprovedPercent(evaluationEventApprovedPercent);
        setEvaluationEventDisapprovedPercent(evaluationEventDisapprovedPercent);
        setEvaluationEventNonAttendingPercent(evaluationEventNonAttendingPercent);
        setEvaluationEventNoRegisterPercent(evaluationEventNoRegisterPercent);*/
        setEvaluationPercentData(localEvaluationPercentData);

        //setEvaluationPiechartChangeFlag(!evaluationPiechartChangeFlag);

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
            {/*<div id="class-piechart" className="piechart-container black-border white-background center-fixed not-displayed">
                <VictoryPie
                    data={classPiechartData}
                    colorScale={classPiechartColorScale}
                    radius={120}
                />
            </div>
            <div id="evaluation-piechart" className="piechart-container black-border white-background center-fixed not-displayed">
                <VictoryPie
                    data={evaluationPiechartData}
                    colorScale={evaluationPiechartColorScale}
                    radius={120}
                />
            </div>*/}
            {attendanceSummaryList && (
                <div id="hola" className="attendance-summary-table-container table-container not-displayed">
                    <table id="attendance-summary-table" className="attendance-summary-table"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={() => handleExport("attendance-summary-table")}
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
                        onClick={() => handleExport("approval-rate-summary-table")}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
        </PageLayout>
    );
};
