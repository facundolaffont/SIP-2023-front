// Componentes externos.
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";

// Estilos.
import '../styles/search-event.css';

export const SearchEvent = () => {

    const { getAccessTokenSilently } = useAuth0();

    const [eventId, setEventId] = useState("");
    const [eventRegistersList, setEventRegistersList] = useState([]);

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    // Inicializa el objeto que manipula las planillas.
    useState(() => {

        setSpreadsheetManipulator(new SpreadsheetManipulator());

    }, []);

    // Actualiza la tabla.
    useEffect(() => {

        let tableContainer = document.getElementsByClassName(
            "table-container"
        )[0];
        let table = document.getElementsByClassName(
            "table"
        )[0];
        if (eventRegistersList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                table,
                {
                    tableRows: eventRegistersList,
                    columnNames: [
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

    }, [eventRegistersList]);

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    const handleLegajoChange = (event) => {
        setEventId(event.target.value);
    };

    const handleSearch = () => {

        // Realizar la solicitud al backend.
        const getEventInfo = async () => {

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
            .catch(error => {
                throw error;
            });

            // Realiza la petición.
            const eventInfoResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-event-info?event-id=${eventId}`,
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .catch(error => {
                throw error;
            });

            // Muestra la lista recibida por tabla.
            setEventRegistersList(eventInfoResponse.data.eventRegistersList);

        }
        getEventInfo();

    };

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {
        spreadsheetManipulator.export(
            document.getElementById("table"),
            "Detalle de evento",
            "detalle-evento"
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Consultar evento
            </h1>
            <div>
                <input
                    type="text"
                    placeholder="Ingrese el identificador del evento"
                    value={eventId}
                    onChange={handleLegajoChange}
                />
                <button onClick={handleSearch}>Buscar</button>
            </div>
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
