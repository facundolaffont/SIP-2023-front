import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { PageLayout } from "../components/page-layout";
import { Table } from "../components/Table"; 

import '../styles/list-course-events.css'; 

// Diccionario de errores
const ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": "Ocurrió un error en los servidores al cargar las comisiones. Intente en unos minutos.",
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar los datos."
};

export function ListCommissions() {
    // ESTADOS: Para Auth0
    const { getAccessTokenSilently } = useAuth0();
    // ESTADOS: Datos
    const [commissions, setCommissions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    // ESTADOS: Datos editados
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({ subjectId: "", commissionNumber: "" });
    // ESTADOS: UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // EFECTO: Cargar las comisiones y asignaturas al iniciar
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const auth0Token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${auth0Token}` };
                const baseUrl = process.env.REACT_APP_API_SERVER_URL;
                const [commissionsResponse, subjectsResponse] = await Promise.all([
                    axios.get(`${baseUrl}/api/v1/commission/all`, { headers }),
                    axios.get(`${baseUrl}/api/v1/subject/all`, { headers })
                ]);
                setCommissions(commissionsResponse.data);
                setSubjects(subjectsResponse.data);
            } catch (err) {
                console.error("Error cargando comisiones o asignaturas:", err);
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

    
    // FUNCIÓN: Para mostrar qué números de comisión están ocupados
    // (excluyendo la comisión que se está editando)
    const getOccupiedNumbers = (subjectId) => {
        if (!subjectId) return "Seleccione asignatura";
        const occupied = commissions
            .filter(c => String(c.idAsignatura) === String(subjectId) && c.id !== editingId)
            .map(c => c.numero);
        return occupied.length > 0 ? `Ocupados: ${occupied.join(", ")}` : "Todos disponibles";
    };

    // HANDLER: Click en "Modificar", permite modificar "in-line"
    const handleEditClick = (comm) => {
        setError(null);
        setEditingId(comm.id);
        setEditFormData({
            subjectId: comm.idAsignatura|| "",
            commissionNumber: comm.numero || ""
        });
    };

    // HANDLER: Cambios en el formulario de edición
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    // HANDLER: Guardar cambios de edición
    const handleSaveEdit = async (id) => {
        if (!window.confirm(`¿Estás seguro de que deseas guardar los cambios en la comisión ID: ${id}?`)) return;
        setError(null); 

        try {
            const token = await getAccessTokenSilently();
            
            const payload = {
                id: Number(id),
                subjectId: Number(editFormData.subjectId),
                commissionNumber: Number(editFormData.commissionNumber)
            };

            await axios.put(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/commission/update`,
                payload, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const selectedSubject = subjects.find(s => String(s.id) === String(editFormData.subjectId));

            setCommissions(prev => prev.map(comm => 
                comm.id === id ? { 
                    ...comm, 
                    numero: payload.commissionNumber,
                    idAsignatura: selectedSubject.id,
                    nombreAsignatura: selectedSubject.nombre,
                    codigoAsignatura: selectedSubject.codigo,
                    idCarrera: selectedSubject.idCarrera|| null,
                    nombreCarrera: selectedSubject.nombreCarrera || "Sin Carrera"
                } : comm
            ));
            
            setEditingId(null);
            alert("Comisión actualizada con éxito.");
        } catch (err) {
            console.error("Error al guardar:", err);
            setError("Error al actualizar la comisión.");
        }
    };

    // HANDLER: Eliminar comisión
    const handleDelete = async (id) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la comisión ID: ${id}?`)) return;
        setError(null); 
        try {
            const token = await getAccessTokenSilently();
            
            await axios.delete(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/commission/delete`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { id: id } 
            });
            
            setCommissions(prev => prev.filter(c => c.id !== id));
            alert("Comisión eliminada correctamente.");
        } catch (err) {
            console.error("Error eliminando:", err);
            if (err.response?.data?.errorCode) {
                const errorCode = err.response.data.errorCode;
                switch (errorCode) {
                    case "HAS_DEPENDENCIES":
                        setError("No se puede eliminar: Esta comisión tiene cursadas asociadas.");
                        break;
                    case "NOT_FOUND":
                        setError("La comisión que intentás borrar no existe.");
                        break;
                    case "INTERNAL_ERROR":
                        setError("Ocurrió un error en el servidor al procesar la solicitud.");
                        break;
                    default:
                        setError("Ocurrió un error inesperado al eliminar la comisión.");
                }
            } else {
                setError("Hubo un problema de conexión al intentar eliminar la comisión.");
            }            
        }
    };

    // CONFIGURACIÓN DE COLUMNAS (Para componente Table)
    const tableColumns = [
        { header: "ID", accessor: "id" },
        { 
            header: "Asignatura", 
            accessor: "asignatura",
            render: (row) => {
                const isEditing = editingId === row.id;
                
                if (isEditing) {
                    return (
                        <select name="subjectId" value={editFormData.subjectId} onChange={handleFormChange}>
                            <option value="">Seleccione Asignatura</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.nombreCarrera} - {sub.nombre} ({sub.codigo})
                                </option>
                            ))}
                        </select>
                    );
                }
                
                return row.nombreAsignatura
                    ? `${row.nombreCarrera || "Sin Carrera"} - ${row.nombreAsignatura} (${row.codigoAsignatura})`
                    : "Sin Asignatura";
            }
        },
        { 
            header: "Número de Comisión", 
            accessor: "numero",
            render: (row) => {
                const isEditing = editingId === row.id;
                
                if (isEditing) {
                    return (
                        <input 
                            type="number" 
                            name="commissionNumber" 
                            value={editFormData.commissionNumber} 
                            onChange={handleFormChange} 
                            placeholder={getOccupiedNumbers(editFormData.subjectId)}
                        />
                    );
                }
                
                return row.numero;
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
            <h1 id="page-title" className="content__title">Listar Comisiones</h1>

            {error && (
                <div className="msg-error" style={{textAlign: 'center', marginTop: '20px', fontSize: '20px'}}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="modal-loading">
                    <div className="spinner"></div>
                    <p style={{fontSize: '20px'}}>Cargando comisiones, por favor espere...</p>
                </div>
            ) : (
                <Table 
                    columns={tableColumns}
                    data={commissions}
                />
            )}
        </PageLayout>
    );
}

export default ListCommissions;