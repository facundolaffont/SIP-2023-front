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
import '../styles/show-criteria-summary.css';

export const ShowCriteriaSummary = () => {
    const [criteriaList, setCriteriaList] = useState([]);
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
            window.location.replace(`${process.env.REACT_APP_DOMAIN_URL}/profile?course-missing`);

    });

    // Actualiza la tabla.
    useEffect(() => {

        let criteriaTable = document.getElementsByClassName(
            "criteria-table"
        )[0];
        if (criteriaList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                criteriaTable,
                {
                    tableRows: criteriaList,
                    columnNames: [
                        "criteria:Criterio",
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
            criteriaTable.classList.remove("not-displayed");
        } else criteriaTable.classList.add("not-displayed");

    }, [criteriaList]);

    // Obtiene el resumen de los criterios respecto de la comisión seleccionada.
    useEffect(async () => {

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // Realiza la petición al back para obtener el resumen de criterios.
        axios.get(
            `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-criteria-summary?course-id=${course.getId()}`,
            {
                headers: {
                    Authorization: `Bearer ${auth0Token}`,
                },
            }
        )

        // Si la petición fue exitosa, se guarda la información obtenida.
        .then(response => {

            setCriteriaList(response.data.criteriaList.map(event => {
                return {
                    eventId: event.eventId,
                    type: event.type,
                    //datetime: getFormattedDateAndTime(event.initialDateTime, event.endDateTime),
                    mandatory: event.mandatory,
                }
            }));

        })

        // Si la petición no fue exitosa, se genera una excepción.
        .catch(
            error => error.response
        );

    }, []); // El array vacío asegura que el efecto se ejecute solo una vez después del montaje del componente.

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {
        spreadsheetManipulator.export(
            document.getElementById("criteria-table")
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Resumen de criterios
            </h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            {criteriaList && (
                <div>
                    <table id="criteria-table" className="criteria-table not-displayed"></table>
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
