// // Imports internos.
// import { PageLayout } from "../components/page-layout";
// import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
// import HTMLTableManipulator from "../services/html-table-manipulator";
// import { useSelectedCourse } from "../contexts/course/course-provider.js";
// import CourseDTO from "../contexts/course/course-d-t-o";

// // Estilos.
// import "../styles/components/table.css";
// import "../styles/register-students.css";

// export function StudentRegistering() {
//     const [fileName, setFileName] = useState("");
//     const [fileHandle, setFileHandle] = useState(null);
//     const [sheetNameValue, setSheetNameValue] = useState("");
//     const [cellRangeName, setCellRangeName] = useState("");
//     const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
//     const [okStudentsList, setOkStudentsList] = useState([]);
//     const [notOkStudentsList, setNotOkStudentsList] = useState([]);
//     const [invalidRegistersList, setInvalidRegistersList] = useState([]);
//     const [tableManualUpdateTrigger, setTableManualUpdateTrigger] = useState(true);
//     const [error, setError] = useState(null);
    


// Imports externos.
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import React, { useEffect } from "react";

// Imports internos.
import { PageLayout } from "../components/page-layout";

export const ModificateCriterion = () => {
    const [criterias, setCriterias] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    const [editedCriterias, setEditedCriterias] = useState([]);
    const [sortedFinalConditions, setSortedFinalConditions] = useState([]);

    console.debug("Antes de useEffect");

    useEffect(async () => {

        console.debug("Dentro de useEffect");

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => response)
            .catch(error => {
                throw error;
            });

        // 2
        await axios
            .get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/evaluationCriterias?courseId=1`,
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .then(criteria => {
                setCriterias(criteria.data);
            })
            .catch(error => error.response);

        
        //     // Enviamos petición al backend para obtener los criterios de evaluación asociados a la cursada
        //     fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/evaluationCriterias?courseId=1`, {
        //       method: "GET",
        //       headers: {
        //         "Content-Type": "application/json",
        //       },
        //     })
        //       .then((response) => response.json())
        //       .then((criteria) => {
        //         // Aquí puedes hacer algo con los criterios recibidos, como actualizar el estado del componente
        //         console.log(criteria);
        //         setCriterias(criteria);
        //       })
        //       .catch((error) => console.error(error));

    }, []);

    console.debug("Antes de handleSubmit");

    const handleSubmitChanges = (index) => {
        
        console.log("dentro de handleSubmitChanges");
        
        const criteriaToSave = criterias[index];
        console.log("ddd" + criteriaToSave);
        // Prepara los datos para enviar al backend (según tus necesidades)
        const criteria = {
            id: criteriaToSave.id,
            course: criteriaToSave.course,
            criteria: criteriaToSave.criteria,
            value_to_regulate: criteriaToSave.value_to_regulate,
            value_to_promote: criteriaToSave.value_to_promote,
        };

        // Envia el criterio actualizado al backend
        fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(criteria),
        })
        .then((response) => response)
        .then((data) => console.log(data))
        .catch((error) => console.error(error));
    };

    const handleDeleteCriteria = (index) => {
        try {
            
            const criteriaToDelete = criterias[index];
            console.log("criterio a eliminar:" + criteriaToDelete);
            console.log("criterio a eliminar:" + criteriaToDelete.criteria);
            // Prepara los datos adicionales que deseas enviar al backend
            const criteria = {
                id: criteriaToDelete.id,
                course: criteriaToDelete.course,
                criteria: criteriaToDelete.criteria,
                value_to_regulate: criteriaToDelete.value_to_regulate,
                value_to_promote: criteriaToDelete.value_to_promote,
            };
            console.log("dts" + criteriaToDelete.JSON);

            // Envia el criterio a borrar al backend
            fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(criteria),
            })
            .then((response) => response)
            .then((data) => console.log(data))
            .catch((error) => console.error(error));
    
            // Actualiza el estado para reflejar el cambio
            //const updatedCriterias = criterias.filter(criteria => criteria.criteria.id !== criteriaToDelete.criteria.id);
            //setCriterias(updatedCriterias);
    
        } catch (error) {
            console.error("Error al eliminar el criterio:", error);
        }
    };
    


    console.debug("Antes de return");

    return (
        <PageLayout>
        {console.debug("Dentro de return")}
            <h1 id="page-title" className="content__title">Criterios de evaluación</h1>
            <form>
                <table className="criteria-table">
                    <thead>
                        <tr>
                            <th>Criterio</th>
                            <th>Valor para regular</th>
                            <th>Valor para promover</th>
                            <th>Acciones</th> {/* Nuevo encabezado para los botones */}
                        </tr>
                    </thead>
                    <tbody>
                        {console.debug("Antes de criterias.map")}
                        {criterias.map((criteria, index) => {
                        const isEdited = editedCriterias[index];

                        return (
                            <tr key={index}>
                                <td>{criteria.criteria.name}</td>
                                <td>
                                    {isEdited ? (
                                        <input
                                            type="text"
                                            value={criteria.value_to_regulate}
                                            onChange={(e) => {
                                                const newCriterias = [...criterias];
                                                newCriterias[index].value_to_regulate = e.target.value;
                                                setEditedCriterias(newCriterias);
                                            }}
                                        />
                                    ) : (
                                        criteria.value_to_regulate
                                    )}
                                </td>
                                <td>
                                    {isEdited ? (
                                        <input
                                            type="text"
                                            value={criteria.value_to_promote}
                                            onChange={(e) => {
                                                const newCriterias = [...criterias];
                                                newCriterias[index].value_to_promote = e.target.value;
                                                setEditedCriterias(newCriterias);
                                            }}
                                        />
                                    ) : (
                                        criteria.value_to_promote
                                    )}
                                </td>
                                <td>
                                    {isEdited ? (
                                        <button
                                            onClick={(event) => {
                                                // Guarda los cambios y elimina la edición
                                                event.preventDefault();
                                                const newCriterias = [...criterias];
                                                newCriterias[index] = editedCriterias[index];
                                                setCriterias(newCriterias);
                                                console.log("Estado criterias actualizado:", newCriterias); // Agregar esta línea
                                                setEditedCriterias([]);
                                                handleSubmitChanges(index);
                                            }}
                                        >
                                            Guardar
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    const newEditedCriterias = [...editedCriterias];
                                                    newEditedCriterias[index] = { ...criteria };
                                                    setEditedCriterias(newEditedCriterias);
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    const newCriterias = criterias.filter((_, i) => i !== index);
                                                    handleDeleteCriteria(index);
                                                 //   console.log(criterias[index]);
                                                    setCriterias(newCriterias);
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </form>

        </PageLayout>
    );
}
