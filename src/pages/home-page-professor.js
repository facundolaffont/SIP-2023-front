// Imports externos.
import React from "react";
import { useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

// Imports internos.
import { PageLayout } from "../components/page-layout";
import CourseDTO from "../contexts/course/course-d-t-o";
import { useSelectedCourse } from "../contexts/course/course-provider";

// Estilos.
import "../styles/components/system-messages.css";
import "../styles/home-page-professor.css"

export const HomePageProfessor = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [, changeCourse] = useSelectedCourse(true);
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);

    const urlSearchParams = new URLSearchParams(window.location.search);
    const isRedirected = urlSearchParams.has("redirected");

    useEffect(async () => {

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => { throw error; });

        // Obtiene las cursadas del docente.
        const userCourses = await axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/getProfessorCourses`,
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
            .catch(error => { throw error; }
            );

        // Obtiene y limpia el contenedor HTML de las cursadas.
        const cursadasContainer = document.getElementById('cursadas-container');
        cursadasContainer.innerHTML = '';

        // Iterar sobre las cursadas y crear un cuadro para cada una.
        userCourses.data.forEach((cursada, index) => {

            const cuadroCursada = document.createElement('div');
            cuadroCursada.classList.add('cuadro-cursada');

            // Agrega un atributo de datos para almacenar el índice del elemento gráfico que representa una cursada (https://www.w3schools.com/TAGS/att_data-.asp).
            cuadroCursada.setAttribute('data-index', index);

            // Muestra los detalles de la cursada dentro del cuadro.
            const nombreCursada = document.createElement('h3');
            const detallesCursada = document.createElement('p');
            nombreCursada.textContent = `Asignatura: ` + cursada.nombreAsignatura;
            detallesCursada.textContent = `Año de la cursada: ${cursada.anio} - Número de comisión: ${cursada.numeroComision}`;
            cuadroCursada.appendChild(nombreCursada);
            cuadroCursada.appendChild(detallesCursada);

            // Agrega un evento de clic al cuadro de la cursada.
            cuadroCursada.addEventListener('click', () => {

                // Obtiene la cursada seleccionada.
                const selectedIndex = parseInt(cuadroCursada.getAttribute('data-index'), 10);
                const selectedCursada = userCourses.data[selectedIndex];
                changeCourse(CourseDTO.createFrom(selectedCursada));

            });
            cursadasContainer.appendChild(cuadroCursada);

        });

    });

    return (
        <PageLayout>
            <h1 className="content__title">Comisiones asociadas</h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            {isRedirected && (
            <div className="info-msg-container">
                <div className="info-msg-desc-container">
                    <p className="info-msg-description">Usted fue redirigido porque debe seleccionar una cursada para operar en la página en la que estaba.</p>
                    <p className="info-msg-description">Seleccione una cursada y diríjase nuevamente a dicha página.</p>
                </div>
            </div>
            )}
            <div id="cursadas-container">
            </div>
        </PageLayout>
    );
};
