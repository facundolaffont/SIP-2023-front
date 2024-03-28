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

export const HomePageProfessor = () => {
    const [, changeCourse] = useSelectedCourse(true);
    const { getAccessTokenSilently } = useAuth0();

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

        // Iterar sobre las cursadas y crear un cuadro para cada una
        userCourses.data.forEach((cursada, index) => {
            const cuadroCursada = document.createElement('div');
            cuadroCursada.classList.add('cuadro-cursada');
            // Agregar un atributo de datos para almacenar el índice de la cursada
            cuadroCursada.setAttribute('data-index', index);

            // Mostrar los detalles de la cursada dentro del cuadro
            const nombreCursada = document.createElement('h3');
            nombreCursada.textContent = `Nombre de la Asignatura: ` + cursada.nombreAsignatura;

            const detallesCursada = document.createElement('p');
            detallesCursada.textContent = `Año de la cursada: ${cursada.anio}, Numero de Comision: ${cursada.numeroComision}`;

            cuadroCursada.appendChild(nombreCursada);
            cuadroCursada.appendChild(detallesCursada);

            // Agregar un evento de clic al cuadro de la cursada
            cuadroCursada.addEventListener('click', () => {

                // Obtener el índice de la cursada seleccionada
                const selectedIndex = parseInt(cuadroCursada.getAttribute('data-index'), 10);

                const selectedCursada = userCourses.data[selectedIndex];
                changeCourse(CourseDTO.createFrom(selectedCursada));

            });
            cursadasContainer.appendChild(cuadroCursada);

        });

    });

    return (
        <PageLayout>
            <h1 className="content__title">Mis Asignaturas</h1>
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
