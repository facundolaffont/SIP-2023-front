import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { PageLayout } from "../components/page-layout";
import { Table } from "../components/Table"; 
import { LoadingState } from "../components/LoadingState"; 

import '../styles/list-course-events.css'; 

// Diccionario de errores
const ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": "Ocurrió un error en los servidores al cargar las asignaturas. Intente en unos minutos.",
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar los datos."
};

export function ListSubjects() {
    // ESTADOS: Para Auth0
    const { getAccessTokenSilently } = useAuth0();
    // ESTADOS: Datos
    const [subjects, setSubjects] = useState([]);
    const [careers, setCareers] = useState([]);
    // ESTADOS: Datos editados
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({ 
        careerId: "", 
        subjectCode: "", 
        subjectName: "" 
    });
    // ESTADOS: UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // EFECTO: Cargar las asignaturas y carreras al iniciar
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(false);
            try {
                const auth0Token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${auth0Token}` };
                const baseUrl = process.env.REACT_APP_API_SERVER_URL;
                const [subjectsResponse, careersResponse] = await Promise.all([
                    axios.get(`${baseUrl}/api/v1/subject/all`, { headers }),
                    axios.get(`${baseUrl}/api/v1/career/all`, { headers }) 
                ]);

                setSubjects(subjectsResponse.data);
                setCareers(careersResponse.data);
            } catch (err) {
                console.error("Error cargando asignaturas o carreras:", err);

                const errorCode = err.response?.data?.errorCode;
                if (errorCode) {
                    setError(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES["DEFAULT"]);
                } else if (err.request) {
                    setError(ERROR_MESSAGES["NETWORK_ERROR"]);
                } else {
                    setError(ERROR_MESSAGES["DEFAULT"]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [getAccessTokenSilently]);

    // HANDLER: Click en "Modificar", permite modificar "in-line"
    const handleEditClick = (subj) => {
        setError(null);
        setEditingId(subj.id);
        setEditFormData({
            careerId: subj.idCarrera || "",
            subjectCode: subj.codigo|| "",
            subjectName: subj.nombre || "" 
        });
    };

    // HANDLER: Cambios en el formulario de edición
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    // HANDLER: Guardar cambios de edición
    const handleSaveEdit = async (id) => {
        if (!window.confirm(`¿Estás seguro de que deseas guardar los cambios en la asignatura ID: ${id}?`)) return;
        setError(null);

        try {
            const token = await getAccessTokenSilently();
            
            const payload = {
                id: Number(id),
                careerId: Number(editFormData.careerId),
                subjectCode: Number(editFormData.subjectCode), 
                subjectName: editFormData.subjectName        
            };

            await axios.put(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/subject/update`,
                payload, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const selectedCareer = careers.find(c => String(c.id) === String(editFormData.careerId));

            // Actualizamos la vista local
            setSubjects(prev => prev.map(subj => 
                subj.id === id ? { 
                    ...subj, 
                    codigo: payload.subjectCode,
                    nombre: payload.subjectName,
                    idCarrera: selectedCareer ? selectedCareer.id : null,
                    nombreCarrera: selectedCareer ? selectedCareer.nombre : "Sin Carrera"
                } : subj
            ));
            
            setEditingId(null);
            alert("Asignatura actualizada con éxito.");
        } catch (err) {
            console.error("Error al guardar:", err);
            setError("Error al actualizar la asignatura.");
        }
    };

    // HANDLER: Eliminar asignatura
    const handleDelete = async (id) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la asignatura ID: ${id}?`)) return;
        setError(null); 
        
        try {
            const token = await getAccessTokenSilently();
            
            await axios.delete(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/subject/delete`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { id: id } 
            });
            
            setSubjects(prev => prev.filter(s => s.id !== id));
            alert("Asignatura eliminada correctamente.");
        } catch (err) {
            console.error("Error eliminando:", err);
            if (err.response?.data?.errorCode) {
                const errorCode = err.response.data.errorCode;
                switch (errorCode) {
                    case "HAS_DEPENDENCIES":
                        setError("No se puede eliminar: Esta asignatura tiene comisiones asociadas.");
                        break;
                    case "NOT_FOUND":
                        setError("La asignatura que intentás borrar no existe.");
                        break;
                    case "INTERNAL_ERROR":
                        setError("Ocurrió un error en el servidor al procesar la solicitud.");
                        break;
                    default:
                        setError("Ocurrió un error inesperado al eliminar la asignatura.");
                }
            } else {
                setError("Hubo un problema de conexión al intentar eliminar la asignatura.");
            }            
        }
    };

    // CONFIGURACIÓN DE COLUMNAS (Para componente Table)
    const tableColumns = [
        { header: "ID", accessor: "id" },
        { 
            header: "Carrera", 
            accessor: "idCarrera",
            render: (row) => {
                const isEditing = editingId === row.id;

                if (isEditing) {
                    return (
                        <select name="careerId" value={editFormData.careerId} onChange={handleFormChange}>
                            <option value="">Seleccione Carrera</option>
                            {careers.map(car => (
                                <option key={car.id} value={car.id}>
                                    {car.nombre}
                                </option>
                            ))}
                        </select>
                    );
                }

                return row.nombreCarrera || "Sin Carrera";
            }
        },
        { 
            header: "Código", 
            accessor: "codigo",
            render: (row) => {
                const isEditing = editingId === row.id;

                if (isEditing) {
                    return (
                        <input 
                            type="number" 
                            name="subjectCode" 
                            value={editFormData.subjectCode} 
                            onChange={handleFormChange} 
                        />
                    );
                }

                return row.codigo;
            }
        },
        { 
            header: "Nombre", 
            accessor: "nombre",
            render: (row) => {
                const isEditing = editingId === row.id;

                if (isEditing) {
                    return (
                        <input 
                            type="text" 
                            name="subjectName" 
                            value={editFormData.subjectName} 
                            onChange={handleFormChange} 
                        />
                    );
                }

                return row.nombre;
            }
        },
        { 
            header: "Acciones", 
            accessor: "actions",
            render: (row) => {
                const isEditing = editingId === row.id;
                const isAnotherRowEditing = editingId !== null && editingId !== row.id;

                if (isEditing) {
                    return (
                        <div className="actions-container">
                            <button className="confirm-button" onClick={() => handleSaveEdit(row.id)}>Confirmar</button>
                            <button className="cancel-button" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                    );
                }

                return (
                    <div className="actions-container">
                        <button 
                            className={`edit-button ${isAnotherRowEditing ? 'disabled' : ''}`} 
                            onClick={() => handleEditClick(row)}
                            disabled={isAnotherRowEditing}
                        >
                            Modificar
                        </button>
                        <button 
                            className={`delete-button ${isAnotherRowEditing ? 'disabled' : ''}`} 
                            onClick={() => handleDelete(row.id)}
                            disabled={isAnotherRowEditing}
                        >
                            Eliminar
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Listar Asignaturas</h1>
            
            {error && (
                <div className="msg-error" style={{textAlign: 'center', marginTop: '20px', fontSize: '20px'}}>
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingState message="Cargando asignaturas, por favor espere..." />
            ) : (
                <Table 
                    columns={tableColumns}
                    data={subjects}
                />
            )}
        </PageLayout>
    );
}

export default ListSubjects;