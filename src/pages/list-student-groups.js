// Componentes externos.
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useHistory } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { Table } from "../components/Table";
import { LoadingState } from "../components/LoadingState";
import { ConfirmModal } from "../components/ConfirmModal";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

// Estilos.
import '../styles/list-course-events.css';

export const ListStudentGroups = () => {
    const { getAccessTokenSilently } = useAuth0();
    const history = useHistory();
    const course = useSelectedCourse(false);

    const [groupsList, setGroupsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [spreadsheetManipulator] = useState(() => new SpreadsheetManipulator());

    // Estado para el modal de confirmación.
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmType: "danger",
        onConfirm: () => {}
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una.
    useEffect(() => {
        if (!course) {
            history.push('/profile?course-missing');
        } else {
            fetchStudentGroups();
        }
    }, []);

    const fetchStudentGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getAccessTokenSilently();
            const response = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-student-groups`,
                {
                    params: { courseId: course.getId() },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setGroupsList(response.data.groups || []);
        } catch (err) {
            setError("No se pudieron obtener los grupos de estudiantes.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // HANDLER: Modificar grupo.
    const handleEdit = (groupId) => {
        history.push(`/modificate-group/${groupId}`);
    };

    // HANDLER: Eliminar grupo.
    const handleDelete = (group) => {
        setModalState({
            isOpen: true,
            title: "Eliminar Grupo",
            message: `¿Estás seguro de que deseas eliminar el grupo "${group.groupName}" y desvincular a todos sus integrantes?`,
            confirmType: "danger",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getAccessTokenSilently();
                    await axios.delete(
                        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/delete-group`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                            params: { groupId: group.groupId }
                        }
                    );
                    // Actualiza el estado local sin recargar.
                    setGroupsList(prev => prev.filter(g => g.groupId !== group.groupId));
                    toast.success("Grupo eliminado correctamente.");
                } catch (error) {
                    console.error("Error eliminando grupo:", error);
                    toast.error("Hubo un problema al eliminar el grupo. " + (error.response?.data?.error || ""));
                }
            }
        });
    };

    // HANDLER: Exportar a Excel.
    const handleExportExcel = async () => {
        if (groupsList.length === 0) {
            toast.error("No hay datos para exportar.");
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            
            // Obtener todos los alumnos de la cursada
            const studentsResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-students?courseId=${course.getId()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const studentsList = studentsResponse.data.studentsList || [];

            // Mapear legajo -> nombre_grupo
            const studentGroupMap = {};
            groupsList.forEach(g => {
                g.studentDossiers.forEach(dossier => {
                    studentGroupMap[dossier] = g.groupName;
                });
            });

            // Armar el Excel
            let sheetContent = [["Legajo", "Nombre", "Grupo"]];
            studentsList.forEach(student => {
                const currentGroup = studentGroupMap[student.dossier] || "";
                sheetContent.push([student.dossier, student.name, currentGroup]);
            });

            const subjectCode = course.getSubjectCode();
            const commission = course.getCommission();
            const year = course.getYear();

            spreadsheetManipulator.create(
                `Grupos - ${subjectCode} C${commission} ${year}`,
                `grupos-${subjectCode}-C${commission}-${year}`,
                sheetContent
            );

        } catch (error) {
            console.error("Error obteniendo alumnos para exportar a Excel:", error);
            toast.error("Hubo un error al generar el archivo. Por favor, intente nuevamente.");
        }
    };

    // Formatea la columna de integrantes: legajos si son ≤5, cantidad si son más.
    const formatMembers = (group) => {
        if (group.studentCount <= 5) {
            return group.studentDossiers.join(", ");
        }
        return `${group.studentCount} alumnos`;
    };

    // CONFIGURACIÓN DE COLUMNAS.
    const tableColumns = [
        { header: "Nombre", accessor: "groupName" },
        {
            header: "Integrantes",
            accessor: "members",
            render: (row) => formatMembers(row)
        },
        {
            header: "Acciones",
            accessor: "actions",
            render: (row) => (
                <div className="actions-container">
                    <button className="edit-button" onClick={() => handleEdit(row.groupId)}>
                        Modificar
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(row)}>
                        Eliminar
                    </button>
                </div>
            )
        }
    ];

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Grupos de estudiantes</h1>
            <h2 className="selected-course-info">
                {course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`}
                {course === null && 'Sin cursada seleccionada'}
            </h2>

            <ConfirmModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmType={modalState.confirmType}
                onConfirm={modalState.onConfirm}
                onCancel={closeModal}
            />

            {error && (
                <div className="msg-error" style={{ textAlign: 'center', marginTop: '20px', fontSize: '20px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingState message="Cargando grupos, por favor espere..." />
            ) : (
                <>
                    <Table
                        columns={tableColumns}
                        data={groupsList}
                    />

                    {groupsList.length > 0 && (
                        <button
                            type="button"
                            className="export-button"
                            onClick={handleExportExcel}
                            style={{ marginTop: '15px' }}
                        >
                            Exportar a Excel
                        </button>
                    )}
                </>
            )}

        </PageLayout>
    );
};
