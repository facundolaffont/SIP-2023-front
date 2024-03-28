// Imports externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

// Imports internos.
import { PageLayout } from "../components/page-layout.js";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import HTMLTableManipulator from "../services/html-table-manipulator";

// Estilos.
import '../styles/search-student.css';

export const ListCourseEvents = () => {
    //const [eventosCursada, setEventosCursada] = useState(null);
    const [eventsList, setEventsList] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

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
                //`Eventos de la cursada con ID ${course.getId()}`
            );
            eventsTable.classList.remove("not-displayed");
        } else eventsTable.classList.add("not-displayed");

    }, [eventsList]);

    // Obtiene las cursadas de la comisión seleccionada.
    useEffect(async () => {

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // Realiza la petición al back para obtener la lista de eventos de la cursada.
        axios.get(
            `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-events?course-id=${course.getId()}`,
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

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Eventos asociados a la cursada ID {course.getId()}
            </h1>
            {eventsList && (
                <div>
                    <table className="events-table table-container not-displayed"></table>
                </div>
                /*<div>
                    <table className="events-table">
                        <thead>
                            <tr>
                                <th>Identificador de evento</th>
                                <th>Tipo de evento</th>
                                <th>Fecha y hora</th>
                                <th>Obligatorio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventosCursada.eventList.map(eventoCursada => (
                                <tr key={eventoCursada.eventId}>
                                    <td>{eventoCursada.eventId}</td>
                                    <td>{eventoCursada.type}</td>
                                    <td>{getFormattedDateAndTime(
                                        eventoCursada.initialDateTime,
                                        eventoCursada.endDateTime
                                    )}</td>
                                    <td>{eventoCursada.mandatory == true ? 'x' : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>*/
            )}
        </PageLayout>
    );
};
