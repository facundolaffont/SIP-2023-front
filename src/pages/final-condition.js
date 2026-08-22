// Imports externos.
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

// Imports internos.
import { PageLayout } from "../components/page-layout";
import { PopoverDetalleCriterio } from "../components/PopoverDetalleCriterio";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

import { useSelectedCourse } from "../contexts/course/course-provider.js";

// Estilos.
import "../styles/final-condition.css";

const ConditionEditor = ({ studentLegajo, currentCondition, onConfirm, getCondicionFinalTexto, isEditing, onEditStart, onCancel }) => {
    const [tempValue, setTempValue] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isEditing) {
            setTempValue(currentCondition || "");
            setErrorMessage("");
        }
    }, [isEditing, currentCondition]);

    const handleEdit = () => {
        onEditStart();
    };

    const handleConfirm = () => {
        if (tempValue === "" || ["P", "R", "L", "A"].includes(tempValue)) {
            onConfirm(studentLegajo, tempValue !== "" ? tempValue : undefined);
        } else {
            setErrorMessage("Solo se permiten las letras 'P', 'R', 'A' o 'L'");
        }
    };

    const handleCancel = () => {
        onCancel();
        setErrorMessage("");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {isEditing ? (
                    <input
                        type="text"
                        value={tempValue}
                        style={{ width: "40px", height: "28px", textAlign: "center", textTransform: "uppercase", boxSizing: "border-box", margin: 0, padding: "4px" }}
                        onChange={(e) => {
                            const newValue = e.target.value.trim().toUpperCase();
                            setTempValue(newValue);
                            if (newValue === "" || ["P", "R", "L", "A"].includes(newValue)) {
                                setErrorMessage("");
                            } else {
                                setErrorMessage("Solo se permiten las letras 'P', 'R', 'A' o 'L'");
                            }
                        }}
                    />
                ) : (
                    <span>{getCondicionFinalTexto(currentCondition)}</span>
                )}
                {!isEditing && (
                    <button onClick={handleEdit} className="edit-action-btn" title="Editar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                )}
                {isEditing && (
                    <div className="edit-buttons-container" style={{ display: "flex", alignItems: "center", margin: 0, gap: "4px" }}>
                        <button onClick={handleConfirm} className="confirm-btn" title="Confirmar" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 0, minWidth: "26px", width: "26px", height: "26px" }}>
                            <FontAwesomeIcon icon={faCheck} style={{ fontSize: "14px" }} />
                        </button>
                        <button onClick={handleCancel} className="cancel-btn" title="Cancelar" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 0, minWidth: "26px", width: "26px", height: "26px" }}>
                            <FontAwesomeIcon icon={faTimes} style={{ fontSize: "14px" }} />
                        </button>
                    </div>
                )}
            </div>
            {errorMessage && isEditing &&
                <p style={{ color: "black", fontWeight: "bold", fontSize: "12px", margin: "0" }}>{errorMessage}</p>}
        </div>
    );
};

const ObservationEditor = ({ studentLegajo, currentObservation, onConfirm, isEditing, onEditStart, onCancel }) => {
    const [tempValue, setTempValue] = useState("");
    const containerRef = React.useRef(null);

    useEffect(() => {
        if (isEditing) {
            setTempValue(currentObservation || "");
        }
    }, [isEditing, currentObservation]);

    useEffect(() => {
        if (isEditing && containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        }
    }, [isEditing]);

    const handleEdit = () => {
        onEditStart();
    };

    const handleConfirm = () => {
        onConfirm(studentLegajo, tempValue);
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <div ref={containerRef} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", minWidth: isEditing ? "250px" : "auto", height: "100%" }}>
            {isEditing ? (
                <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    style={{ flex: 1, width: "100%", minWidth: "200px", boxSizing: "border-box", padding: "4px 8px", margin: 0, height: "28px" }}
                />
            ) : (
                <span>{currentObservation || ""}</span>
            )}
            
            {!isEditing && (
                <button onClick={handleEdit} className="edit-action-btn" title="Editar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                </button>
            )}
            {isEditing && (
                <div className="edit-buttons-container" style={{ display: "flex", alignItems: "center", margin: 0, gap: "4px" }}>
                    <button onClick={handleConfirm} className="confirm-btn" title="Confirmar" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 0, minWidth: "26px", width: "26px", height: "26px" }}>
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: "14px" }} />
                    </button>
                    <button onClick={handleCancel} className="cancel-btn" title="Cancelar" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 0, minWidth: "26px", width: "26px", height: "26px" }}>
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: "14px" }} />
                    </button>
                </div>
            )}
        </div>
    );
};

export const FinalCondition = () => {
    const [criterias, setCriterias] = useState([]);
    const { getAccessTokenSilently } = useAuth0();
    const [sortedConditions, setSortedConditions] = useState([]);
    const [saveMessage, setSaveMessage] = useState("");
    const [editedConditions, setEditedConditions] = useState({}); // Estado para manejar las condiciones editadas
    const [editedObservations, setEditedObservations] = useState({});
    const [calculationType, setCalculationType] = useState(null); // "cursada" o "final"
    const [editingCell, setEditingCell] = useState(null); // String del tipo "legajo-condition" o "legajo-observation" para exclusión mutua
    const [showInfo, setShowInfo] = useState(false);
    const [infoText, setInfoText] = useState("");
    const [isCalculating, setIsCalculating] = useState(false);
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    // Estado del tipo de ordenamiento: 'ascending', 'descending', o null
    const [sortDirection, setSortDirection] = useState(null);

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
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

    const [cacheConditions, setCacheConditions] = useState({
        cursada: null,
        final: null
    });

    const handleConditionChange = (legajo, value) => {
        setEditedConditions(prevState => ({
            ...prevState,
            [legajo]: value
        }));
    };

    // --- FUNCIONES PARA ORDENAR CRITERIOS ---
    const handleMoveUp = (index) => {
        if (index === 0) return;

        const newCriterias = [...criterias];
        const temp = newCriterias[index - 1];
        newCriterias[index - 1] = newCriterias[index];
        newCriterias[index] = temp;

        setCriterias(newCriterias);
    };

    const handleMoveDown = (index) => {
        if (index === criterias.length - 1) return;

        const newCriterias = [...criterias];
        const temp = newCriterias[index + 1];
        newCriterias[index + 1] = newCriterias[index];
        newCriterias[index] = temp;

        setCriterias(newCriterias);
    };

    const handleSaveOrder = async () => {
        try {
            const auth0Token = await getAccessTokenSilently();

            // Armamos el array con el ID de la base de datos y su nueva posición (índice)
            const orderPayload = criterias.map((c, index) => ({
                id: c.id,
                orden: index
            }));

            const response = await fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/update-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${auth0Token}`,
                },
                body: JSON.stringify(orderPayload),
            });

            if (!response.ok) {
                throw new Error("Error al guardar el orden");
            }
            toast.success("Orden de criterios guardado con éxito");

        } catch (error) {
            console.error("Error al guardar orden:", error);
            toast.error("Error al guardar el orden de criterios");
        }
    };

    const handleObservationChange = (legajo, value) => {
        setEditedObservations(prev => ({
            ...prev,
            [legajo]: value
        }));
    };

    const handleCalculate = async (isFinal) => {

        // Oculta el mensaje de guardado exitoso, si se estuviese mostrando.
        setSaveMessage(false);

        const type = isFinal ? "final" : "cursada";
        setCalculationType(type);

        // Mensaje informativo según el tipo.
        setInfoText(
            isFinal
                ? "Los resultados muestran la CONDICIÓN FINAL: P (Promueve), R (Regular), L (Libre)."
                : "Los resultados muestran la CONDICIÓN DE CURSADA: En condiciones de integrar, R (Regular), L (Libre)."
        );
        setShowInfo(true);

        // Si ya tenemos cache → mostramos los datos al instante
        if (cacheConditions[type]) {
            setSortedConditions(cacheConditions[type]);

            // Mantenemos el popup 1.5s para que se lea el mensaje
            setTimeout(() => setShowInfo(false), 1500);
            return;
        }

        // Si no hay cache → mostramos spinner en el modal
        setIsCalculating(true);

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

            // Cacheamos resultados
            setCacheConditions(prev => ({
                ...prev,
                [type]: sorted
            }));

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
        } finally {
            setIsCalculating(false);

            // Cerramos modal después de 1.5s
            setTimeout(() => setShowInfo(false), 1500);
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


    // AGREGO LÓGICA DE ORDENAMIENTO (POR NOMBRE)
    /**
     * Función para cambiar el estado al hacer clic en el encabezado
     */
    const toggleSortNombre = () => {
        if (sortDirection === 'ascending') {
            setSortDirection('descending');
        } else if (sortDirection === 'descending') {
            setSortDirection(null); // Volver al orden original (por Legajo, como viene del back)
        } else {
            setSortDirection('ascending');
        }
    };

    /**
     * Hacemos una copia de sortedConditions y ordenamos si hace falta
     */
    // (Esto se ejecuta cada vez que el componente se dibuja)
    // No modifico directamente porque pierdo el orden original por legajo.
    let dataToDisplay = [...sortedConditions];

    if (sortDirection !== null) {
        dataToDisplay.sort((a, b) => {
            const aValue = a.Nombre.toLowerCase();
            const bValue = b.Nombre.toLowerCase();

            if (aValue < bValue) {
                return sortDirection === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }

    // Obtener las claves de notas (columnas extra) para cada criterio, evaluando todos los alumnos
    const criteriosKeysMap = {};
    if (sortedConditions.length > 0) {
        criteriosFiltrados.forEach(criteria => {
            const keysSet = new Set();
            sortedConditions.forEach(student => {
                const detalle = student.Detalle?.find(d => d.Criterio === criteria.criteria.name);
                if (detalle && detalle.DetalleNotas) {
                    Object.keys(detalle.DetalleNotas).forEach(k => keysSet.add(k));
                }
            });
            criteriosKeysMap[criteria.criteria.name] = Array.from(keysSet);
        });
    }

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {
        const tableClone = document.getElementById("final-condition-table").cloneNode(true);
        tableClone.querySelectorAll('th').forEach(th => {
            if (th.textContent) th.textContent = th.textContent.replace('▲', '').replace('▼', '').trim();
        });
        tableClone.querySelectorAll('td[data-original-value]').forEach(td => {
            td.textContent = td.getAttribute('data-original-value');
        });
        spreadsheetManipulator.export(
            tableClone,
            "Condición de los estudiantes",
            "condición-estudiantes",
            [],
            [2]
        );
    }

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Calcular condiciones</h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            <form>
                <p>Se evaluará la condicion de los estudiantes según los siguientes criterios:</p>
                <table className="criteria-table">
                    <thead>
                        <tr>
                            <th>Orden</th> {/* NUEVA COLUMNA */}
                            <th>Criterio</th>
                            <th>Valor para regular</th>
                            <th>Valor para promover</th>
                        </tr>
                    </thead>
                    <tbody>
                        {criterias.map((criteria, index) => (
                            <tr key={criteria.id || index}>

                                {/* CELDA DE LAS FLECHAS */}
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        title="Mover arriba"
                                    >
                                        ⬆️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === criterias.length - 1}
                                        title="Mover abajo"
                                    >
                                        ⬇️
                                    </button>
                                </td>

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
                <div className="correlatives-info-box">
                    <p>
                        ℹ️ <strong>Importante:</strong> La verificación de materias <strong>correlativas</strong> se realiza automáticamente por el sistema, no es necesario crear un criterio.
                    </p>
                </div>
                {/* BOTÓN PARA GUARDAR EL ORDEN EN LA BD */}
                <button type="button" onClick={handleSaveOrder}>
                    Guardar Orden de Criterios
                </button>
                <button type="button" onClick={() => handleCalculate(false)}>
                    Calcular condición de cursada
                </button>
                <button type="button" onClick={() => handleCalculate(true)}>
                    Calcular condición final
                </button>
            </form>

            {/* Mostrar la tabla de condiciones finales */}
            {sortedConditions.length > 0 && (
                <div className="final-condition-table-container">
                    <h2>
                        {
                            esCondicionFinal
                                ? "Resultado: Condición final de los alumnos"
                                : "Resultado: Condición de cursada de los alumnos"
                        }
                    </h2>
                    <div className="condition-references" style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f9f9f9", border: "1px solid #ddd", borderRadius: "4px", display: "inline-block" }}>
                        <strong style={{ marginRight: "15px", color: "black" }}>Referencias:</strong>
                        <span style={{ marginRight: "15px", color: "black", backgroundColor: "#e8f5e9", padding: "4px 8px", borderRadius: "4px" }}><FontAwesomeIcon icon={faCheck} style={{ color: "black" }} /><FontAwesomeIcon icon={faCheck} style={{ color: "black", marginLeft: "2px" }} /> P (Promueve)</span>
                        <span style={{ marginRight: "15px", color: "black", backgroundColor: "#fff8e1", padding: "4px 8px", borderRadius: "4px" }}><FontAwesomeIcon icon={faCheck} style={{ color: "black" }} /> R (Regular)</span>
                        <span style={{ color: "black", backgroundColor: "#ffebee", padding: "4px 8px", borderRadius: "4px" }}><FontAwesomeIcon icon={faTimes} style={{ color: "black" }} /> L (Libre)</span>
                    </div>
                    <table id="final-condition-table" className="final-condition-table">
                        <thead>
                            <tr>
                                <th
                                    onClick={toggleSortNombre}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    title="Ordenar por nombre"
                                >Nombre {sortDirection === 'ascending' ? '▲' : (sortDirection === 'descending' ? '▼' : '')}
                                </th>
                                <th>Legajo</th>
                                <th>Email</th>
                                <th>Correlativas</th>

                                {criteriosFiltrados.map((criteria, index) => {
                                    // Usamos el mapa de claves calculado para este criterio evaluando a todos los alumnos
                                    const notasKeys = criteriosKeysMap[criteria.criteria.name] || [];

                                    return (
                                        <React.Fragment key={index}>
                                            {/* A. Columnas de Notas Individuales*/}
                                            {notasKeys.map((keyNota) => (
                                                <th key={keyNota}>
                                                    {keyNota}
                                                </th>
                                            ))}
                                            {/* B. Columna de la Condición General */}
                                            <th>{criteria.criteria.name}</th>
                                        </React.Fragment>
                                    );
                                })}

                                {esCondicionFinal ? <th>Condición Final</th> : <th>Condición de Cursada</th>}
                                {esCondicionFinal && <th>Observaciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {dataToDisplay.map((student, index) => (
                                <tr key={index}>
                                    <td>{student.Nombre}</td>
                                    <td>{student.Legajo}</td>
                                    <td>{student.Email}</td>
                                    <td>{student.Correlativas ? 'P' : ''}</td>

                                    {criteriosFiltrados.map((criteria, criteriaIndex) => {

                                        // 1. Buscamos el detalle del alumno actual
                                        const detalleObj = student.Detalle.find(d => d.Criterio === criteria.criteria.name);

                                        // 2. Obtenemos las mismas claves de notas (calculadas previamente para toda la columna)
                                        const notasKeys = criteriosKeysMap[criteria.criteria.name] || [];

                                        // 3. Estilo de la condición
                                        const condition = detalleObj ? detalleObj.Condición : "N/A";
                                        let cellClassName = "normal-cell";  // Clase por defecto
                                        if (condition === "N/A") cellClassName = "common-cell";

                                        let bgColor = "transparent";
                                        if (condition === "P") bgColor = "#e8f5e9";
                                        else if (condition === "R") bgColor = "#fff8e1";
                                        else if (condition === "L") bgColor = "#ffebee";

                                        let tooltipInfo = "";
                                        if (condition === "N/A" && criteria.criteria.name === "Promedio de parciales") {
                                            tooltipInfo = "Promedio anulado por contener calificaciones no numéricas (Ej: A, A-, D)";
                                        }

                                        let extraInfo = "";

                                        if (detalleObj) {
                                            // Caso ASISTENCIAS:
                                            if (detalleObj.PresenciasAlumno !== undefined) {
                                                extraInfo = ` (${detalleObj.PresenciasAlumno}/${detalleObj.CantidadEventos})`;
                                            }
                                            // Caso PROMEDIO PARCIALES:
                                            else if (detalleObj.PromedioParciales !== undefined) {
                                                extraInfo = ` (${detalleObj.PromedioParciales})`;
                                            }
                                            // Caso INTEGRADOR
                                            else if (detalleObj.NotaIntegrador !== undefined) {
                                                extraInfo = ` (${detalleObj.NotaIntegrador})`;
                                            }
                                        }

                                        const getConditionIcon = (cond) => {
                                            switch (cond) {
                                                case "P": return <span title="Promovido"><FontAwesomeIcon icon={faCheck} style={{ color: "black" }} /><FontAwesomeIcon icon={faCheck} style={{ color: "black", marginLeft: "2px" }} /></span>;
                                                case "R": return <FontAwesomeIcon icon={faCheck} style={{ color: "black" }} title="Regular" />;
                                                case "L": return <FontAwesomeIcon icon={faTimes} style={{ color: "black" }} title="Libre" />;
                                                default: return cond;
                                            }
                                        };

                                        const isIconCondition = ["P", "R", "L"].includes(condition);
                                        const displayNode = isIconCondition ? (
                                            <>
                                                {getConditionIcon(condition)}
                                                <span style={{ color: "black", marginLeft: "4px" }}>{extraInfo}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: condition === "N/A" ? "inherit" : "black" }}>{condition + extraInfo}</span>
                                        );

                                        return (
                                            <React.Fragment key={criteriaIndex}>

                                                {/* A. Celdas de NOTAS INDIVIDUALES */}
                                                {notasKeys.map((keyNota) => (
                                                    <td key={keyNota}>
                                                        {/* Accedemos al valor de la nota en el mapa o mostramos vacío/guión si no tiene esa nota */}
                                                        {detalleObj && detalleObj.DetalleNotas && detalleObj.DetalleNotas[keyNota] !== undefined
                                                            ? detalleObj.DetalleNotas[keyNota]
                                                            : "--"}
                                                    </td>
                                                ))}

                                                {/* B. Celda de CONDICIÓN (Con Popover) */}
                                                <td className={cellClassName} title={tooltipInfo} style={{ backgroundColor: bgColor }} data-original-value={condition + extraInfo}>
                                                    {displayNode}
                                                    <PopoverDetalleCriterio detalle={detalleObj} />
                                                </td>

                                            </React.Fragment>
                                        );
                                    })}

                                    {(() => {
                                        const finalCond = editedConditions[student.Legajo] || student.Condición;
                                        let finalBgColor = "rgb(197, 255, 197)"; // fallback original
                                        if (finalCond === "P") finalBgColor = "#81c784"; // Verde más fuerte
                                        else if (finalCond === "R") finalBgColor = "#ffd54f"; // Amarillo/ámbar fuerte
                                        else if (finalCond === "L") finalBgColor = "#e57373"; // Rojo fuerte
                                        else if (finalCond === "A") finalBgColor = "#e0e0e0"; // Gris

                                        return (
                                            <td
                                                className={`final-condition-table-condition-cell ${editedConditions[student.Legajo] !== undefined &&
                                                    editedConditions[student.Legajo] !== student.Condición
                                                    ? "edited-cell"
                                                    : ""
                                                    }`}
                                                data-original-value={getCondicionFinalTexto(finalCond)}
                                                style={{ backgroundColor: finalBgColor, color: "black" }}
                                            >

                                                {esCondicionFinal ? (
                                                    <ConditionEditor 
                                                        studentLegajo={student.Legajo}
                                                        currentCondition={editedConditions[student.Legajo] || student.Condición}
                                                        onConfirm={(legajo, val) => {
                                                            handleConditionChange(legajo, val);
                                                            setEditingCell(null);
                                                        }}
                                                        getCondicionFinalTexto={getCondicionFinalTexto}
                                                        isEditing={editingCell === `${student.Legajo}-condition`}
                                                        onEditStart={() => setEditingCell(`${student.Legajo}-condition`)}
                                                        onCancel={() => setEditingCell(null)}
                                                    />
                                                ) : (
                                                    // Si no es condición final, solo mostramos el texto sin permitir edición
                                                    <span style={{ color: "black", fontWeight: "bold" }}>{getCondicionFinalTexto(editedConditions[student.Legajo] || student.Condición)}</span>
                                                )}
                                            </td>
                                        );
                                    })()}
                                    {esCondicionFinal && (
                                        <td className="final-condition-table-observation-cell"
                                            data-original-value={editedObservations[student.Legajo] || ""}
                                        >
                                            <ObservationEditor
                                                studentLegajo={student.Legajo}
                                                currentObservation={editedObservations[student.Legajo]}
                                                onConfirm={(legajo, val) => {
                                                    handleObservationChange(legajo, val);
                                                    setEditingCell(null);
                                                }}
                                                isEditing={editingCell === `${student.Legajo}-observation`}
                                                onEditStart={() => setEditingCell(`${student.Legajo}-observation`)}
                                                onCancel={() => setEditingCell(null)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="button-container">

                        {/* Botón para exportar a Excel. */}
                        <button
                            type="button"
                            className="export-button"
                            onClick={handleExport}
                        >
                            Exportar a Excel
                        </button>

                        {/* Botón para guardar cambios. */}
                        <button
                            type="button"
                            onClick={handleSaveChanges}
                        >
                            Guardar cambios
                        </button>
                        {saveMessage && <p>{saveMessage}</p>}

                    </div>
                </div>
            )}

            {showInfo && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Información</h3>
                        <p>{infoText}</p>

                        {isCalculating ? (
                            <div className="modal-loading">
                                <div className="spinner"></div>
                                <p>Calculando condiciones...</p>
                            </div>
                        ) : (
                            <button onClick={() => setShowInfo(false)}>Cerrar</button>
                        )}
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
