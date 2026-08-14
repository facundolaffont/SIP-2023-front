// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useHistory } from "react-router-dom";
import { VictoryPie, VictoryLabel } from "victory";

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import { Table } from "../components/Table.js";
import { LoadingState } from "../components/LoadingState";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Estilos.
import '../styles/show-events-summary.css';

export const ShowEventsSummary = () => {

    const { getAccessTokenSilently } = useAuth0();

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [attendanceSummaryList, setAttendanceSummaryList] = useState([]);
    const [noteSummaryList, setNoteSummaryList] = useState([]);
    const [approvalRateSummaryList, setApprovalRateSummaryList] = useState([]);

    const [attendancePiechartTitle, setAttendancePiechartTitle] = useState("");
    const [attendancePiechartData, setAttendancePiechartData] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [attendancePiechartColorScale, setAttendancePiechartColorScale] = useState([]);
    const [approvalPiechartTitle, setApprovalPiechartTitle] = useState("");
    const [approvalPiechartData, setApprovalPiechartData] = useState([]);
    const [approvalData, setApprovalData] = useState({});
    const [approvalPiechartColorScale, setApprovalPiechartColorScale] = useState([]);

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // 1. Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, [course]);

    // Actualiza el mensaje de error que se mostrará al usuario.
    useEffect(() => {

        // Obtiene el contenedor principal del mensaje de error.
        const msgContainer = document.getElementsByClassName("info-msg-container")[0];

        if (error === null) {

            msgContainer.classList.add("not-displayed");

        } else {

            // // Oculta las tablas.
            // setOkList([]);
            // setNotOkList([]);
            // setInvalidRegistersList([]);

            // Obtiene el elemento HTML que contendrá el texto del mensaje.
            const errorMsgTextContainer = document.getElementsByClassName("info-msg-description")[0];

            // Guarda el mensaje.
            errorMsgTextContainer.innerHTML = error;

            // Muestra el mensaje.
            msgContainer.classList.remove("not-displayed");

        }

    }, [error]);

    // Obtiene el resumen de los eventos, respecto de la cursada seleccionada.
    useEffect(() => {

        // Evita que el primer render arroje una excepción porque course es null.
        if (!course) return;

        const getEventsSummary = async () => {
            setLoading(true);

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                setLoading(false);
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
                    if (element.initialDatetime !== null) {
                        element.initialDatetime = element.initialDatetime.replace("T", " ");
                        element.initialDatetime = element.initialDatetime.substring(0, 16);
                    } else element.initialDatetime = '-';

                    if (element.endDatetime !== null) {
                        element.endDatetime = element.endDatetime.replace("T", " ");
                        element.endDatetime = element.endDatetime.substring(0, 16);
                    } else element.endDatetime = '-';
                });

                response
                .data
                .evaluationEventsByNoteSummaryList
                .forEach(element => {
                    if (element.initialDatetime !== null) {
                        element.initialDatetime = element.initialDatetime.replace("T", " ");
                        element.initialDatetime = element.initialDatetime.substring(0, 16);
                    } else element.initialDatetime = '-';

                    if (element.endDatetime !== null) {
                        element.endDatetime = element.endDatetime.replace("T", " ");
                        element.endDatetime = element.endDatetime.substring(0, 16);
                    } else element.endDatetime = '-';
                });

                response
                .data
                .evaluationEventsByApprovalRateSummaryList
                .forEach(element => {
                    if (element.initialDatetime !== null) {
                        element.initialDatetime = element.initialDatetime.replace("T", " ");
                        element.initialDatetime = element.initialDatetime.substring(0, 16);
                    } else element.initialDatetime = '-';

                    if (element.endDatetime !== null) {
                        element.endDatetime = element.endDatetime.replace("T", " ");
                        element.endDatetime = element.endDatetime.substring(0, 16);
                    } else element.endDatetime = '-';
                });

                setAttendanceSummaryList(response.data.classEventsSummaryList);
                setNoteSummaryList(response.data.evaluationEventsByNoteSummaryList);
                setApprovalRateSummaryList(response.data.evaluationEventsByApprovalRateSummaryList);
                setLoading(false);

            })

            // Si la petición no fue exitosa, se genera una excepción.
            .catch(
                error => {

                    //error.response
                    
                    // Guarda el mensaje de error traído del back al usuario, y
                    // en el próximo renderizado se mostrará el mensaje.
                    setError("Hubo un error. Por favor, contactarse con Soporte Técnico.");
                    setLoading(false);

                }
            );

        }
        getEventsSummary();

    }, []);

    // Define columnas para Asistencia
    const attendanceColumns = [
        { header: "ID de evento", accessor: "eventId", align: "center", sortable: true },
        { header: "Tipo de evento", accessor: "eventType", align: "left", sortable: true },
        { header: "Nombre", accessor: "eventName", align: "left", sortable: true },
        { header: "Fecha de inicio", accessor: "initialDatetime", align: "center", sortable: true },
        { header: "Fecha de fin", accessor: "endDatetime", align: "center", sortable: true },
        { header: "Obligatorio", accessor: "obligatory", align: "center", sortable: true, render: (row) => row.obligatory ? 'Sí' : 'No' },
        { header: "Presentes", accessor: "attended", align: "center", sortable: true },
        { header: "%", accessor: "attendedPercentage", align: "center", sortable: true },
        { header: "Ausentes", accessor: "notAttended", align: "center", sortable: true },
        { header: "%", accessor: "notAttendedPercentage", align: "center", sortable: true },
        { header: "Sin registro", accessor: "missingRegisters", align: "center", sortable: true }
    ];

    // Define columnas para Evaluación
    const approvalColumns = [
        { header: "ID de evento", accessor: "eventId", align: "center", sortable: true },
        { header: "Tipo de evento", accessor: "eventType", align: "left", sortable: true },
        { header: "Nombre", accessor: "eventName", align: "left", sortable: true },
        { header: "Fecha de inicio", accessor: "initialDatetime", align: "center", sortable: true },
        { header: "Fecha de fin", accessor: "endDatetime", align: "center", sortable: true },
        { header: "Obligatorio", accessor: "obligatory", align: "center", sortable: true, render: (row) => row.obligatory ? 'Sí' : 'No' },
        { header: "Aprobados", accessor: "approvedStudents", align: "center", sortable: true },
        { header: "%", accessor: "approvedStudentsPercentage", align: "center", sortable: true },
        { header: "Desaprobados", accessor: "disapprovedStudents", align: "center", sortable: true },
        { header: "%", accessor: "disapprovedStudentsPercentage", align: "center", sortable: true },
        { header: "Ausentes", accessor: "nonAttendingStudents", align: "center", sortable: true },
        { header: "%", accessor: "nonAttendingStudentsPercentage", align: "center", sortable: true },
        { header: "Sin registro", accessor: "missingRegisters", align: "center", sortable: true }
    ];

    const handleAttendanceRowClick = (row) => {
        updateClassPiechart(row.eventId, row.eventType, row.eventName, row.attended, row.attendedPercentage, row.notAttended, row.notAttendedPercentage);
    };

    const handleApprovalRowClick = (row) => {
        updateEvaluationPiechart(row.eventId, row.eventType, row.eventName, row.approvedStudents, row.approvedStudentsPercentage, row.disapprovedStudents, row.disapprovedStudentsPercentage, row.nonAttendingStudents, row.nonAttendingStudentsPercentage);
    };

    /**
     * Actualiza el gráfico de torta de asistencias.
     */
    useEffect(() => { 

        let elementsToGraph = [];
        let colorScale = [];
        
        if(
            attendanceData.classAttendingQuantity !== 'undefined'
            && attendanceData.classAttendingQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Presentes: ${attendanceData.classAttendingQuantity} (${attendanceData.classAttendingPercentage}%)`,
                y: attendanceData.classAttendingQuantity
            });
            colorScale.push("gold");
        }
        if(
            attendanceData.classNonAttendingQuantity !== 'undefined'
            && attendanceData.classNonAttendingQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Ausentes: ${attendanceData.classNonAttendingQuantity} (${attendanceData.classNonAttendingPercentage}%)`,
                y: attendanceData.classNonAttendingQuantity
            });
            colorScale.push("orange");
        }
        if(
            attendanceData.classNoRegisterQuantity !== 'undefined'
            && attendanceData.classNoRegisterQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Sin registro: ${attendanceData.classNoRegisterQuantity} (${attendanceData.classNoRegisterPercentage}%)`,
                y: attendanceData.classNoRegisterQuantity
            });
            colorScale.push("gray");
        }

        setAttendancePiechartColorScale(colorScale);
        setAttendancePiechartData(elementsToGraph);

    }, [attendanceData]);

    /**
     * Actualiza el gráfico de torta de calificaciones.
     */
    useEffect(() => { 

        let elementsToGraph = [];
        let colorScale = [];
        if(
            approvalData.evaluationEventApprovedQuantity !== 'undefined'
            && approvalData.evaluationEventApprovedQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Aprobados: ${approvalData.evaluationEventApprovedQuantity} (${approvalData.evaluationEventApprovedPercentage}%)`,
                y: approvalData.evaluationEventApprovedQuantity
            });
            colorScale.push("green");
        }
        if(
            approvalData.evaluationEventDisapprovedQuantity !== 'undefined'
            && approvalData.evaluationEventDisapprovedQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Desaprobados: ${approvalData.evaluationEventDisapprovedQuantity} (${approvalData.evaluationEventDisapprovedPercentage}%)`,
                y: approvalData.evaluationEventDisapprovedQuantity
            });
            colorScale.push("tomato");
        }
        if(
            approvalData.evaluationEventNonAttendingQuantity !== 'undefined'
            && approvalData.evaluationEventNonAttendingQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Ausentes: ${approvalData.evaluationEventNonAttendingQuantity} (${approvalData.evaluationEventNonAttendingPercentage}%)`,
                y: approvalData.evaluationEventNonAttendingQuantity
            });
            colorScale.push("orange");
        }
        if(
            approvalData.evaluationEventNoRegisterQuantity !== 'undefined'
            && approvalData.evaluationEventNoRegisterQuantity > 0
        ) {
            elementsToGraph.push({
                x: `Sin registro: ${approvalData.evaluationEventNoRegisterQuantity} (${approvalData.evaluationEventNoRegisterPercentage}%)`,
                y: approvalData.evaluationEventNoRegisterQuantity
            });
            colorScale.push("gray");
        }

        setApprovalPiechartColorScale(colorScale);
        setApprovalPiechartData(elementsToGraph);

    }, [approvalData]);

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
     * Si el evento seleccionado no tiene datos, esconde el gráfico.
     * 
     * @param {number} classAttendingData 
     * @param {number} classNonAttendingData 
     * @param {number} classNoRegisterData
     */ 
    const updateClassPiechart = (
        eventId,
        eventType,
        eventName,
        classAttendingQuantity,
        classAttendingPercentage,
        classNonAttendingQuantity,
        classNonAttendingPercentage,
    ) => { 

        // Obtiene el manejador del gráfico de torta.
        const piechart = document.getElementById("attendancePiechart");

        /**
         * Establece el objeto, con las cantidades y porcentajes, que se
         * pasará al gráfico de torta para que se actualice, y lo muestra
         * en pantalla, si el evento seleccionado tiene datos.
         * 
         * Si el evento seleccionado no tiene datos, no actualiza nada
         * y esconde el gráfico de torta.
         */
        let attendanceData;
        if (!(
            classAttendingQuantity == 0
            && classNonAttendingQuantity == 0
        )) {

            attendanceData = {
                classAttendingQuantity,
                classAttendingPercentage,
                classNonAttendingQuantity,
                classNonAttendingPercentage,
            };

            setAttendancePiechartTitle(`${eventType} "${eventName}" (ID ${eventId})"`);
            setAttendanceData(attendanceData);

            piechart.classList.remove("not-displayed");

        } else piechart.classList.add("not-displayed");

    }

    /**
     * Cambia los valores del gráfico de torta de los eventos de evaluación y
     * lo muestra en pantalla.
     * 
     * Si el evento seleccionado no tiene datos, esconde el gráfico.
     * 
     * @param {String} evaluationEventApprovedData
     * @param {String} evaluationEventDisapprovedData
     * @param {String} evaluationEventNonAttendingData
     * @param {String} evaluationEventNoRegisterData
     */
    const updateEvaluationPiechart = (
        eventId,
        eventType,
        eventName,
        evaluationEventApprovedQuantity,
        evaluationEventApprovedPercentage,
        evaluationEventDisapprovedQuantity,
        evaluationEventDisapprovedPercentage,
        evaluationEventNonAttendingQuantity,
        evaluationEventNonAttendingPercentage
    ) => { 

        // Obtiene el manejador del gráfico de torta.
        const piechart = document.getElementById("approvalPiechart");

        /**
         * Establece el objeto, con las cantidades y porcentajes, que se
         * pasará al gráfico de torta para que se actualice, y lo muestra
         * en pantalla, si el evento seleccionado tiene datos.
         * 
         * Si el evento seleccionado no tiene datos, no actualiza nada
         * y esconde el gráfico de torta.
         */
        let approvalData;
        if (!(
            evaluationEventApprovedQuantity == 0
            && evaluationEventDisapprovedQuantity == 0
            && evaluationEventNonAttendingQuantity == 0
        )) {
            
            approvalData = {
                evaluationEventApprovedQuantity,
                evaluationEventApprovedPercentage,

                evaluationEventDisapprovedQuantity,
                evaluationEventDisapprovedPercentage,

                evaluationEventNonAttendingQuantity,
                evaluationEventNonAttendingPercentage,
            };

            setApprovalPiechartTitle(`${eventType} "${eventName}" (ID ${eventId})"`);
            setApprovalData(approvalData);

            piechart.classList.remove("not-displayed");

        } else piechart.classList.add("not-displayed");

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
            <div className="info-msg-container not-displayed">
                <div className="info-msg-desc-container">
                    <p className="info-msg-description"></p>
                </div>
            </div>
            
            {loading ? (
                <LoadingState message="Cargando resumen de eventos, por favor espere..." />
            ) : (
                <>
                    <div id="attendance-summary-table-container" className="table-container">
                        <Table
                            title="Resumen de asistencias"
                            columns={attendanceColumns}
                            data={attendanceSummaryList}
                            onRowClick={handleAttendanceRowClick}
                        />
                        {attendanceSummaryList && attendanceSummaryList.length > 0 && (
                            <button
                                type="button"
                                className="export-button"
                                style={{ marginTop: '15px' }}
                                onClick={() => handleExport("attendance-summary-table-container", "Resumen de asistencias", "resumen-asistencias")}
                            >
                                Exportar a Excel
                            </button>
                        )}
                    </div>
                    
                    <div id="attendancePiechart" className="piechart-container white-background not-displayed">
                        <label className="piechart-title">{attendancePiechartTitle}</label>
                        <VictoryPie
                            data={attendancePiechartData}
                            colorScale={attendancePiechartColorScale}
                            radius={120}
                            style={{ labels: {
                                fontSize: 25,
                                fontWeight: "bold"
                            }}}
                        />
                    </div>

                    <div id="approval-rate-summary-table-container" className="table-container">
                        <Table
                            title="Resumen de calificaciones"
                            columns={approvalColumns}
                            data={approvalRateSummaryList}
                            onRowClick={handleApprovalRowClick}
                        />
                        {approvalRateSummaryList && approvalRateSummaryList.length > 0 && (
                            <button
                                type="button"
                                className="export-button"
                                style={{ marginTop: '15px' }}
                                onClick={() => handleExport("approval-rate-summary-table-container", "Resumen de calificaciones", "resumen-calificaciones")}
                            >
                                Exportar a Excel
                            </button>
                        )}
                    </div>
                    <div id="approvalPiechart" className="piechart-container white-background not-displayed">
                        <label className="piechart-title">{approvalPiechartTitle}</label>
                        <VictoryPie
                            data={approvalPiechartData}
                            colorScale={approvalPiechartColorScale}
                            radius={120}
                            style={{ labels: {
                                fontSize: 25,
                                fontWeight: "bold"
                            }}}
                        />
                    </div>
                </>
            )}
        </PageLayout>
    );
};
