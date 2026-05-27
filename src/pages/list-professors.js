import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { PageLayout } from "../components/page-layout";
import { Table } from "../components/Table"; 

import '../styles/list-course-events.css'; 

// Diccionario de errores
const ERROR_MESSAGES = {
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar los datos."
};

export function ListProfessors() {
    // ESTADOS: Para Auth0
    const { getAccessTokenSilently } = useAuth0();
    // ESTADOS: Datos
    const [docentes, setDocentes] = useState([]);
    // ESTADOS: Datos editados
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        legajo: "",
        nombre: "",
        apellido: "",
        email: ""
    });
    // ESTADOS: UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // EFECTO: Cargar los docentes al iniciar
    useEffect(() => {
        const fetchDocentes = async () => {
            setLoading(true);
            setError(null);
            try {
                const auth0Token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/users/get-all-professors`, 
                    { headers: { Authorization: `Bearer ${auth0Token}` } }
                );
                setDocentes(response.data);
            } catch (err) {
                console.error("Error cargando docentes:", err);

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
        fetchDocentes();
    }, [getAccessTokenSilently]);

    // HANDLER: Click en "Modificar", permite modificar "in-line"
    const handleEditClick = (docente) => {
        setError(null);
        setEditingId(docente.id);
        setEditFormData({
            legajo: docente.legajo || "",
            nombre: docente.nombre || "",
            apellido: docente.apellido || "",
            email: docente.email || ""
        });
    };

    // HANDLER: Cambios en el formulario de edición
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    // HANDLER: Guardar cambios de edición
    const handleSaveEdit = async (id) => {
        // Validaciones básicas de Front
        if (!editFormData.nombre.trim() || !editFormData.apellido.trim() || !editFormData.email.trim() || !editFormData.legajo) {
            alert("Por favor, completá los campos obligatorios (Legajo, Nombre, Apellido, Email).");
            return;
        }

        if (!window.confirm(`¿Guardar cambios para el docente?`)) return;
        setError(null);

        try {
            const auth0Token = await getAccessTokenSilently();
            
            
            const payload = {
                id: String(id), 
                email: editFormData.email.trim(),
                nombre: editFormData.nombre.trim(),
                apellido: editFormData.apellido.trim(),
                legajo: Number(editFormData.legajo)
            };

            await axios.put(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/users/update-professor`,
                payload, 
                { headers: { Authorization: `Bearer ${auth0Token}` } }
            );

            
            setDocentes(prev => prev.map(doc => 
                doc.id === id ? { ...doc, ...payload } : doc
            ));
            
            setEditingId(null);
            alert("Docente actualizado con éxito.");
        } catch (err) {
            console.error("Error al guardar:", err);
            setError("Error al actualizar los datos del docente.");
        }
    };

    // HANDLER: Eliminar docente
    const handleDelete = async (id) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar este docente? Esta acción es irreversible.`)) return;
        setError(null); 

        try {
            const auth0Token = await getAccessTokenSilently();
            
            await axios.delete(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/users/delete-professor`, {
                headers: { Authorization: `Bearer ${auth0Token}` },
                params: { id: String(id) } 
            });
    
            
            setDocentes(prev => prev.filter(d => d.id !== id));
            alert("Docente eliminado correctamente.");
        } catch (error) {
            console.error("Error eliminando docente:", error);

            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            }
            else if (error.request) {
                setError(ERROR_MESSAGES["NETWORK_ERROR"]);
            }
            else {
                setError(ERROR_MESSAGES["DEFAULT"]);
            }
        }
    };

    // CONFIGURACIÓN DE COLUMNAS (Para componente Table)
    const tableColumns = [
        { 
            header: "Legajo", 
            accessor: "legajo",
            render: (row) => {
                const isEditing = editingId === row.id;
                return isEditing ? (
                    <input 
                        type="number" 
                        name="legajo" 
                        value={editFormData.legajo} 
                        onChange={handleFormChange}
                        className="edit-input"
                    />
                ) : row.legajo;
            }
        },
        { 
            header: "Nombre", 
            accessor: "nombre",
            render: (row) => {
                const isEditing = editingId === row.id;
                return isEditing ? (
                    <input 
                        type="text" 
                        name="nombre" 
                        value={editFormData.nombre} 
                        onChange={handleFormChange}
                        className="edit-input"
                    />
                ) : row.nombre;
            }
        },
        { 
            header: "Apellido", 
            accessor: "apellido",
            render: (row) => {
                const isEditing = editingId === row.id;
                return isEditing ? (
                    <input 
                        type="text" 
                        name="apellido" 
                        value={editFormData.apellido} 
                        onChange={handleFormChange}
                        className="edit-input"
                    />
                ) : row.apellido;
            }
        },
        { 
            header: "Email", 
            accessor: "email",
            render: (row) => {
                const isEditing = editingId === row.id;
                return isEditing ? (
                    <input 
                        type="email" 
                        name="email" 
                        value={editFormData.email} 
                        onChange={handleFormChange}
                        className="edit-input"
                    />
                ) : row.email;
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
                            <button className="confirm-button" onClick={() => handleSaveEdit(row.id)}>Guardar</button>
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
            <h1 id="page-title" className="content__title">Listado de Docentes</h1>

            {error && (
                <div className="msg-error" style={{textAlign: 'center', marginTop: '20px', fontSize: '20px'}}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="modal-loading">
                    <div className="spinner"></div>
                    <p style={{fontSize: '20px'}}>Cargando docentes...</p>
                </div>
            ) : (
                <Table 
                    columns={tableColumns}
                    data={docentes}
                />
            )}
        </PageLayout>
    );
}

export default ListProfessors;