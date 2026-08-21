// Imports externos.
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

// Imports internos.
import { PageLayout } from "../components/page-layout";
import CourseDTO from "../contexts/course/course-d-t-o";
import { useSelectedCourse } from "../contexts/course/course-provider";
import EmptyState from "../components/EmptyState";

// Estilos.
import "../styles/components/system-messages.css";
import "../styles/home-page-professor.css";

// Imagen de fondo
import aulaBackground from "../img/AULA1.jpg";

export const HomePageProfessor = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [, changeCourse] = useSelectedCourse(true);
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

    const urlSearchParams = new URLSearchParams(window.location.search);
    const courseMissing = urlSearchParams.has("course-missing");
    const noEvents = urlSearchParams.has("no-events");
    const [hasCourses, setHasCourses] = useState(null);

    // Estado para precargar la imagen y evitar que se vea cargando "de a pedazos"
    const [bgLoaded, setBgLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = aulaBackground;
        // Cuando la imagen termine de descargar en segundo plano, actualizamos el estado para mostrarla
        img.onload = () => setBgLoaded(true);
    }, []);

    useEffect(() => {

        // Obtiene las cursadas del docente.
        const getUserCourses = async () => {

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => { throw error; });

            // Solicita las cursadas del docente.
            const userCourses = await axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-professor-courses`,
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`
                    }
                })
                .then(response => {

                    // Arroja un error si la petición no fue exitosa.
                    if (response.status !== 200) throw new Error(`${response.status}: ${response.statusText}`);

                    // Devuelve el contenido de la respuesta.
                    return response;

                })
                .catch(
                    error => { throw error; }
                );

            // Obtiene y limpia el contenedor HTML de las cursadas.
            const cursadasContainer = document.getElementById('cursadas-container');
            cursadasContainer.innerHTML = '';

            // Actualizamos el estado para saber si mostramos el EmptyState
            setHasCourses(userCourses.data.length > 0);

            // Iterar sobre las cursadas y crear un cuadro para cada una.
            userCourses.data.forEach((cursada, index) => {

                const cuadroCursada = document.createElement('div');
                cuadroCursada.classList.add('cuadro-cursada');

                // Agrega un atributo de datos para almacenar el índice del elemento gráfico que representa una cursada (https://www.w3schools.com/TAGS/att_data-.asp).
                cuadroCursada.setAttribute('data-index', index);

                /* Muestra los detalles de la cursada dentro del cuadro. */
                const nombreCarrera = document.createElement('h2');
                const nombreCursada = document.createElement('h3');
                const detallesCursada = document.createElement('p');

                nombreCarrera.textContent = `${cursada.nombreCarrera}`;
                nombreCursada.textContent = `Asignatura: ${cursada.nombreAsignatura} (${cursada.codigoAsignatura})`;
                detallesCursada.textContent = `Año de la cursada: ${cursada.anio} - Número de comisión: ${cursada.numeroComision}`;

                cuadroCursada.appendChild(nombreCarrera);
                cuadroCursada.appendChild(nombreCursada);
                cuadroCursada.appendChild(detallesCursada);

                /**/

                // Agrega un evento de clic al cuadro de la cursada.
                cuadroCursada.addEventListener('click', () => {

                    // Obtiene la cursada seleccionada.
                    const selectedIndex = parseInt(cuadroCursada.getAttribute('data-index'), 10);
                    const selectedCursada = userCourses.data[selectedIndex];
                    changeCourse(CourseDTO.createFrom(selectedCursada));

                });
                cursadasContainer.appendChild(cuadroCursada);

            });

        }
        getUserCourses();

    });

    return (
        <PageLayout>
            {/* Contenedor que maneja el fondo de pantalla completo (debajo de todo) */}
            <div className={`home-page-professor-bg ${bgLoaded ? 'bg-loaded' : ''}`} />

            <h1 className="content__title">Cursadas disponibles</h1>
                <h2 className="selected-course-info">
                    {
                        course !== null && `Cursada seleccionada: ${course.getCareer()}, ${course.getSubject()} (${course.getSubjectCode()}), año ${course.getYear()}, comisión ${course.getCommission()}`
                    }
                    {
                        course === null && 'Sin cursada seleccionada'
                    }
                </h2>
                {courseMissing && (
                    <div className="info-msg-container">
                        <div className="info-msg-desc-container">
                            <p className="info-msg-description">Debe seleccionar una cursada para operar en la página en la que quiso ingresar.</p>
                            <p className="info-msg-description">Seleccione una cursada y diríjase nuevamente a dicha página.</p>
                        </div>
                    </div>
                )}
                {noEvents && (
                    <div className="info-msg-container">
                        <div className="info-msg-desc-container">
                            <p className="info-msg-description">La cursada seleccionada no tiene eventos.</p>
                            <p className="info-msg-description">Primero debe crear al menos un evento.</p>
                        </div>
                    </div>
                )}
                <div id="cursadas-container">
                </div>

                {hasCourses === false && (
                    <div style={{ marginTop: '30px' }}>
                        <EmptyState message="No hay cursadas asociadas actualmente." />
                    </div>
                )}
        </PageLayout>
    );
};
