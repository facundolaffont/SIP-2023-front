// Componentes externos.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';
import * as XLSX from "xlsx";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { Table } from "../components/Table";
import { LoadingState } from "../components/LoadingState";
import CourseDTO from "../contexts/course/course-d-t-o.js";

// Estilos.
import '../styles/show-all-events-registers.css';

export const ShowAllEventsRegisters = () => {

    const { getAccessTokenSilently } = useAuth0();

    const [eventsDetailsList, setEventsDetailsList] = useState([]);
    const [loading, setLoading] = useState(true);

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

    /**
     * Actualiza un arreglo con los datos de las cursadas.
     */
    useEffect(() => {

        // Evita que el primer render arroje una excepción porque course es null.
        if (!course) return;

        // Realizar la solicitud al backend.
        const getEventsDetails = async () => {
            setLoading(true);
            try {
                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently();

                // Realiza la petición.
                const eventsDetails = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-events-details?course-id=${course.getId()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                );

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
            } catch (error) {
                console.error("Error obteniendo detalles de eventos:", error);
            } finally {
                setLoading(false);
            }
        }
        getEventsDetails();

    }, [course]);

    const tableColumns = [
        { header: "ID", accessor: "eventId", align: "center", sortable: true },
        { header: "Tipo de evento", accessor: "eventType", align: "left", sortable: true, filterable: true },
        { header: "Fecha y horario", accessor: "datetime", align: "left", sortable: true },
        { header: "Legajo", accessor: "studentDossier", align: "center", sortable: true, filterable: true },
        { header: "DNI", accessor: "studentId", align: "center", sortable: true, filterable: true },
        { header: "Nombre", accessor: "studentName", align: "left", sortable: true, filterable: true },
        {
            header: "Asistencia",
            accessor: "attendance",
            align: "center",
            sortable: true,
            render: (row) => {
                if (row.attendance === true) return "Sí";
                if (row.attendance === false) return "No";
                return row.attendance || "-";
            }
        },
        {
            header: "Nota",
            accessor: "note",
            align: "center",
            sortable: true,
            render: (row) => row.note || "-"
        }
    ];

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



    const handleExportExcel = () => {
        const flatData = eventsDetailsList.map(item => {
            let asistenciaText = "-";
            if (item.attendance === true) asistenciaText = "Sí";
            else if (item.attendance === false) asistenciaText = "No";
            else if (item.attendance) asistenciaText = item.attendance;

            return {
                "ID": item.eventId,
                "Tipo de evento": item.eventType,
                "Fecha y horario": item.datetime,
                "Legajo": item.studentDossier,
                "DNI": item.studentId,
                "Nombre": item.studentName,
                "Asistencia": asistenciaText,
                "Nota": item.note || "-"
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");
        XLSX.writeFile(workbook, "detalle-eventos-cursada.xlsx");
    };

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Listar detalle de eventos
            </h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            {loading ? (
                <LoadingState message="Cargando detalles de eventos, por favor espere..." />
            ) : (
                <div id="table-container-export" className="table-container">
                    <Table
                        columns={tableColumns}
                        data={eventsDetailsList}
                        paginate={true}
                        itemsPerPage={200}
                    />
                    {eventsDetailsList && eventsDetailsList.length > 0 && (
                        <button
                            type="button"
                            className="export-button"
                            style={{ marginTop: '15px' }}
                            onClick={handleExportExcel}
                        >
                            Exportar a Excel
                        </button>
                    )}
                </div>
            )}
        </PageLayout>
    );
};
