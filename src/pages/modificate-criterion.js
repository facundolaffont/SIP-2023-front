// Imports externos.
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import toast from "react-hot-toast";

// Imports internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import { EmptyState } from "../components/EmptyState";
import { ConfirmModal } from "../components/ConfirmModal.js";

export const ModificateCriterion = () => {

    // #region ==== Creación de variables de estado. ====

    const { getAccessTokenSilently } = useAuth0();

    const [criterias, setCriterias] = useState([]);
    const [editedCriterias, setEditedCriterias] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({
        isOpen: false, title: "", message: "", confirmType: "danger", confirmText: "Aceptar", onConfirm: () => { }
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // #endregion ==== Creación de variables de estado. ====

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    useEffect(() => {

        const getEvaluationCriteria = async () => {

            // Evita que el primer render arroje una excepción porque course es null.
            if (!course) return;

            setLoading(true);

            try {
                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently();

                const criteria = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/evaluationCriterias?courseId=${course.getId()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                );
                setCriterias(criteria.data);
            } catch (error) {
                console.error(error.response);
            } finally {
                setLoading(false);
            }
        }
        getEvaluationCriteria();

    }, [course]);

    const handleSubmitChanges = (index, originalEditedCriteria) => {
        const criteriaToSave = editedCriterias[index];
        const criterio = String(criteriaToSave.criteria.id);
        const regularValue = parseFloat(criteriaToSave.value_to_regulate);
        const promovidoValue = parseFloat(criteriaToSave.value_to_promote);

        let isValid = true;
        const esIntegrador = criterio === "10";

        if (isNaN(promovidoValue)) isValid = false;
        if (!esIntegrador && isNaN(regularValue)) isValid = false;

        if (isValid) {
            // Verificar el tipo de criterio seleccionado y validar los valores ingresados
            if (criterio === "5" || criterio === "10") { // Promedio de parciales o Integrador
                if ((!esIntegrador && (regularValue < 1 || regularValue > 10)) || promovidoValue < 0 || promovidoValue > 10 || (!esIntegrador && (regularValue > promovidoValue))) {
                    isValid = false;
                }
            } else {
                if (criterio === "4" || criterio === "2" || criterio === "6" || criterio === "1") {
                    if ((regularValue < 0 || regularValue > 100 || promovidoValue < 0 || promovidoValue > 100) || (regularValue > promovidoValue)) {
                        isValid = false;
                    }
                }
                else {
                    if ((regularValue < 0 || regularValue > 100 || promovidoValue < 0 || promovidoValue > 100) || (promovidoValue > regularValue)) {
                        isValid = false;
                    }
                }
            }
        }

        if (!isValid) {
            toast.error("Valores incorrectos. Por favor, ingrese valores válidos.");
            return;
        }

        setModalState({
            isOpen: true,
            title: "Guardar cambios",
            message: "¿Está seguro de que desea guardar los cambios en este criterio de evaluación?",
            confirmType: "primary",
            confirmText: "Guardar",
            onConfirm: async () => {
                closeModal();
                
                const criteriaToSave = editedCriterias[index];

                const criteriaPayload = {
                    id: criteriaToSave.id,
                    course: criteriaToSave.course,
                    criteria: criteriaToSave.criteria,
                    value_to_regulate: criteriaToSave.value_to_regulate,
                    value_to_promote: criteriaToSave.value_to_promote,
                };

                try {
                    await fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/add`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(criteriaPayload),
                    });
                    
                    const newCriterias = [...criterias];
                    newCriterias[index] = criteriaToSave;
                    setCriterias(newCriterias);
                    
                    const newEdited = { ...editedCriterias };
                    delete newEdited[index];
                    setEditedCriterias(newEdited);

                } catch (error) {
                    console.error("Error al actualizar el criterio:", error);
                }
            }
        });
    };

    const handleDeleteCriteria = (index) => {
        setModalState({
            isOpen: true,
            title: "Eliminar criterio",
            message: "¿Está seguro de que desea eliminar este criterio de evaluación?",
            confirmType: "danger",
            confirmText: "Eliminar",
            onConfirm: async () => {
                closeModal();
                try {
                    const criteriaToDelete = criterias[index];

                    const criteriaPayload = {
                        id: criteriaToDelete.id,
                        course: criteriaToDelete.course,
                        criteria: criteriaToDelete.criteria,
                        value_to_regulate: criteriaToDelete.value_to_regulate,
                        value_to_promote: criteriaToDelete.value_to_promote,
                    };

                    await fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/delete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(criteriaPayload),
                    });

                    const updatedCriterias = criterias.filter((_, i) => i !== index);
                    setCriterias(updatedCriterias);

                } catch (error) {
                    console.error("Error al eliminar el criterio:", error);
                }
            }
        });
    };

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Modificar criterios de evaluación</h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            <ConfirmModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmType={modalState.confirmType}
                confirmText={modalState.confirmText}
                onConfirm={modalState.onConfirm}
                onCancel={closeModal}
            />
            {loading ? (
                <div className="modal-loading" style={{ marginTop: '20px' }}>
                    <div className="spinner"></div>
                    <p style={{ fontSize: '20px' }}>Cargando criterios de evaluación...</p>
                </div>
            ) : criterias.length === 0 ? (
                <EmptyState message="No hay criterios de evaluación creados para esta cursada." />
            ) : (
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
                        <tbody> {
                            criterias.map((criteria, index) => {
                                const isEdited = editedCriterias[index] !== undefined;

                                return (
                                    <tr key={index}>
                                        <td>{criteria.criteria.name}</td>
                                        <td>
                                            {isEdited ? (
                                                String(criteria.criteria.id) !== "10" ? (
                                                    <input
                                                        type="text"
                                                        value={editedCriterias[index].value_to_regulate}
                                                        onChange={(e) => {
                                                            const newEdited = { ...editedCriterias };
                                                            newEdited[index].value_to_regulate = e.target.value;
                                                            setEditedCriterias(newEdited);
                                                        }}
                                                    />
                                                ) : "N/A"
                                            ) : (
                                                String(criteria.criteria.id) !== "10" ? criteria.value_to_regulate : "N/A"
                                            )}
                                        </td>
                                        <td>
                                            {isEdited ? (
                                                <input
                                                    type="text"
                                                    value={editedCriterias[index].value_to_promote}
                                                    onChange={(e) => {
                                                        const newEdited = { ...editedCriterias };
                                                        newEdited[index].value_to_promote = e.target.value;
                                                        setEditedCriterias(newEdited);
                                                    }}
                                                />
                                            ) : (
                                                criteria.value_to_promote
                                            )}
                                        </td>
                                        <td>
                                            {isEdited ? (
                                                <div style={{display: 'flex', gap: '10px'}}>
                                                    <button
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            handleSubmitChanges(index);
                                                        }}
                                                        className="edit-button"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            const newEdited = { ...editedCriterias };
                                                            delete newEdited[index];
                                                            setEditedCriterias(newEdited);
                                                        }}
                                                        className="delete-button"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{display: 'flex', gap: '10px'}}>
                                                    <button
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            const newEdited = {};
                                                            newEdited[index] = { ...criteria };
                                                            setEditedCriterias(newEdited);
                                                        }}
                                                        className="edit-button"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            handleDeleteCriteria(index);
                                                        }}
                                                        className="delete-button"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        } </tbody>
                    </table>
                </form>
            )}
        </PageLayout>
    );
}
