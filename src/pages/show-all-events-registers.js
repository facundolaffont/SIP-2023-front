// Componentes externos.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";
import CourseDTO from "../contexts/course/course-d-t-o.js";

// Estilos.
import '../styles/show-all-events-registers.css';

export const ShowAllEventsRegisters = () => {

    const { getAccessTokenSilently } = useAuth0();

    const [eventsDetailsList, setEventsDetailsList] = useState([]);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const history = useHistory();

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

     // Inicializa el objeto que manipula las planillas.
     useState(() => {

        setSpreadsheetManipulator(new SpreadsheetManipulator());

    }, []);

    /**
     * Actualiza un arreglo con los datos de las cursadas.
     */
    useEffect(() => {

        // Redirige a la página de selección de cursada, si todavía no se seleccionó
        // una cursada, o si se actualiza la página, ya que se pierde el contexto de la
        // selección que se había hecho.
        if (course === null) history.push('/profile?course-missing');

        // Ejecuta la consulta y muestra por tabla.
        else {

            // Realizar la solicitud al backend.
            const getEventsDetails = async () => {

                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently()
                .catch(error => {
                    throw error;
                });

                // Realiza la petición.
                const eventsDetails = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-events-details?course-id=${course.getId()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                )
                .catch(error => {
                    throw error;
                });

                // Formatea las fechas de los eventos.
                let formattedEventsDetailsList = eventsDetails.data.eventsDetailsList.map(eventDetailsRegister => {
                    return {
                        eventId: eventDetailsRegister.eventId,
                        eventType: eventDetailsRegister.eventType,
                        datetime: 
                            eventDetailsRegister.initialDatetime !== null
                            ? (
                                getFormattedDateAndTime(
                                    eventDetailsRegister.initialDatetime,
                                    eventDetailsRegister.endDatetime,
                                )
                            ) : '-',
                        studentDossier: eventDetailsRegister.studentDossier,
                        studentId: eventDetailsRegister.studentId,
                        studentName: eventDetailsRegister.studentName,
                        attendance: eventDetailsRegister.attendance,
                        note: eventDetailsRegister.note,
                    };
                });

                // Muestra la lista recibida por tabla.
                setEventsDetailsList(formattedEventsDetailsList);

            }
            getEventsDetails();

        }

    }, []);

    // Actualiza la tabla.
    useEffect(() => {

        let tableContainer = document.getElementsByClassName(
            "table-container"
        )[0];
        let table = document.getElementsByClassName(
            "table"
        )[0];
        if (eventsDetailsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                table,
                {
                    tableRows: eventsDetailsList,
                    columnNames: [
                        "eventId:ID de evento",
                        "eventType:Tipo de evento",
                        "datetime:Fecha y horario",
                        "studentDossier:Legajo",
                        "studentId:DNI",
                        "studentName:Nombre",
                        "attendance:Asistencia",
                        "note:Nota",
                    ],
                },
            );
            tableContainer.classList.remove("not-displayed");
        } else tableContainer.classList.add("not-displayed");

    }, [eventsDetailsList]);

    // Formatea las fechas.
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
    const handleExport = () => {
        spreadsheetManipulator.export(
            document.getElementById("table"),
            "Detalle de todos los eventos",
            "detalle-eventos-cursada"
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Consultar registros de todos los eventos
            </h1>
            <div id="table" className="table-container not-displayed">
                <table className="table"></table>
                <button
                    type="button"
                    className="export-button"
                    onClick={handleExport}
                >
                    Exportar a Excel
                </button>
            </div>
        </PageLayout>
    );
};
