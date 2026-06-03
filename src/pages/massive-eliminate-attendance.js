import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Diccionario de errores siguiendo tu estándar
const ERROR_MESSAGES = {
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al realizar la operación."
};

export function AttendanceMassiveElimination() {
    
    // ESTADOS: Datos
    const [events, setEvents] = useState([]);
    const [sourceEventId, setSourceEventId] = useState("");
    const [targetEventId, setTargetEventId] = useState("");
    const [registersCount, setRegistersCount] = useState(null);

    // ESTADOS: UI
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const [error, setError] = useState(null);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    // EFECTO: Cargar la lista de eventos de clase al iniciar
    useEffect(() => {
        if (!course) return;

        const getEventsList = async () => {
            setLoadingEvents(true);
            setError(null);
            try {
                const auth0Token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-class-events`, // Endpoint de asistencias
                    {
                        params: { 'course-id': course.getId() },
                        headers: { Authorization: `Bearer ${auth0Token}` }
                    }
                );
                
                if (response.status === 200) {
                    setEvents(response.data.eventList);
                }
            } catch (err) {
                console.error("Error cargando eventos:", err);
                
                const errorCode = err.response?.data?.errorCode;
                if (errorCode) {
                    setError(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES["DEFAULT"]);
                } else if (err.request) {
                    setError(ERROR_MESSAGES["NETWORK_ERROR"]);
                } else {
                    setError(ERROR_MESSAGES["DEFAULT"]);
                }
            } finally {
                setLoadingEvents(false);
            }
        };
        getEventsList();
    }, [course, getAccessTokenSilently]);

    // EFECTO: Buscar la cantidad de registros cuando cambia el evento seleccionado
    useEffect(() => {
        setError(null);

        if (!sourceEventId) {
            setRegistersCount(null);
            return;
        }

        const getRegistersCount = async () => {
            setIsLoadingCount(true);
            try {
                const auth0Token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-event-info`,
                    {
                        params: { 'event-id': sourceEventId },
                        headers: { Authorization: `Bearer ${auth0Token}` }
                    }
                );
                
                if (response.status === 200) {
                    setRegistersCount(response.data.eventRegistersList.length);
                }
            } catch (err) {
                console.error("Error cargando cantidad de registros:", err);
                setError("No se pudo obtener la información del evento seleccionado.");
                setRegistersCount(null);
            } finally {
                setIsLoadingCount(false);
            }
        };

        getRegistersCount();
    }, [sourceEventId, getAccessTokenSilently]);

    // HANDLER: Construir el label del select (adaptado para asistencias)
    const buildEventLabel = (event) => {
        let nameString = event.name ? ` "${event.name}" ` : ' ';
        let mandatoryString = event.mandatory ? 'obligatoria' : 'no obligatoria';
        return `${event.type}${nameString}(${mandatoryString})`;
    };

    // HANDLER: Eliminar masivamente
    const handleDeleteAll = async () => {
        if (!window.confirm(`ATENCIÓN: ¿Está seguro que desea eliminar TODAS las asistencias de esta clase/evento? Esta acción es irreversible.`)) return;
        
        setError(null);

        try {
            const auth0Token = await getAccessTokenSilently();
            await axios.delete(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/delete-all-registers`, {
                params: { 'event-id': sourceEventId },
                headers: { Authorization: `Bearer ${auth0Token}` }
            });
            
            setRegistersCount(0);
            alert("Asistencias eliminadas correctamente.");
            
        } catch (err) {
            console.error("Error eliminando asistencias:", err);
            
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.request) {
                setError(ERROR_MESSAGES["NETWORK_ERROR"]);
            } else {
                setError(ERROR_MESSAGES["DEFAULT"]);
            }
        }
    };

    // HANDLER: Transferir masivamente
    const handleTransfer = async (forceOverwrite = false) => {
        setError(null);

        try {
            const auth0Token = await getAccessTokenSilently();
            await axios.post(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/transfer-all-registers`, 
                {
                    sourceEventId: Number(sourceEventId),
                    targetEventId: Number(targetEventId),
                    forceOverwrite: forceOverwrite
                },
                { headers: { Authorization: `Bearer ${auth0Token}` } }
            );
            
            alert("Las asistencias se transfirieron correctamente.");
            setShowOverwriteModal(false);
            setSourceEventId("");
            setTargetEventId("");
            setRegistersCount(null);
            
        } catch (err) {
            console.error("Error transfiriendo asistencias:", err);

            if (err.response?.status === 409 && err.response?.data?.errorCode === 3) {
                setShowOverwriteModal(true);
            } else if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.request) {
                setError(ERROR_MESSAGES["NETWORK_ERROR"]);
            } else {
                setError(ERROR_MESSAGES["DEFAULT"]);
            }
        }
    };

    // Variable derivada para bloquear los botones si está cargando o no hay registros
    const isActionsDisabled = registersCount === 0 || isLoadingCount;

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Eliminar / Transferir Asistencias</h1>
            <h2 className="selected-course-info">
                {course && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}`}
            </h2>

            {error && (
                <div className="msg-error" style={{textAlign: 'center', margin: '20px 0', fontSize: '20px'}}>
                    {error}
                </div>
            )}
            
            {loadingEvents ? (
                <div className="modal-loading">
                    <div className="spinner"></div>
                    <p style={{fontSize: '20px'}}>Cargando clases/eventos...</p>
                </div>
            ) : (
                <form>
                    <p>Seleccionar Clase Origen</p>
                    <select 
                        id="source-event" 
                        value={sourceEventId} 
                        onChange={(e) => setSourceEventId(e.target.value)}
                        required
                    >
                        <option value="">SELECCIONAR CLASE</option>
                        {events.map(ev => (
                            <option key={ev.eventId} value={ev.eventId}>{buildEventLabel(ev)}</option>
                        ))}
                    </select>

                    {sourceEventId && (
                        <div className="massive-actions-container">
                            
                            {isLoadingCount ? (
                                <div className="modal-loading">
                                    <div className="spinner"></div>
                                    <p>Calculando registros...</p>
                                </div>
                            ) : (
                                <p>Esta clase contiene <strong>{registersCount} asistencias</strong> registradas.</p>
                            )}
                            
                            <button 
                                type="button" 
                                className={`delete-button ${isActionsDisabled ? "disabled" : ""}`} 
                                disabled={isActionsDisabled}
                                onClick={handleDeleteAll}
                                style={{ 
                                    backgroundColor: '#dc3545', 
                                    opacity: isActionsDisabled ? 0.5 : 1, 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '10px 15px', 
                                    borderRadius: '4px', 
                                    cursor: isActionsDisabled ? 'not-allowed' : 'pointer' 
                                }}
                            >
                                Eliminar todas las asistencias de la clase
                            </button>

                            <hr className="actions-divider" />

                            <p>Transferir a Clase Destino</p>
                            <select 
                                id="target-event" 
                                value={targetEventId} 
                                onChange={(e) => setTargetEventId(e.target.value)}
                                disabled={isActionsDisabled}
                            >
                                <option value="">SELECCIONAR CLASE DESTINO</option>
                                {events.filter(ev => String(ev.eventId) !== String(sourceEventId)).map(ev => (
                                    <option key={ev.eventId} value={ev.eventId}>{buildEventLabel(ev)}</option>
                                ))}
                            </select>
                            
                            <button 
                                type="button" 
                                className={`transfer-button ${(!targetEventId || isActionsDisabled) ? "disabled" : ""}`} 
                                disabled={!targetEventId || isActionsDisabled} 
                                onClick={() => handleTransfer(false)}
                            >
                                Transferir Asistencias
                            </button>

                            {showOverwriteModal && (
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
                                    <h3 style={{ color: '#856404', marginBottom: '10px' }}>⚠️ Conflicto de Transferencia</h3>
                                    <p>La clase destino ya contiene asistencias registradas.</p>
                                    <p>¿Desea <strong>eliminar</strong> los registros actuales del destino y <strong>sobrescribirlos</strong> con las asistencias de la clase origen?</p>
                                    
                                    <div className="modal-actions" style={{ marginTop: '15px' }}>
                                        <button 
                                            type="button" 
                                            className="confirm-button" 
                                            onClick={() => handleTransfer(true)}
                                            style={{ backgroundColor: '#dc3545', color: 'white', marginRight: '10px', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Sí, Sobrescribir
                                        </button>
                                        <button 
                                            type="button" 
                                            className="cancel-button" 
                                            onClick={() => setShowOverwriteModal(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </form>
            )}
        </PageLayout>
    );
}