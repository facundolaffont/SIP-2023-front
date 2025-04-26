// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useHistory } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import HTMLTableManipulator from "../services/html-table-manipulator.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service.js";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o.js";

// Estilos.
import '../styles/list-events-attendance.css';

export const ListAttendance = () => {
    const [eventsList, setEventsList] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    const [, changeCourse] = useSelectedCourse(true);
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    // Actualiza las tablas.
    useEffect(() => {

        // Actualiza la tabla de estudiantes que están aptos para ser registrados.
        let eventsTable = document.getElementsByClassName(
            "events-table"
        )[0];
        if (eventsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                eventsTable,
                {
                    tableRows: eventsList,
                    columnNames: [
                        "eventId:ID",
                        "type:Tipo de evento",
                        "datetime:Fecha y hora",
                        "mandatory:Obligatorio",
                    ],
                    /*columnClasses: [
                        "eventId:centered",
                        "mandatory:centered",
                    ],*/
                },
            );
            eventsTable.classList.remove("not-displayed");
        } else eventsTable.classList.add("not-displayed");

    }, [eventsList]);

    // Obtiene las cursadas de la comisión seleccionada.
    useEffect(async () => {

        // Evita que el primer render arroje una excepción porque course es null.
        if (!course) return;

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // Realiza la petición al back para obtener la lista de eventos de la cursada.
        axios.get(
            `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-all-events?course-id=${course.getId()}`,
            {
                headers: {
                    Authorization: `Bearer ${auth0Token}`,
                },
            }
        )

        // Si la petición fue exitosa, se guarda la información obtenida.
        .then(response => {
            //setEventosCursada(response.data);

            setEventsList(response.data.eventList.map(event => {
                return {
                    eventId: event.eventId,
                    type: event.type,
                    datetime: getFormattedDateAndTime(event.initialDateTime, event.endDateTime),
                    mandatory: event.mandatory,
                }
            }));

        })

        // Si la petición no fue exitosa, se genera una excepción.
        .catch(
            error => error.response
        );

    }, [course]);

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
            document.getElementById("events-table"),
            "Asistencia",
            "asistencia"
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Eventos de la cursada
            </h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            {eventsList && (
                <div>
                    <table id="events-table" className="events-table table-container not-displayed"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={handleExport}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
        </PageLayout>
    );
};
