// Imports externos.
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import React, { useEffect } from "react";

// Imports internos.
import { PageLayout } from "../components/page-layout";

export const FinalCondition = () => {
    const [criterias, setCriterias] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    const [sortedFinalConditions, setSortedFinalConditions] = useState([]);
    const [saveMessage, setSaveMessage] = useState("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {

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

    }, [getAccessTokenSilently]);

    const handleSubmit = async (event) => {

        event.preventDefault();

        // Obtiene el token Auth0.
        const auth0Token = await getAccessTokenSilently()
            .then(response => {
                return response;
            })
            .catch(error => {
                throw error;
            });

        // Enviamos petición al back para calcular condicion final de los alumnos de la cursada
        fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/finalCondition?courseId=1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth0Token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
              //  setFinalConditions(data);

                const sortedConditions = data.sort((a, b) => a.Legajo - b.Legajo);
                setSortedFinalConditions(sortedConditions);

            })
            .catch((error) => console.error(error));

    }

    const handleSaveChanges = async () => {
        const auth0Token = await getAccessTokenSilently().catch(error => {
            throw error;
        });

        if (sortedFinalConditions) {
            console.log(sortedFinalConditions);
            const dataToSend = {
                courseId: 1, // ID de la cursada
                finalConditions: sortedFinalConditions.map(student => ({
                    legajo: student.Legajo,
                    nota: student.Condición // Asegúrate de que "Nota" sea el nombre correcto de la propiedad que representa la nota del estudiante
                }))
            };

            // Envía los datos al backend
            axios.post(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/saveFinalConditions`, dataToSend, {
                headers: {
                    Authorization: `Bearer ${auth0Token}`,
                    "Content-Type": "application/json"
                }
            }).then(response => {
                console.log("Cambios guardados exitosament", response.data);
                setSaveMessage("¡Cambios guardados exitosamente!");
            }).catch(error => {
                console.error("Error al guardar cambios:", error);
                setSaveMessage("¡Error al guardar cambios!");
            });
        } else {
            console.warn("No hay datos para enviar al backend.");
        }
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Condición Final</h1>
            <form onSubmit={handleSubmit}>
                <p>Se evaluará la condicion final de los estudiantes según los siguientes criterios:</p>
                <table className="criteria-table">
                    <thead>
                        <tr>
                            <th>Criterio</th>
                            <th>Valor para regular</th>
                            <th>Valor para promover</th>
                        </tr>
                    </thead>
                    <tbody>
                        {console.debug("Antes de criterias.map")}
                        {criterias.map((criteria, index) => (
                            <tr key={index}>
                                <td>{criteria.criteria.name}</td>
                                <td>
                                    {criteria.criteria.name !== 'Promedio de parciales'
                                        ? `${criteria.value_to_regulate} %`
                                        : criteria.value_to_regulate}
                                </td>
                                <td>
                                    {criteria.criteria.name !== 'Promedio de parciales'
                                        ? `${criteria.value_to_promote} %`
                                        : criteria.value_to_promote}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="submit" className="calculate-button">Calcular Condicion Final de Alumnos</button>
            </form>

            {/* Mostrar la tabla de condiciones finales */}
            {sortedFinalConditions.length > 0 && (
                <div>
                    <h2>Condiciones Finales de Alumnos (Ordenadas por legajo)</h2>
                    <table className="condition-table">
                        <thead>
                            <tr>
                                <th>Legajo</th>
                                {criterias.map((criteria, index) => (
                                    <th>{criteria.criteria.name}</th>
                                ))}
                                <th>Condición Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFinalConditions.map((student, index) => (
                                <tr key={index}>
                                    <td>{student.Legajo}</td>
                                    {criterias.map((criteria, criteriaIndex) => {
                                        const conditionObj = student.Detalle.find(
                                            (item) => item.Criterio === criteria.criteria.name
                                        );
                                        const condition = conditionObj ? conditionObj.Condición : "N/A";

                                        let cellClassName = "normal-cell"; // Clase por defecto

                                        if (condition === "L") {
                                            cellClassName = "red-cell"; // Si el contenido es L, aplicamos la clase "red-cell"
                                        } else if (condition === "R") {
                                            cellClassName = "yellow-cell"; // Si el contenido es R, aplicamos la clase "yellow-cell"
                                        } else if (condition === "P") {
                                            cellClassName = "green-cell"; // Si el contenido es P, aplicamos la clase "green-cell"
                                        } else if (condition === "N/A") {
                                            cellClassName = "common-cell"
                                        }

                                        return (
                                            <td key={criteriaIndex} className={cellClassName}>
                                                {condition} {/* Mostrar la condición específica del criterio para cada estudiante */}
                                            </td>
                                        );
                                    })}
                                    <td className="condition-cell">{student.Condición}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="button-container">
                        <button type="button" onClick={handleSaveChanges}>Guardar Cambios</button>
                        {saveMessage && <p>{saveMessage}</p>}
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
