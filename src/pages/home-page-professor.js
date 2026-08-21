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
    const [coursesList, setCoursesList] = useState([]);

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

            // Actualizamos el estado para saber si mostramos el EmptyState y renderizamos
            setHasCourses(userCourses.data.length > 0);
            setCoursesList(userCourses.data);

        }
        getUserCourses();

    }, [getAccessTokenSilently, changeCourse]);

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
            <div className="cursadas-grid">
                {coursesList.length > 0 && (
                    <div className="cuadro-cursada-grid cuadro-cursada-header">
                        <div className="cursada-col">Carrera</div>
                        <div className="cursada-col">Asignatura</div>
                        <div className="cursada-col" style={{ textAlign: 'center' }}>Comisión</div>
                        <div className="cursada-col" style={{ textAlign: 'center' }}>Año</div>
                    </div>
                )}
                {coursesList.map((cursada, index) => (
                    <div
                        key={index}
                        className="cuadro-cursada-grid"
                        onClick={() => changeCourse(CourseDTO.createFrom(cursada))}
                    >
                        <div className="cursada-col cursada-carrera">
                            {cursada.nombreCarrera}
                        </div>
                        <div className="cursada-col cursada-asignatura">
                            {cursada.nombreAsignatura} ({cursada.codigoAsignatura})
                        </div>
                        <div className="cursada-col cursada-comision">
                            Com. {cursada.numeroComision}
                        </div>
                        <div className="cursada-col cursada-anio">
                            {cursada.anio}
                        </div>
                    </div>
                ))}
            </div>

            {hasCourses === false && (
                <div style={{ marginTop: '30px' }}>
                    <EmptyState message="No hay cursadas asociadas actualmente." />
                </div>
            )}
        </PageLayout>
    );
};
