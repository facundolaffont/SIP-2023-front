import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import { useParams, useHistory } from "react-router-dom";
import { PageLayout } from "../components/page-layout";
import toast from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal.js";

// Reutilizamos los estilos de crear cursada porque la estructura es igual.
import "../styles/create-course.css";

// Diccionario de errores.
const ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": "Ocurrió un error en los servidores al cargar los datos del grupo. Intente en unos minutos.",
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar los datos."
};

export function ModificateGroup() {
    // ESTADOS: Para Auth0.
    const { getAccessTokenSilently } = useAuth0();

    // ESTADOS: Para redirigir.
    const history = useHistory();

    // ESTADOS: Para obtener el ID del grupo a modificar (desde la URL).
    const { groupId } = useParams();

    // ESTADOS: Para los datos del formulario.
    const [groupName, setGroupName] = useState("");

    // ESTADOS: Para manejar la lista de integrantes del grupo.
    const [selectedStudents, setSelectedStudents] = useState([]); // [{ dossier, name }]
    const [currentStudentSelect, setCurrentStudentSelect] = useState("");

    // ESTADOS: Para la lista de todos los alumnos de la cursada (viene del backend).
    const [allCourseStudents, setAllCourseStudents] = useState([]); // [{ dossier, name, currentGroupName }]

    // ESTADOS: UI.
    const [error, setError] = useState(null);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({
        isOpen: false, title: "", message: "", confirmType: "danger", confirmText: "Aceptar", onConfirm: () => { }
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    // EFECTO: Cargar detalle del grupo al montar.
    useEffect(() => {
        const fetchData = async () => {
            try {
                const auth0Token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-group-detail`,
                    {
                        params: { groupId },
                        headers: { Authorization: `Bearer ${auth0Token}` }
                    }
                );

                const data = response.data;
                setGroupName(data.groupName || "");
                setSelectedStudents(data.members || []);
                setAllCourseStudents(data.allCourseStudents || []);

            } catch (error) {
                console.error("Error cargando datos del grupo:", error);
                const errorCode = error.response?.data?.errorCode;
                if (errorCode) {
                    setError(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES["DEFAULT"]);
                } else if (error.request) {
                    setError(ERROR_MESSAGES["NETWORK_ERROR"]);
                } else {
                    setError(ERROR_MESSAGES["DEFAULT"]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (groupId) {
            fetchData();
        }
    }, [groupId, getAccessTokenSilently]);

    // HANDLER: Agregar alumno a la lista local.
    const handleAddStudent = () => {
        if (!currentStudentSelect) return;

        const dossier = Number(currentStudentSelect);
        // Verificar que no esté ya en la lista de seleccionados.
        if (selectedStudents.some(s => s.dossier === dossier)) return;

        const studentInfo = allCourseStudents.find(s => s.dossier === dossier);
        if (!studentInfo) return;

        setSelectedStudents([...selectedStudents, { dossier: studentInfo.dossier, name: studentInfo.name }]);
        setCurrentStudentSelect("");
    };

    // HANDLER: Quitar alumno de la lista local.
    const handleRemoveStudent = (dossierToRemove) => {
        setSelectedStudents(selectedStudents.filter(s => s.dossier !== dossierToRemove));
    };

    // HANDLER: Enviar formulario.
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!groupName.trim()) {
            toast.error("El nombre del grupo no puede estar vacío.");
            return;
        }

        const dataToUpdate = {
            groupId: Number(groupId),
            name: groupName.trim(),
            studentDossiers: selectedStudents.map(s => s.dossier)
        };

        setModalState({
            isOpen: true,
            title: "Guardar cambios",
            message: "¿Está seguro de que desea guardar los cambios en el grupo?",
            confirmType: "primary",
            confirmText: "Guardar",
            onConfirm: async () => {
                closeModal();
                try {
                    const auth0Token = await getAccessTokenSilently();
                    await axios.put(
                        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/update-group`,
                        dataToUpdate,
                        {
                            headers: { Authorization: `Bearer ${auth0Token}` }
                        }
                    );

                    toast.success('Grupo modificado exitosamente.');

                    // Redirigir al listado.
                    setTimeout(() => {
                        history.push("/list-student-groups");
                    }, 1500);

                } catch (err) {
                    console.error(err);
                    if (err.response) {
                        const errorData = err.response.data;
                        if (err.response.status === 409) {
                            // Nombre duplicado.
                            toast.error(errorData.error || 'Ya existe un grupo con ese nombre en esta cursada.');
                        } else {
                            toast.error(errorData.error || errorData || 'Error al modificar el grupo.');
                        }
                    } else {
                        toast.error(err.message);
                    }
                }
            }
        });
    };

    if (loading) return <PageLayout><div className="modal-loading"><div className="spinner"></div><p style={{fontSize: '20px'}}>Cargando datos del grupo...</p></div></PageLayout>;

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Modificar Grupo</h1>
            <ConfirmModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmType={modalState.confirmType}
                confirmText={modalState.confirmText}
                onConfirm={modalState.onConfirm}
                onCancel={closeModal}
            />

            <form onSubmit={handleSubmit}>

                {/* Nombre del grupo */}
                <div className="form-group-full">
                    <label htmlFor="groupName"><p>Nombre del grupo</p></label>
                    <input
                        type="text"
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                        maxLength={64}
                    />
                </div>

                {/* Agregar alumno */}
                <label htmlFor="studentSelect"><p>Agregar alumno al grupo</p></label>

                <div className="form-row professor-row">
                    <select
                        id="studentSelect"
                        value={currentStudentSelect}
                        onChange={(e) => setCurrentStudentSelect(e.target.value)}
                        className="flex-grow select-professor"
                        disabled={allCourseStudents.length === 0}
                    >
                        <option value="">
                            {allCourseStudents.length === 0
                                ? "No hay alumnos en la cursada"
                                : "-- Seleccione un alumno --"
                            }
                        </option>
                        {allCourseStudents
                            .filter(s => !selectedStudents.some(sel => sel.dossier === s.dossier))
                            .map((student) => (
                                <option key={student.dossier} value={student.dossier}>
                                    {student.dossier} - {student.name}
                                    {student.currentGroupName
                                        ? ` (Grupo actual: ${student.currentGroupName})`
                                        : " (Sin grupo)"}
                                </option>
                            ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleAddStudent}
                        className="btn-add-inline"
                        disabled={!currentStudentSelect}
                    >
                        Agregar
                    </button>
                </div>

                {/* Lista de integrantes */}
                {selectedStudents.length > 0 && (
                    <div className="assigned-professors-wrapper">
                        <ul className="professor-list">
                            {selectedStudents.map(student => (
                                <li key={student.dossier} className="professor-item">
                                    <span className="prof-name">
                                        {student.dossier} - {student.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStudent(student.dossier)}
                                        className="btn-remove-item"
                                    >
                                        Quitar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Botones de acción */}
                <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
                    <button
                        type="submit"
                        style={{flex: 1}}
                    >
                        Guardar Cambios
                    </button>

                    <button
                        type="button"
                        onClick={() => history.push("/list-student-groups")}
                        style={{flex: 1, backgroundColor: '#6c757d'}}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </PageLayout>
    );
}

export default ModificateGroup;
