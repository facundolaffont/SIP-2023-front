import React, { useState } from "react";
import { PageLayout } from "../components/page-layout";
import '../styles/search-student.css';
import { useSelectedCourse } from "../contexts/course/course-provider.js";

export const SearchStudent = () => {
  const [legajo, setLegajo] = useState("");
  const [dataAlumno, setDataAlumno] = useState(null);
  const [eventos, setEventos] = useState(null);
  const [dataCursada, setDataCursada] = useState(null);
  /** @type {CourseDTO} */ const course = useSelectedCourse(false);


  const handleLegajoChange = (event) => {
    setLegajo(event.target.value);
  };

  const handleSearch = () => {
    // Realizar la solicitud al backend
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/getStudent?courseId=${course.getId()}&dossier=${legajo}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
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

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">
        Buscar Alumno
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
        <p><span className="data-label">Apellido:</span> <span className="data-value">{dataAlumno.apellido}</span></p>
        <p><span className="data-label">Email:</span> <span className="data-value">{dataAlumno.email}</span></p>
        <p><span className="data-label">DNI:</span> <span className="data-value">{dataAlumno.dni}</span></p>
        <p><span className="data-label">Correlativas Aprobadas?</span> <span className={`data-value ${dataCursada.previousSubjectsApproved ? 'yes' : 'no'}`}>{dataCursada.previousSubjectsApproved ? 'Sí' : 'No'}</span></p>
        <p><span className="data-label">Recursante?</span> <span className={`data-value ${dataCursada.recursante ? 'yes' : 'no'}`}>{dataCursada.recursante ? 'Sí' : 'No'}</span></p>
        </div>

      )}
    {eventos && (
        <div>
          <h2>Eventos del Alumno</h2>
          <table class="condition-table">
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
        </div>
      )}
    </PageLayout>
  );
};
