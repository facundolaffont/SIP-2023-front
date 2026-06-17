import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";
import toast from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";

// Diccionario de errores
const ERROR_MESSAGES = {
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al realizar la operación."
};

export function CalificationsMassiveElimination() {
    
    // ESTADOS: Datos
    const [events, setEvents] = useState([]);
    const [sourceEventId, setSourceEventId] = useState("");
    const [targetEventId, setTargetEventId] = useState("");
    const [registersCount, setRegistersCount] = useState(null);

    // ESTADOS: UI
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const [error, setError] = useState(null);
    const { getAccessTokenSilently } = useAuth0();

    // Estado para controlar el modal de forma centralizada
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmType: "danger",
        confirmText: "Aceptar",
        onConfirm: () => {}
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

// EFECTO: Cargar la lista de eventos al iniciar
    useEffect(() => {
        if (!course) return;

        const getEventsList = async () => {
            setLoadingEvents(true);
            setError(null);
            try {
                const auth0Token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-evaluation-events`,
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
                toast.error("No se pudo obtener la cantidad de calificaciones de este evento");
                setRegistersCount(null);
            } finally {
                setIsLoadingCount(false);
            }
        };

        getRegistersCount();
    }, [sourceEventId, getAccessTokenSilently]);

    // HANDLER: Construir el label del select
    const buildEventLabel = (event) => {
        let nameString = event.name ? ` "${event.name}"` : '';
        return `${event.type}${nameString}`;
    };

    // HANDLER: Eliminar masivamente
    const handleDeleteAll = async () => {
        setModalState({
            isOpen: true,
            title: "Eliminar calificaciones masivamente",
            message: `¿Está seguro de que desea eliminar las calificaciones (${registersCount}) de este evento? Esta acción no se puede deshacer.`,
            confirmType: "danger",
            confirmText: "Sí, Eliminar",
            onConfirm: async () => {
                closeModal();
                try {
                    const auth0Token = await getAccessTokenSilently();
                    await axios.delete(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/delete-all-registers`, {
                        params: { 'event-id': sourceEventId },
                        headers: { Authorization: `Bearer ${auth0Token}` }
                    });
                    setRegistersCount(0);
                    toast.success("Calificaciones eliminadas correctamente");
                } catch (err) {
                    console.error("Error eliminando calificaciones:", err);
                    if (err.response && err.response.data && err.response.data.message) {
                        toast.error(err.response.data.message);
                    } else if (err.request) {
                        toast.error(ERROR_MESSAGES["NETWORK_ERROR"]);
                    } else {
                        toast.error(ERROR_MESSAGES["DEFAULT"]);
                    }
                }
            }
        });
    };

    const handleTransferClick = () => {
        const targetEvent = events.find(ev => String(ev.eventId) === String(targetEventId));
        const targetLabel = targetEvent ? buildEventLabel(targetEvent) : `ID ${targetEventId}`;
        
        setModalState({
            isOpen: true,
            title: "Transferencia de calificaciones",
            message: `Vas a transferir las ${registersCount} calificaciones del evento origen hacia el evento destino: "${targetLabel}". ¿Desea continuar?`,
            confirmType: "primary",
            confirmText: "Transferir",
            onConfirm: () => {
                closeModal();
                executeTransfer(false); 
            }
        });
    };

    const executeTransfer = async (forceOverwrite = false) => {
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
            
            toast.success("Las calificaciones se transfirieron correctamente");
            
            // Limpiamos el formulario tras el éxito
            setSourceEventId("");
            setTargetEventId("");
            setRegistersCount(null);
            
        } catch (err) {
            console.error("Error transfiriendo calificaciones:", err);
            // ⚠️ SI HAY CONFLICTO (Código 409 y errorCode 3):
            if (!forceOverwrite && err.response?.status === 409 && err.response?.data?.errorCode === 3) {
                setModalState({
                    isOpen: true,
                    title: "⚠️ Conflicto de Transferencia",
                    message: "El evento destino ya contiene calificaciones registradas. Si continuás, los registros actuales del destino se borrarán permanentemente y serán reemplazados por los del evento origen. ¿Querés forzar la sobrescritura?",
                    confirmType: "danger",
                    confirmText: "Sí, Sobrescribir",
                    onConfirm: () => {
                        closeModal();
                        executeTransfer(true); // Se vuelve a llamar para sobrescribir
                    }
                });
            } else if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else if (err.request) {
                toast.error(ERROR_MESSAGES["NETWORK_ERROR"]);
            } else {
                toast.error(ERROR_MESSAGES["DEFAULT"]);
            }
            
        }
    };

    // Variable derivada para bloquear los botones si está cargando o no hay registros
    const isActionsDisabled = registersCount === null || registersCount === 0 || isLoadingCount;

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Eliminar / Transferir Calificaciones</h1>
            <h2 className="selected-course-info">
                {course && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}`}
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

            {/* Manejo de errores estilo ListProfessors.js (con estilos en línea permitidos acá) */}
            {error && (
                <div className="msg-error" style={{textAlign: 'center', margin: '20px 0', fontSize: '20px'}}>
                    {error}
                </div>
            )}
            {/* Estado de carga inicial estilo ListProfessors.js (con estilos en línea permitidos acá) */}
            {loadingEvents ? (
                <div className="modal-loading">
                    <div className="spinner"></div>
                    <p style={{fontSize: '20px'}}>Cargando eventos...</p>
                </div>
            ) : (
                <form>
                    <p>Seleccionar Evento Origen</p>
                    <select 
                        id="source-event" 
                        value={sourceEventId} 
                        onChange={(e) => setSourceEventId(e.target.value)}
                        required
                    >
                        <option value="">SELECCIONAR EVENTO</option>
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
                                <p>Este evento contiene <strong>{registersCount !== null ? registersCount : "0"} calificaciones</strong> registradas.</p>
                            )}
                            
                            <button 
                                type="button" 
                                className={`delete-button ${isActionsDisabled ? "disabled" : ""}`} 
                                disabled={isActionsDisabled}
                                onClick={handleDeleteAll}
                                style={{ backgroundColor: isActionsDisabled ? '#cc868c' : '#dc3545'}}
                            >
                                Eliminar todas las calificaciones del evento
                            </button>

                            <hr className="actions-divider" />

                            <p>Transferir a Evento Destino</p>
                            <select 
                                id="target-event" 
                                value={targetEventId} 
                                onChange={(e) => setTargetEventId(e.target.value)}
                                disabled={isActionsDisabled}
                            >
                                <option value="">SELECCIONAR EVENTO DESTINO</option>
                                {events.filter(ev => String(ev.eventId) !== String(sourceEventId)).map(ev => (
                                    <option key={ev.eventId} value={ev.eventId}>{buildEventLabel(ev)}</option>
                                ))}
                            </select>
                            
                            <button 
                                type="button" 
                                className={`transfer-button ${(!targetEventId || isActionsDisabled) ? "disabled" : ""}`} 
                                disabled={!targetEventId || isActionsDisabled} 
                                onClick={handleTransferClick}
                            >
                                Transferir Calificaciones
                            </button>

                        </div>
                    )}
                </form>
            )}
        </PageLayout>
    );
}