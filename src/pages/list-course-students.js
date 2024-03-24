import React, { useState, useEffect } from "react";
import { PageLayout } from "../components/page-layout";
import '../styles/search-student.css';
import { useSelectedCourse } from "../contexts/course/course-provider.js";

export const ListCourseStudents = () => {
  const [estudiantesCursada, setData] = useState(null);
  /** @type {CourseDTO} */ const course = useSelectedCourse(false);

  useEffect(() => {
    // Realizar la solicitud al backend cuando el componente se monta
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/getStudents?courseId=${course.getId()}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        // Verificar si se encontró un alumno
        if (data) {
          // Establecer la información del alumno
          setData(data.estudiantesCursada);
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
  }, []); // El array vacío asegura que el efecto se ejecute solo una vez después del montaje del componente

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">
        Alumnos Asociados
      </h1>
    {estudiantesCursada && (
        <div>
          <table className="condition-table">
            <thead>
              <tr>
                <th>Legajo</th>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Apellido</th>
              </tr>
            </thead>
            <tbody>
              {estudiantesCursada.map(estudianteCursada => (
                <tr key={estudianteCursada.id}>
                  <td>{estudianteCursada.alumno.legajo}</td>
                  <td>{estudianteCursada.alumno.dni}</td>
                  <td>{estudianteCursada.alumno.nombre}</td>
                  <td>{estudianteCursada.alumno.apellido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};
