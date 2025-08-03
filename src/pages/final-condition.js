// Imports externos.
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";

// Imports internos.
import { PageLayout } from "../components/page-layout";
import { PopoverDetalleCriterio } from "../components/PopoverDetalleCriterio";

import { useSelectedCourse } from "../contexts/course/course-provider.js";

export const FinalCondition = () => {
    const [criterias, setCriterias] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    const [sortedConditions, setSortedConditions] = useState([]);
    const [saveMessage, setSaveMessage] = useState("");
    const [editedConditions, setEditedConditions] = useState({}); // Estado para manejar las condiciones editadas
    const [errorMessage, setErrorMessage] = useState(""); // Estado para manejar mensajes de error
    const [editedObservations, setEditedObservations] = useState({});
    const [editingConditionLegajo, setEditingConditionLegajo] = useState(null); // Estado para almacenar el legajo de la celda seleccionada de condición final para editar
    const [editingObservationLegajo, setEditingObservationLegajo] = useState(null); // Estado para almacenar el legajo de la celda seleccionada de observaciones para editar
    const [calculationType, setCalculationType] = useState(null); // "cursada" o "final"
    const [showInfo, setShowInfo] = useState(false);
    const [infoText, setInfoText] = useState("");


    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');
        
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {

        const getEvaluationCriterias = async () => {

            // Evita que el primer render arroje una excepción porque course es null.
            if (!course) return;

            try {

                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

                await axios
                .get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/evaluationCriterias?courseId=${course.getId()}`,
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

            } catch (error) {
                console.error("Error al obtener los criterios de evaluación:", error);
            }

        }

        getEvaluationCriterias();

    }, [getAccessTokenSilently, course]);

    // const handleSubmit = async (event) => {

    //     event.preventDefault();

    //     // Obtiene el token Auth0.
    //     const auth0Token = await getAccessTokenSilently()
    //         .then(response => {
    //             return response;
    //         })
    //         .catch(error => {
    //             throw error;
    //         });

    //     // Enviamos petición al back para calcular condicion final de los alumnos de la cursada
    //     fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/finalCondition?courseId=${course.getId()}`, {
    //         method: "GET",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Authorization": `Bearer ${auth0Token}`,
    //         },
    //     })
    //         .then((response) => response.json())
    //         .then((data) => {
    //           //  setFinalConditions(data);

    //             const sortedConditions = data.sort((a, b) => a.Legajo - b.Legajo);
    //             setSortedConditions(sortedConditions);
    //             const initialEditedConditions = {};
    //             sortedConditions.forEach(student => {
    //                 initialEditedConditions[student.Legajo] = student.Condición;
    //             });
    //             setEditedConditions(initialEditedConditions);
    //         })
    //         .catch((error) => console.error(error));

    // }

    const handleSaveChanges = async () => {
        const auth0Token = await getAccessTokenSilently().catch(error => {
            throw error;
        });

        if (sortedConditions) {
            const dataToSend = {
                courseId: course.getId(),
                finalConditions: sortedConditions.map(student => ({
                    legajo: student.Legajo,
                    nota: editedConditions[student.Legajo] || student.Condición, // Utilizar la condición editada si existe
                    observaciones: editedObservations[student.Legajo] ?? ""
                }))
            };

            // Envía los datos al backend
            axios.post(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/saveFinalConditions`, dataToSend, {
                headers: {
                    Authorization: `Bearer ${auth0Token}`,
                    "Content-Type": "application/json"
                }
            }).then(response => {
                console.log("Cambios guardados exitosamente", response.data);
                setSaveMessage("¡Cambios guardados exitosamente!");
            }).catch(error => {
                console.error("Error al guardar cambios:", error);
                setSaveMessage("¡Error al guardar cambios!");
            });
        } else {
            console.warn("No hay datos para enviar al backend.");
        }
    }

    const handleEditCondition = (legajo) => {
        setEditingConditionLegajo(legajo);
    };

    const handleEditObservation = (legajo) => {
        setEditingObservationLegajo(legajo);
    };

    const handleConfirmCondition = () => {
        setEditingConditionLegajo(null);
    };

    const handleConfirmObservation = () => {
        setEditingObservationLegajo(null);
    };

    const handleCancelCondition = () => {
        setEditingConditionLegajo(null);
    };

    const handleCancelObservation = () => {
        setEditingObservationLegajo(null);
    };

    const handleConditionChange = (legajo, value) => {
        setEditedConditions(prevState => ({
            ...prevState,
            [legajo]: value
        }));
    };

    const handleObservationChange = (legajo, value) => {
        setEditedObservations(prev => ({
            ...prev,
            [legajo]: value
        }));
    };

    const handleCalculate = async (isFinal) => {
        setCalculationType(isFinal ? "final" : "cursada");
        console.log(calculationType);
        // 🔹 Seteamos el mensaje antes de calcular
        if (isFinal) {
            setInfoText("Los resultados muestran la CONDICIÓN FINAL: P (Promueve), R (Regular), L (Libre).");
        } else {
            setInfoText("Los resultados muestran la CONDICIÓN DE CURSADA: En condiciones de integrar, R (Regular), L (Libre).");
        }
        setShowInfo(true);

        try {
            const auth0Token = await getAccessTokenSilently();
            const response = await fetch(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/condition?courseId=${course.getId()}&isFinal=${isFinal}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${auth0Token}`,
                    },
                }
            );

            const data = await response.json();
            const sorted = data.sort((a, b) => a.Legajo - b.Legajo);
            setSortedConditions(sorted);

            if (isFinal) {
                const initialEdited = {};
                sorted.forEach(student => {
                    initialEdited[student.Legajo] = student.Condición;
                });
                setEditedConditions(initialEdited);
            } else {
                setEditedConditions({});
                setEditedObservations({});
            }

        } catch (error) {
            console.error("Error al calcular condiciones:", error);
        }
    };

    // Antes del return:
    const criteriosFiltrados = criterias.filter(c => {
        return calculationType === "cursada"
            ? c.criteria.name !== "Integrador aprobado"
            : true;
    });


    const esCondicionFinal = calculationType === "final";


    const getCondicionFinalTexto = (condicion) => {

        if (esCondicionFinal) {
            return condicion;
        }

        switch (condicion) {
            case "P":
                return "En condiciones de integrar";
            case "R":
                return "R";
            case "L":
                return "L";
            default:
                return condicion;
        }
    };

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Calcular condiciones</h1>
            <form>
                <p>Se evaluará la condicion de los estudiantes según los siguientes criterios:</p>
                <table className="criteria-table">
                    <thead>
                        <tr>
                            <th>Criterio</th>
                            <th>Valor para regular</th>
                            <th>Valor para promover</th>
                        </tr>
                    </thead>
                    <tbody>
                        {criterias.map((criteria, index) => (
                            <tr key={index}>
                                <td>{criteria.criteria.name}</td>
                                <td>
                                    {criteria.criteria.name !== 'Promedio de parciales' && criteria.criteria.name !== 'Integrador aprobado'
                                        ? `${criteria.value_to_regulate} %`
                                        : criteria.value_to_regulate}
                                </td>
                                <td>
                                    {criteria.criteria.name !== 'Promedio de parciales' && criteria.criteria.name !== 'Integrador aprobado'
                                        ? `${criteria.value_to_promote} %`
                                        : criteria.value_to_promote}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" onClick={() => handleCalculate(false)}>
                    Calcular condición de cursada
                </button>
                <button type="button" onClick={() => handleCalculate(true)}>
                    Calcular condición final
                </button>
            </form>

            {/* Mostrar la tabla de condiciones finales */}
            {sortedConditions.length > 0 && (
                <div>
                    <h2>
                    {
                        esCondicionFinal
                        ? "Resultado: Condición final de los alumnos"
                        : "Resultado: Condición de cursada de los alumnos"
                    }
                    </h2>
                    <table className="condition-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Legajo</th>
                                <th>Correlativas</th>
                                {criteriosFiltrados.map((criteria, index) => (
                                    <th>{criteria.criteria.name}</th>
                                ))}
                                {esCondicionFinal ? <th>Condición Final</th> : <th>Condición de Cursada</th>}
                                {esCondicionFinal && <th>Observaciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedConditions.map((student, index) => (
                                <tr key={index}>
                                    <td>{student.Nombre}</td>
                                    <td>{student.Legajo}</td>
                                    <td>{student.Correlativas ? 'P' : ''}</td>                                    
                                    {criteriosFiltrados.map((criteria, criteriaIndex) => {
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
                                            {condition}
                                            <PopoverDetalleCriterio
                                                detalle={student.Detalle.find((item) => item.Criterio === criteria.criteria.name)}
                                            />
                                            </td>
                                        );
                                    })}
                                    <td
                                    className={`condition-cell ${
                                        editedConditions[student.Legajo] !== undefined &&
                                        editedConditions[student.Legajo] !== student.Condición
                                        ? "edited-cell"
                                        : ""
                                    }`}
                                    >
                                    {esCondicionFinal ? (
                                        <>
                                        {editingConditionLegajo === student.Legajo ? (
                                            <input
                                                type="text"
                                                value={editedConditions[student.Legajo] || ""}
                                                onChange={(e) => {
                                                    const newValue = e.target.value.trim().toUpperCase();
                                                    if (newValue === "" || ["P", "R", "L", "A"].includes(newValue)) {
                                                        setErrorMessage("");
                                                        handleConditionChange(student.Legajo, newValue !== "" ? newValue : undefined);
                                                    } else {
                                                        setErrorMessage("Solo se permiten las letras 'P', 'R', 'A' o 'L'");
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span>{getCondicionFinalTexto(editedConditions[student.Legajo] || student.Condición)}</span>
                                        )}
                                        {!editingConditionLegajo && (
                                            <button onClick={() => handleEditCondition(student.Legajo)}>
                                                <FontAwesomeIcon icon={faPencilAlt} />
                                            </button>
                                        )}
                                        {editingConditionLegajo === student.Legajo && (
                                            <td className="edit-buttons">
                                                <button onClick={handleConfirmCondition}>✔️</button>
                                                <button onClick={handleCancelCondition}>❌</button>
                                            </td>
                                        )}
                                        {errorMessage && editingConditionLegajo === student.Legajo &&
                                            <p>{errorMessage}</p>}
                                    </>
                                    ) : (
                                    // Si no es condición final, solo mostramos el texto sin permitir edición
                                    <span>{getCondicionFinalTexto(editedConditions[student.Legajo] || student.Condición)}</span>
                                    )}
                                    </td>
                                    {esCondicionFinal && (
                                        <td className="condition-cell">
                                            {editingObservationLegajo === student.Legajo ? (
                                                <input
                                                    type="text"
                                                    value={editedObservations[student.Legajo] || ""}
                                                    onChange={(e) => handleObservationChange(student.Legajo, e.target.value)}
                                                />
                                            ) : (
                                                <span>{editedObservations[student.Legajo] || ""}</span>
                                            )}
                                            {!editingObservationLegajo && (
                                                <button onClick={() => handleEditObservation(student.Legajo)}>
                                                    <FontAwesomeIcon icon={faPencilAlt} />
                                                </button>
                                            )}
                                            {editingObservationLegajo === student.Legajo && (
                                                <td className="edit-buttons">
                                                    <button onClick={handleConfirmObservation}>✔️</button>
                                                    <button onClick={handleCancelObservation}>❌</button>
                                                </td>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {esCondicionFinal && (
                        <div className="button-container">
                            <button type="button" onClick={handleSaveChanges}>Guardar Cambios</button>
                            {saveMessage && <p>{saveMessage}</p>}
                        </div>
                    )}
                </div>
            )}
            {showInfo && (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Información</h3>
                    <p>{infoText}</p>
                    <button onClick={() => setShowInfo(false)}>Cerrar</button>
                </div>
            </div>
            )}
        </PageLayout>
    );
}
