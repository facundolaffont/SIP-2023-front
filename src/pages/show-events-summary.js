// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import HTMLTableManipulator from "../services/html-table-manipulator";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Estilos.
import '../styles/show-events-summary.css';

export const ShowEventsSummary = () => {
    const [attendanceSummaryList, setAttendanceSummaryList] = useState([]);
    const [noteSummaryList, setNoteSummaryList] = useState([]);
    const [approvalRateSummaryList, setApprovalRateSummaryList] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    const [, changeCourse] = useSelectedCourse(true);
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

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

    // Actualiza las tablas.
    useEffect(() => {

        // Actualiza la tabla de asistencias.
        let attendanceSummaryTable = document.getElementsByClassName(
            "attendance-summary-table"
        )[0];
        if (attendanceSummaryList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                attendanceSummaryTable,
                {
                    tableRows: attendanceSummaryList,
                    columnNames: [
                        "eventId:ID",
                        "attended:Presentes",
                        "notAttended:Ausentes",
                        "missingRegisters:Sin registro",
                    ],
                },
                "Resumen de asistencias."
            );
            attendanceSummaryTable.classList.remove("not-displayed");
        } else attendanceSummaryTable.classList.add("not-displayed");

        // Actualiza la tabla de resumen de eventos por nota.
        let noteSummaryTable = document.getElementsByClassName(
            "note-summary-table"
        )[0];
        if (noteSummaryList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                noteSummaryTable,
                {
                    tableRows: noteSummaryList,
                    columnNames: [
                        "eventId:ID",
                        "attended:Presentes",
                        "notAttended:Ausentes",
                        "missingRegisters:Sin registro",
                    ],
                },
                "Resumen de asistencias."
            );
            noteSummaryTable.classList.remove("not-displayed");
        } else noteSummaryTable.classList.add("not-displayed");

    }, [attendanceSummaryList]);

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

            setAttendanceSummaryList(response.data.classEventsSummaryList);
            setNoteSummaryList(response.data.evaluationEventsByNoteSummaryList);
            setApprovalRateSummaryList(response.data.evaluationEventsByApprovalRateSummaryList);

        })

        // Si la petición no fue exitosa, se genera una excepción.
        .catch(
            error => error.response
        );

    }, []); // El array vacío asegura que el efecto se ejecute solo una vez después del montaje del componente.

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
            {attendanceSummaryList && (
                <div>
                    <table id="attendance-summary-table" className="attendance-summary-table table-container not-displayed"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={handleExport("attendance-summary-table")}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
            {noteSummaryList && (
                <div>
                    <table id="note-summary-table" className="note-summary-table table-container not-displayed"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={handleExport("note-summary-table")}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
            {approvalRateSummaryList && (
                <div>
                    <table id="approval-rate-summary-table" className="approval-rate-summary-table table-container not-displayed"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={handleExport("approval-rate-summary-table")}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
        </PageLayout>
    );
};
