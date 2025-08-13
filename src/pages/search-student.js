// Componentes externos.
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

// Estilos.
import '../styles/search-student.css';

export const SearchStudent = () => {
    const [legajo, setLegajo] = useState("");
    const [dataAlumno, setDataAlumno] = useState(null);
    const [eventos, setEventos] = useState(null);
    const [dataCursada, setDataCursada] = useState(null);
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

    const handleLegajoChange = (event) => {
        setLegajo(event.target.value);
    };

    const handleSearch = () => {
        
        // Realizar la solicitud al backend
        fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/getStudent?courseId=${course.getId()}&dossier=${legajo}`)
            .then(response => response.json())
            .then(data => {
                
                // Verificar si se encontró un alumno
                if (data) {
                    // Establecer la información del alumno
                    setDataAlumno(data.estudiante);
                    setEventos(data.eventos);
                    setDataCursada(data.datosCursada);
                } else {
                    // Si no se encontró el alumno, mostrar un mensaje de error o manejarlo según tu necesidad
                    console.log("No se encontró ningún alumno con ese legajo.");
                    // También podrías establecer un mensaje de error para mostrar al usuario
                }
            })
            .catch(error => {
                console.error("Error al realizar la búsqueda del alumno:", error);
                // Manejar el error según tu necesidad (mostrar un mensaje al usuario, registrar el error, etc.)
            });
    };

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {
        spreadsheetManipulator.export(
            document.getElementById("condition-table"),
            "Registros de alumno en cursada",
            "registro-alumno-cursada"
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Consultar eventos por alumno
            </h1>
            <div>
                <input
                    type="text"
                    placeholder="Ingrese el legajo del alumno"
                    value={legajo}
                    onChange={handleLegajoChange}
                />
                <button onClick={handleSearch}>Buscar</button>
            </div>
            {dataAlumno && dataCursada && (
                <div className="alumno-info-container">
                    <h2>Información del Alumno</h2>
                    <p><span className="data-label">Nombre:</span> <span className="data-value">{dataAlumno.nombre}</span></p>
                    <p><span className="data-label">Email:</span> <span className="data-value">{dataAlumno.email}</span></p>
                    <p><span className="data-label">DNI:</span> <span className="data-value">{dataAlumno.dni}</span></p>
                    <p><span className="data-label">Correlativas aprobadas:</span> <span className={`data-value ${dataCursada.previousSubjectsApproved ? 'yes' : 'no'}`}>{dataCursada.previousSubjectsApproved ? 'Sí' : 'No'}</span></p>
                    <p><span className="data-label">Recursante:</span> <span className={`data-value ${dataCursada.recursante ? 'yes' : 'no'}`}>{dataCursada.recursante ? 'Sí' : 'No'}</span></p>
                </div>

            )}
            {eventos && (
                <div className="student-events-table-container">
                    <h2>Eventos del Alumno</h2>
                    <table id="condition-table" class="student-events-table">
                        <thead>
                            <tr>
                                <th>Tipo de Evento</th>
                                <th>Fecha de Inicio</th>
                                <th>Fecha de Fin</th>
                                <th>Asistencia</th>
                                <th>Nota</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventos.map(evento => (
                                <tr key={evento.id}>
                                    <td>{evento.eventoCursada.tipoEvento.nombre}</td>
                                    <td>{evento.eventoCursada.fechaHoraInicio}</td>
                                    <td>{evento.eventoCursada.fechaHoraFin}</td>
                                    <td>{evento.asistencia ? 'Sí' : 'No'}</td>
                                    <td>{evento.nota !== null ? evento.nota : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
