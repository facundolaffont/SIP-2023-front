// Componentes externos.
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useHistory } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { Table } from "../components/Table"; // Asegurate de que la ruta sea correcta
import { LoadingState } from "../components/LoadingState";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { ConfirmModal } from "../components/ConfirmModal";

// Estilos.
import '../styles/list-course-students.css';

const ERROR_MESSAGES = { 
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.", 
    "DEFAULT": "Hubo un problema inesperado." 
};

export const ListCourseStudents = () => {
    // ESTADOS: Auth0 y Navegación
    const { getAccessTokenSilently } = useAuth0();
    const history = useHistory();
    const course = useSelectedCourse(false);

    // ESTADOS: Datos y UI
    const [studentsList, setStudentsList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ESTADOS: Edición
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    
    // ESTADOS: Errores y Modal
    const [error, setError] = useState(null);
    const [modalState, setModalState] = useState({ 
        isOpen: false, 
        title: "", 
        message: "", 
        confirmType: "danger", 
        confirmText: "Aceptar", 
        onConfirm: () => {} 
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    // SERVICIOS
    const [spreadsheetManipulator] = useState(() => new SpreadsheetManipulator());

    // Redirige si no hay cursada seleccionada
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, [course, history]);

    // Obtiene la lista de estudiantes
    useEffect(() => {
        const getCourseStudents = async () => {
            if (!course) return;
            setLoading(true);
            setError(null);
            try {
                const token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-students?courseId=${course.getId()}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                // Mapeamos asegurando que los valores booleanos sean puros (true/false)
                const mappedStudents = response.data.studentsList.map(student => ({
                    dossier: student.dossier,
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    alreadyStudied: student.alreadyStudied === true,
                    allPreviousSubjectsApproved: student.allPreviousSubjectsApproved === true,
                    finalCondition: student.finalCondition,
                }));
                
                setStudentsList(mappedStudents);
            } catch (error) {
                console.error("Error al obtener la lista de estudiantes:", error);
                if (!error.response) {
                    setError(ERROR_MESSAGES.NETWORK_ERROR);
                } else {
                    setError(ERROR_MESSAGES.DEFAULT);
                }
            } finally {
                setLoading(false);
            }
        }
        getCourseStudents();
    }, [course, getAccessTokenSilently]);

    // HANDLERS: Eventos de Edición
    const handleEditClick = (student) => {
        setEditingId(student.id); 
        setEditFormData({
            dossier: student.dossier,
            id: student.id,
            name: student.name,
            email: student.email,
            alreadyStudied: student.alreadyStudied,
            allPreviousSubjectsApproved: student.allPreviousSubjectsApproved,
            finalCondition: student.finalCondition || 'A' // Valor por defecto por si viene null
        });
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        // 1. Banderas para evaluar qué regla de negocio se rompe (evaluamos sobre el estado actual editFormData)
        let changedToRegular = false;
        let blockedPromoted = false;

        // REGLA 1: Si desmarca correlativas y era Promovido (P)
        if (name === 'allPreviousSubjectsApproved' && !newValue && editFormData.finalCondition === 'P') {
            changedToRegular = true;
        }

        // REGLA 2: Si intenta poner 'P' pero no tiene las correlativas aprobadas
        if (name === 'finalCondition' && newValue === 'P' && !editFormData.allPreviousSubjectsApproved) {
            blockedPromoted = true;
        }

        // 2. Ejecutar Side Effects FUERA de la actualización de estado
        if (changedToRegular) {
            toast("Al desmarcar las correlativas, la condición bajó automáticamente a Regular (R)");
        }

        if (blockedPromoted) {
            toast.error("No podés poner Promovido (P) si el alumno no tiene las correlativas aprobadas");
            return; // Cortamos acá la ejecución, no actualizamos el estado con un valor inválido
        }

        // 3. Actualizar el estado de forma limpia y Pura
        setEditFormData(prev => ({
            ...prev,
            [name]: newValue,
            // Si la regla 1 se cumplió, forzamos la condición final a 'R' dinámicamente
            ...(changedToRegular && { finalCondition: 'R' }) 
        }));
    };

    const handleSaveEdit = (id) => {
        const dniValue = editFormData.id;
        const nameValue = editFormData.name;

        // Validar DNI (Numerico, mayor a 0 y no vacío)
        if (!dniValue || isNaN(dniValue) || Number(dniValue) <= 0) {
            toast.error("El DNI debe ser un número válido mayor a 0");
            return;
        }

        // Validar Nombre (No vacío y solo letras/espacios, incluyendo tildes)
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        if (!nameValue || nameValue.trim() === "" || !nameRegex.test(nameValue)) {
            toast.error("El nombre es obligatorio y solo puede contener letras y espacios");
            return;
        }

        setModalState({
            isOpen: true,
            title: "Guardar cambios",
            message: "¿Estás seguro de que deseas guardar los cambios para este estudiante?",
            confirmType: "primary", // Usamos primary porque es una acción de guardado, no borrado
            confirmText: "Guardar",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getAccessTokenSilently();
                    
                    const payload = {
                        courseId: course.getId(), 
                        dossier: editFormData.dossier, 
                        id: Number(editFormData.id),
                        name: editFormData.name.trim(),
                        email: editFormData.email.trim(),
                        alreadyStudied: editFormData.alreadyStudied,
                        allPreviousSubjectsApproved: editFormData.allPreviousSubjectsApproved,
                        finalCondition: editFormData.finalCondition 
                    };

                    await axios.put(
                        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/update-student`,
                        payload,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    setStudentsList(prev => prev.map(student => 
                        student.id === id ? { ...student, ...editFormData } : student
                    ));
                    
                    setEditingId(null);
                    toast.success("Alumno actualizado con éxito");
                } catch (error) {
                    console.error("Error al guardar:", error);
                    if (error.response && error.response.status === 400) {
                        const validacionErrores = error.response.data; 
                        if (typeof validacionErrores === 'string') {
                            toast.error("Revisá los datos: " + validacionErrores);
                        } else {
                            toast.error("Revisá los datos. " + Object.values(validacionErrores).join(" "));
                        }
                    } else {
                        if (!error.response) {
                            toast.error(ERROR_MESSAGES.NETWORK_ERROR);
                        } else {
                            toast.error(ERROR_MESSAGES.DEFAULT);
                        }
                    }
                }
            }
        });
    };

    // HANDLER: Exportar a Excel
    const handleExport = () => {
        if (studentsList.length === 0) {
            toast.error("No hay datos para exportar.");
            return;
        }

        const headers = ["Legajo", "DNI", "Nombre", "Email", "Correlativas", "Recursante", "Condición"];
        const rows = studentsList.map(student => [
            student.dossier,
            student.id,
            student.name,
            student.email,
            student.allPreviousSubjectsApproved ? 'P' : '',
            student.alreadyStudied ? 'x' : '',
            student.finalCondition || ''
        ]);
        const sheetContent = [headers, ...rows];

        const subjectCode = course.getSubjectCode();
        const commission = course.getCommission();
        const year = course.getYear();

        spreadsheetManipulator.create(
            `Estudiantes - ${subjectCode} C${commission} ${year}`,
            `estudiantes-cursada`,
            sheetContent
        );
    };

    // CONFIGURACIÓN DE COLUMNAS (Con clases CSS incluidas)
    // CONFIGURACIÓN DE COLUMNAS (Con visualización 'x' y 'P')
    const tableColumns = [
        { header: "Legajo", accessor: "dossier" },
        {
            header: "DNI",
            accessor: "id",
            render: (row) => editingId === row.id 
                ? <input type="number" name="id" className="compact-input" value={editFormData.id} onChange={handleFormChange} /> 
                : row.id
        },
        {
            header: "Nombre",
            accessor: "name",
            render: (row) => editingId === row.id 
                ? <input type="text" name="name" className="compact-input" value={editFormData.name} onChange={handleFormChange} /> 
                : row.name
        },
        {
            header: "Email",
            accessor: "email",
            render: (row) => editingId === row.id 
                ? <input type="email" name="email" className="compact-input" value={editFormData.email} onChange={handleFormChange} /> 
                : row.email
        },
        {
            header: "Correlativas",
            accessor: "allPreviousSubjectsApproved",
            render: (row) => editingId === row.id 
                ? <input type="checkbox" name="allPreviousSubjectsApproved" checked={editFormData.allPreviousSubjectsApproved} onChange={handleFormChange} /> 
                : (row.allPreviousSubjectsApproved ? 'P' : '')
        },
        {
            header: "Recursante",
            accessor: "alreadyStudied",
            render: (row) => (row.alreadyStudied ? 'Sí' : 'No')
        },
        { 
            header: "Condición", 
            accessor: "finalCondition",
            render: (row) => editingId === row.id 
                ? (
                    <select 
                        name="finalCondition" 
                        className="compact-input" 
                        value={editFormData.finalCondition} 
                        onChange={handleFormChange}
                    >
                        <option value="P">P - Promovido</option>
                        <option value="R">R - Regular</option>
                        <option value="L">L - Libre</option>
                        <option value="A">A - Ausente</option>
                    </select>
                ) 
                : row.finalCondition
        },
        {
            header: "Acciones",
            accessor: "actions",
            render: (row) => {
                const isEditing = editingId === row.id;
                const isAnotherRowEditing = editingId !== null && editingId !== row.id;

                if (isEditing) {
                    return (
                        <div className="compact-actions">
                            <button className="btn-icon save" title="Guardar" onClick={() => handleSaveEdit(row.id)}>💾</button>
                            <button className="btn-icon cancel" title="Cancelar" onClick={() => setEditingId(null)}>❌</button>
                        </div>
                    );
                }
                return (
                    <div className="compact-actions">
                        <button 
                            className={`btn-icon edit ${isAnotherRowEditing ? 'disabled' : ''}`} 
                            onClick={() => handleEditClick(row)}
                            disabled={isAnotherRowEditing}
                            title="Modificar"
                        >
                            ✏️
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Listar alumnos</h1>
            
            <h2 className="selected-course-info">
                {course !== null 
                    ? `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}` 
                    : 'Sin cursada seleccionada'}
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

            {error ? (
                <div className="msg-error" style={{textAlign: 'center', marginTop: '20px', fontSize: '20px'}}>
                    {error}
                </div>
            ) : loading ? (
                <LoadingState message="Cargando estudiantes, por favor espere..." />
            ) : (
                <div id="students-table-export">
                    <Table 
                        columns={tableColumns} 
                        data={studentsList} 
                    />
                    
                    {studentsList.length > 0 && (
                        <button 
                            type="button" 
                            className="export-button" 
                            onClick={handleExport}
                            style={{ marginTop: '15px' }}
                        >
                            Exportar a Excel
                        </button>
                    )}
                </div>
            )}
        </PageLayout>
    );
};