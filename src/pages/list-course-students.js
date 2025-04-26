// Componentes externos.
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useHistory } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";

// Estilos.
import '../styles/search-student.css';

export const ListCourseStudents = () => {
    const [studentsList, setStudentsList] = useState([]);
    const [, changeCourse] = useSelectedCourse(true);
    const { getAccessTokenSilently } = useAuth0();
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

    // Actualiza la tabla.
    useEffect(() => {

        let eventsTable = document.getElementsByClassName(
            "students-table"
        )[0];
        if (studentsList.length !== 0) {
            HTMLTableManipulator.insertDataIntoTable(
                eventsTable,
                {
                    tableRows: studentsList,
                    columnNames: [
                        "dossier:legajo",
                        "id:DNI",
                        "name:Nombre",
                        "email:Email",
                        "alreadyStudied:Recursante",
                        "allPreviousSubjectsApproved:Correlativas",
                        "finalCondition:Condición final",
                    ],
                },
            );
            eventsTable.classList.remove("not-displayed");
        } else eventsTable.classList.add("not-displayed");

    }, [studentsList]);

    // Obtiene la lista de estudiantes de la cursada seleccionada.
    useEffect(() => {
        
        const getCourseStudents = async () => {

            // Evita que el primer render arroje una excepción porque course es null.
            if (!course) return;

            try {

                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

                // Realiza la petición al back para obtener la lista de alumnos de la cursada.
                await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-students?courseId=${course.getId()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                )

                // Si la petición fue exitosa, se guarda la información obtenida.
                .then(response => {

                    setStudentsList(response.data.studentsList.map(student => {
                        return {
                            dossier: student.dossier,
                            id: student.id,
                            name: student.name,
                            email: student.email,
                            alreadyStudied: student.alreadyStudied,
                            allPreviousSubjectsApproved:
                                student.allPreviousSubjectsApproved == true
                                ? 'P'
                                : false,
                            finalCondition: student.finalCondition,
                        }
                    }));

                })

                // Si la petición no fue exitosa, se genera una excepción.
                .catch(
                    error => error.response
                );

            } catch (error) {
                console.error("Error al obtener la lista de estudiantes:", error);
            }

        }
        getCourseStudents();

    }, [course]);

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {
        spreadsheetManipulator.export(
            document.getElementById("students-table"),
            "Estudiantes de la cursada",
            "estudiantes-cursada"
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Alumnos de la cursada
            </h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            {studentsList && (
                <div>
                    <table id="students-table" className="students-table table-container not-displayed"></table>
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
