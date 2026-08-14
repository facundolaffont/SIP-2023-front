// Componentes externos.
import { useEffect, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import toast from "react-hot-toast";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { Table } from "../components/Table";
import { LoadingState } from "../components/LoadingState";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { ConfirmModal } from "../components/ConfirmModal.js";

// Estilos.
import '../styles/search-event.css';

const ERROR_MESSAGES = {
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar la información del evento."
};  

export const EventDetail = () => {

    // #region ==== Definición de refs. ====
    const spreadsheetManipulator = useRef(new SpreadsheetManipulator());
    const tableContainerRef = useRef(null);
    // #endregion ==== Definición de refs. ====

    // #region ==== Definición de estados. ====
    const { getAccessTokenSilently } = useAuth0();

    const [eventInfo, setEventInfo] = useState(null);
    const [eventTitle, setEventTitle] = useState("");

    // Estados para edición en línea
    const [editingRowId, setEditingRowId] = useState(null);
    const [editValue, setEditValue] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalState, setModalState] = useState({
        isOpen: false, title: "", message: "", confirmType: "danger", confirmText: "Aceptar", onConfirm: () => {}
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();
    const { eventId } = useParams();
    // #endregion ==== Definición de estados. ====

    // #region ==== Definición de useEffect. ====
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    // Búsqueda automáticamente con el eventId obtenido de la URL.
    useEffect(() => {
        if (!course) return;
        const getEventInfo = async () => {
            setLoading(true);
            setError(null);
            try {
                const auth0Token = await getAccessTokenSilently();
                const eventInfoResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-event-info?event-id=${eventId}`, 
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                });
                const data = eventInfoResponse.data;
                // Adecúa los valores de asistencia y nota 
                data.eventRegistersList.forEach((eventRegister) => {
                    if (data.eventInfo.eventTypeId === 1) {
                        eventRegister.attendanceStr = eventRegister.attendance ? "Sí" : "No";
                    } else {
                        if (!eventRegister.attendance) eventRegister.note = "AUSENTE";
                    }
                });
                setEventInfo(data);
            } catch (err) {
                console.error("Error cargando evento:", err);
                const errorCode = err.response?.data?.errorCode;
                if (errorCode === 1) {
                    setError(`Error ${errorCode}: ${err.response.data.errorDescription}`);
                } else if (err.request) {
                    setError(ERROR_MESSAGES["NETWORK_ERROR"]);
                } else {
                    setError(ERROR_MESSAGES["DEFAULT"]);
                }
            } finally {
                setLoading(false);
            }
        }
        getEventInfo();
    }, [course, eventId, getAccessTokenSilently]);

    useEffect(() => {
        if (eventInfo) {
            generateEventTitle(
                eventInfo.eventInfo.eventId,
                eventInfo.eventInfo.eventName,
                eventInfo.eventInfo.initialDatetime,
                eventInfo.eventInfo.endDatetime,
                eventInfo.eventInfo.eventTypeName,
                eventInfo.eventInfo.obligatory,
            );
        }
    }, [eventInfo]);
    // #endregion ==== Definición de useEffect. ====
    
    // #region ==== Definición de funciones. ====
    const checkIfEventRegisterDossierHasFinalCondition = async (eventRegisterId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/check-event-register-final-condition?event-register-id=${eventRegisterId}`,
                { headers: { "Content-Type": "application/json" } }
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    const updateEventRegisterAttendance = async (eventRegisterId, newAttendanceValue) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event-register-attendance`,
                { studentCourseEventRegisterId: eventRegisterId, newAttendanceValue: newAttendanceValue },
                { headers: { "Content-Type": "application/json" } }
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    const updateEventRegisterNote = async (eventRegisterId, newNoteValue) => { 
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event-register-note`,
                { studentCourseEventRegisterId: eventRegisterId, newNoteValue: newNoteValue },
                { headers: { "Content-Type": "application/json" } }
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    const deleteEventRegister = async (eventRegisterId) => { 
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/delete-event-register`,
                { eventRegisterId: eventRegisterId },
                { headers: { "Content-Type": "application/json" } }
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    const generateEventTitle = (
        eventId,
        eventName,
        initialDateTime,
        endDateTime,
        eventType,
        mandatory,
    ) => {
        let nameString = eventName !== null ? `"${eventName}" ` : '';
        let dateTimeString = "";
        
        if (initialDateTime !== null && endDateTime !== null) {
            const formatOptsDate = { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' };
            const formatOptsTime = { hour: '2-digit', minute: '2-digit' };
            const initialDate = Intl.DateTimeFormat('es-AR', formatOptsDate).format(new Date(initialDateTime));
            const initialTime = Intl.DateTimeFormat('es-AR', formatOptsTime).format(new Date(initialDateTime));
            const endDate = Intl.DateTimeFormat('es-AR', formatOptsDate).format(new Date(endDateTime));
            const endTime = Intl.DateTimeFormat('es-AR', formatOptsTime).format(new Date(endDateTime));
            
            dateTimeString = initialDate === endDate
                ? `: ${initialDate} de ${initialTime} a ${endTime}`
                : `: ${initialDate} ${initialTime} - ${endDate} ${endTime}`;
        }
        
        let mandatoryString = mandatory ? 'obligatorio' : 'no obligatorio';
        setEventTitle(`ID ${eventId} - ${eventType} ${nameString}(${mandatoryString})${dateTimeString}`);
    }

    const handleExport = () => {
        if (!tableContainerRef.current) return;
        const htmlTable = tableContainerRef.current.querySelector('.react-data-table');
        if (htmlTable) {
            spreadsheetManipulator.current.export(
                htmlTable,
                "Detalle de evento",
                "detalle-evento",
                [],
                [1, 2, 3] // Configuración original de columnas para excluir
            );
        }
    }

    const startEditing = (row) => {
        setEditingRowId(row.eventRegisterId);
        setEditValue(eventInfo.eventInfo.eventTypeId === 1 ? row.attendanceStr : row.note);
    };

    const handleSaveEdit = async (row) => {
        try {
            const response = await checkIfEventRegisterDossierHasFinalCondition(row.eventRegisterId);
            if (response.data === true) {
                toast.error('El legajo tiene registrada la condición final. No se puede modificar el registro de evento.');
                return;
            }

            if (eventInfo.eventInfo.eventTypeId === 1) {
                await updateEventRegisterAttendance(row.eventRegisterId, editValue === 'Sí');
            } else {
                await updateEventRegisterNote(row.eventRegisterId, editValue);
            }

            setEventInfo({
                ...eventInfo,
                eventRegistersList: eventInfo.eventRegistersList.map(register =>
                    register.eventRegisterId === row.eventRegisterId
                        ? {
                            ...register,
                            attendanceStr: eventInfo.eventInfo.eventTypeId === 1 ? editValue : register.attendanceStr,
                            note: eventInfo.eventInfo.eventTypeId !== 1 ? editValue : register.note,
                        }
                        : register
                )
            });

            toast.success("El registro de evento se ha actualizado exitosamente");
            setEditingRowId(null);
        } catch (error) {
            toast.error(error.response?.data?.errorDescription || "Error al actualizar el registro");
            console.error(error);
        }
    }

    const handleDelete = async (row) => {
        try {
            const response = await checkIfEventRegisterDossierHasFinalCondition(row.eventRegisterId);
            if (response.data === true) {
                toast.error('El legajo tiene registrada la condición final. No se puede eliminar el registro de evento');
                return;
            }

            setModalState({
                isOpen: true,
                title: "Eliminar registro",
                message: "¿Estás seguro de que deseas eliminar este registro de evento?",
                confirmType: "danger",
                confirmText: "Eliminar",
                onConfirm: async () => {
                    closeModal();
                    try {
                        await deleteEventRegister(row.eventRegisterId);
                        setEventInfo(prev => ({
                            ...prev,
                            eventRegistersList: prev.eventRegistersList.filter(
                                register => register.eventRegisterId !== row.eventRegisterId
                            )
                        }));
                        toast.success("El registro fue eliminado exitosamente");
                    } catch (error) {
                        toast.error(error.response?.data?.errorDescription || "Error al eliminar el registro");
                        console.error(error);
                    }
                }
            });
        } catch (error) {
            toast.error("Error validando el registro");
            console.error(error);
        }
    };

    const isClassEvent = eventInfo?.eventInfo?.eventTypeId === 1;

    // Configuración de las columnas para Table
    const columns = [
        { header: 'ID', accessor: 'eventRegisterId', align: "center", sortable: true },
        { header: 'Legajo', accessor: 'studentDossier', align: "center", sortable: true, filterable: true },
        { header: 'DNI', accessor: 'studentId', align: "center", sortable: true, filterable: true },
        { header: 'Nombre', accessor: 'studentName', align: "left", sortable: true, filterable: true },
        {
            header: isClassEvent ? 'Asistió' : 'Nota',
            accessor: isClassEvent ? 'attendanceStr' : 'note',
            align: "center",
            sortFunction: (a, b) => {
                if (isClassEvent) {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                } else {
                    const notasNormalizadas = { 'AUSENTE': 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 'A': 11, 'A-': 12, 'D': 13 };
                    const valorA = notasNormalizadas[a];
                    const valorB = notasNormalizadas[b];
                    if (valorA < valorB) return -1;
                    if (valorA > valorB) return 1;
                    return 0;
                }
            },
            render: (row) => {
                if (editingRowId === row.eventRegisterId) {
                    const options = isClassEvent 
                        ? ['Sí', 'No'] 
                        : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'A-', 'D', 'AUSENTE'];
                    return (
                        <select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    );
                }
                return isClassEvent ? row.attendanceStr : row.note;
            }
        },
        {
            header: 'Acciones',
            accessor: 'actions',
            align: "center",
            className: "actions-column", 
            render: (row) => {
                if (editingRowId === row.eventRegisterId) {
                    return (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="edit-button" onClick={() => handleSaveEdit(row)}>Guardar</button>
                            <button className="delete-button" onClick={() => setEditingRowId(null)}>Cancelar</button>
                        </div>
                    );
                }
                return (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="edit-button" onClick={() => startEditing(row)} disabled={editingRowId !== null}>Editar</button>
                        <button className="delete-button" onClick={() => handleDelete(row)} disabled={editingRowId !== null}>Eliminar</button>
                    </div>
                );
            }
        }
    ];

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Detalle de evento
            </h1>

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
                <div className="msg-error" style={{textAlign: 'center', margin: '20px 0', fontSize: '20px'}}>
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingState message="Cargando detalle del evento, por favor espere..." />
            ) : (
                eventInfo && eventInfo.eventRegistersList && (
                    <div ref={tableContainerRef}>
                        <Table 
                            title={eventTitle}
                            columns={columns}
                            data={eventInfo.eventRegistersList}
                        />
                        {eventInfo.eventRegistersList.length > 0 && (
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
                )
            )}
        </PageLayout>
    );
};