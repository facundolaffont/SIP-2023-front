// Imports de componentes externos.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory } from 'react-router-dom';
import toast from "react-hot-toast";

// Imports de componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";
import { ConfirmModal } from "../components/ConfirmModal";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";

// Imports de estilos.
import '../styles/send-califications.css';

const ERROR_MESSAGES = { 
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.", 
    "DEFAULT": "Hubo un problema inesperado." 
};

export function SendCalifications() {

    const { getAccessTokenSilently } = useAuth0();
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado de envío por evento: { [eventId]: 'idle' | 'sending' | 'sent' | 'error' }
    const [sendingState, setSendingState] = useState({});

    const [modalState, setModalState] = useState({ 
        isOpen: false, 
        title: "", 
        message: "", 
        confirmType: "danger", 
        confirmText: "Aceptar", 
        onConfirm: () => {} 
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    // Redirige si no hay cursada seleccionada.
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    // Carga el resumen de emails al montar.
    useEffect(() => {
        if (!course) return;

        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                setLoading(true);
                const auth0Token = await getAccessTokenSilently();

                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-calification-events-email-summary`,
                    {
                        params: { 'course-id': course.getId() },
                        headers: { Authorization: `Bearer ${auth0Token}` },
                    }
                );

                setSummary(response.data);
            } catch (err) {
                if (!err.response) {
                    setError(ERROR_MESSAGES.NETWORK_ERROR);
                } else {
                    setError(ERROR_MESSAGES.DEFAULT);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [course]);

    /**
     * Envía las calificaciones por email para un evento específico,
     * previa confirmación del usuario.
     */
    const handleSendEmails = (eventId, eventName) => {
        setModalState({
            isOpen: true,
            title: "Enviar calificaciones",
            message: `¿Estás seguro de que deseas enviar las calificaciones por email a los alumnos del evento "${eventName}"?`,
            confirmType: "primary",
            confirmText: "Enviar",
            onConfirm: async () => {
                closeModal();
                setSendingState(prev => ({ ...prev, [eventId]: 'sending' }));
                try {
                    const auth0Token = await getAccessTokenSilently();
                    await axios.post(
                        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/send-grades-email`,
                        null,
                        {
                            params: { 'event-id': eventId },
                            headers: { Authorization: `Bearer ${auth0Token}` },
                        }
                    );
                    setSendingState(prev => ({ ...prev, [eventId]: 'sent' }));
                    toast.success("El envío de calificaciones fue iniciado correctamente. Los alumnos con email registrado recibirán su calificación en breve.");
                } catch (err) {
                    setSendingState(prev => ({ ...prev, [eventId]: 'error' }));
                    if (!err.response) {
                        toast.error(ERROR_MESSAGES.NETWORK_ERROR);
                    } else {
                        toast.error(ERROR_MESSAGES.DEFAULT);
                    }
                }
            }
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('es-AR', {
            weekday: 'short', day: '2-digit', month: '2-digit',
            year: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatPct = (n) => `${Number(n).toFixed(1)}%`;

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">Envío de calificaciones por email</h1>
            <h2 className="selected-course-info">
                {course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`}
                {course === null && 'Sin cursada seleccionada'}
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

            {error && (
                <div className="msg-error" style={{textAlign: 'center', marginTop: '20px', fontSize: '20px'}}>
                    {error}
                </div>
            )}

            {loading && !error && (
                <LoadingState message="Cargando información, por favor espere..." />
            )}

            {!loading && !error && summary && (
                <>
                    {/* Cartelito global de cobertura de email */}
                    <div className={`send-cal__email-alert ${summary.studentsWithoutEmail > 0 ? 'send-cal__email-alert--warning' : 'send-cal__email-alert--ok'}`}>
                        <strong>{summary.studentsWithEmail} de {summary.totalStudents} alumno{summary.totalStudents !== 1 ? 's' : ''}</strong> de la cursada tienen dirección de email registrada.
                        {summary.studentsWithoutEmail > 0 && (
                            <span className="send-cal__email-alert__sub">
                                {' '}<strong>{summary.studentsWithoutEmail} alumno{summary.studentsWithoutEmail !== 1 ? 's' : ''}</strong> no recibirán el email por no tener dirección registrada.
                            </span>
                        )}
                    </div>

                    {/* Listado de eventos */}
                    {summary.events.length === 0 ? (
                        <EmptyState message="No hay eventos de evaluación registrados para esta cursada." />
                    ) : (
                        <div className="send-cal__events-grid">
                            {summary.events.map(event => {
                                const state = sendingState[event.eventId] || 'idle';
                                return (
                                    <div key={event.eventId} className="send-cal__event-card">
                                        <div className="send-cal__event-card__header">
                                            <span className="send-cal__event-card__name">{event.eventName}</span>
                                            <span className="send-cal__event-card__date">
                                                {formatDate(event.initialDate)}
                                                {event.endDate && ` - ${formatDate(event.endDate)}`}
                                            </span>
                                        </div>

                                        {/* Estadísticas */}
                                        <div className="send-cal__stats">
                                            <p>Con nota: <strong>{event.registeredCount} ({formatPct(event.registeredPercentage)})</strong></p>
                                            <p>Ausentes: <strong>{event.absentCount} ({formatPct(event.absentPercentage)})</strong></p>
                                            <p>Sin registrar: <strong>{event.pendingCount} ({formatPct(event.pendingPercentage)})</strong></p>
                                        </div>

                                        {/* Botón y estado */}
                                        <div className="send-cal__event-card__footer">
                                            {state === 'idle' && (
                                                <button
                                                    onClick={() => handleSendEmails(event.eventId, event.eventName)}
                                                    disabled={event.registeredCount === 0}
                                                    title={event.registeredCount === 0 ? 'No hay calificaciones registradas en este evento' : ''}
                                                >
                                                    Enviar calificaciones por email
                                                </button>
                                            )}
                                            {state === 'sending' && (
                                                <p className="send-cal__status send-cal__status--sending">
                                                    Envío de calificaciones: Enviando correos en segundo plano...
                                                </p>
                                            )}
                                            {state === 'sent' && (
                                                <p className="send-cal__status send-cal__status--sent">
                                                    Envío de calificaciones: El envío de correos fue iniciado correctamente. Los alumnos con email registrado recibirán su calificación en breve.
                                                </p>
                                            )}
                                            {state === 'error' && (
                                                <p className="send-cal__status send-cal__status--error">
                                                    Envío de calificaciones: Hubo un error al iniciar el envío. Por favor, intentá nuevamente.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </PageLayout>
    );
}

