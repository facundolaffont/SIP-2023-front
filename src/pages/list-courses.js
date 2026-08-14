import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react"; 
import { useHistory } from "react-router-dom";
import axios from 'axios';
import { PageLayout } from "../components/page-layout"; 
import { Table } from "../components/Table"; 
import { LoadingState } from "../components/LoadingState";
import toast from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";

import '../styles/list-course-events.css'; 

// Diccionario de errores
const ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": "Ocurrió un error en los servidores al cargar las cursadas. Intente en unos minutos.",
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar los datos."
};

// FUNCIÓN: Para convertir el formato de las fechas a dia/mes/año
const formatDate = (dateString) => {
    if (!dateString) return '--';
    const [year, month, day] = dateString.split('-'); 
    return `${day}/${month}/${year}`;
};

export function ListCourses() {
    // ESTADOS: Para Auth0
    const { getAccessTokenSilently } = useAuth0();
    // ESTADOS: Para redirigir
    const history = useHistory();
    // ESTADOS: Datos
    const [coursesList, setCoursesList] = useState([]);
    // ESTADOS: UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para controlar el modal de forma centralizada
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmType: "danger",
        onConfirm: () => {}
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    // EFECTO: Cargar las cursadas al iniciar
    useEffect(() => {
        const getCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                // Obtener token Auth0
                const auth0Token = await getAccessTokenSilently();
                // Ejecutar petición
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/all`,
                    { headers: { Authorization: `Bearer ${auth0Token}` } }
                );
                // Mapear los datos
                const formattedCourses = response.data.map(course => {
                    const nombreAsignatura = course.nombreAsignatura || "Sin Asignatura";
                    const codigoAsignatura = course.codigoAsignatura || "Sin código";
                    return {
                        id: course.id,
                        carrera: course.nombreCarrera|| "Sin Carrera",   
                        asignatura: `${nombreAsignatura} (${codigoAsignatura})`,
                        comision: course.numeroComision || "Sin Número de Comisión", 
                        anio: course.anio || "--",
                        fechaInicio: formatDate(course.fechaInicio),
                        fechaFin: formatDate(course.fechaFin)
                    };
                });
                setCoursesList(formattedCourses);
            } catch (error) {
                console.error("Error cargando cursadas:", error);
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
        getCourses();
    }, [getAccessTokenSilently]);

    // HANDLER: Editar cursada 
    const handleEdit = (courseId) => {
        history.push(`/modificate-course/${courseId}`);
    };

    // HANDLER: Eliminar cursada
    const handleDelete = async (id) => {
        setModalState({
            isOpen: true,
            title: "Eliminar Cursada",
            message: `¿Estás seguro de que deseas eliminar la cursada con ID ${id}?`,
            confirmType: "danger", 
            onConfirm: async () => {
                closeModal();
                try {
                    const auth0Token = await getAccessTokenSilently();
                    await axios.delete(
                        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/delete`, 
                        {
                            headers: { Authorization: `Bearer ${auth0Token}` },
                            params: { id }
                        }
                    );
                    // Actualizamos el estado removiendo la cursada eliminada
                    setCoursesList(prev => prev.filter(c => c.id !== id));
                    toast.success("Cursada eliminada correctamente");
                } catch (error) {
                    console.error("Error eliminando cursada:", error);
                    toast.error("Hubo un problema al eliminar la cursada. " + (error.response?.data || ""));
                }
            }
        });        
    };

    // CONFIGURACIÓN DE COLUMNAS (Para componente Table)
    const tableColumns = [
        { header: "ID", accessor: "id" },
        { header: "Carrera", accessor: "carrera" },
        { header: "Asignatura", accessor: "asignatura" },
        { header: "Comisión", accessor: "comision" },
        { header: "Año", accessor: "anio" },
        { header: "Fecha Inicio", accessor: "fechaInicio" },
        { header: "Fecha Fin", accessor: "fechaFin" },
        { 
            header: "Acciones", 
            accessor: "actions",
            // Render prop: Inyectamos los botones de React atados a nuestras funciones de arriba
            render: (row) => (
                <div className="actions-container">
                    <button className="edit-button" onClick={() => handleEdit(row.id)}>
                        Modificar
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(row.id)}>
                        Eliminar
                    </button>
                </div>
            )
        }
    ];

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Listar cursadas
            </h1>

            <ConfirmModal 
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmType={modalState.confirmType}
                onConfirm={modalState.onConfirm}
                onCancel={closeModal}
            />

            {error && (
                <div className="msg-error" style={{textAlign: 'center', marginTop: '20px', fontSize: '20px'}}>
                    {error}
                </div>
            )}
            
            {loading ? (
                <LoadingState message="Cargando cursadas, por favor espere..." />
            ) : (
                <Table 
                    columns={tableColumns} 
                    data={coursesList}
                />
            )}
        </PageLayout>
    );
}

export default ListCourses;