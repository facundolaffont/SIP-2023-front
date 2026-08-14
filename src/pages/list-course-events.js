// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useHistory } from 'react-router-dom';
import toast from "react-hot-toast";

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import { Table } from "../components/Table.js";
import { LoadingState } from "../components/LoadingState.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";
import { ConfirmModal } from "../components/ConfirmModal.js";

// Estilos.
import '../styles/list-course-events.css';

export const ListCourseEvents = () => {

    // #region ==== Definición de estados. ====

    const { getAccessTokenSilently } = useAuth0();

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [eventsList, setEventsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para la edición en línea "The React Way"
    const [editingEventId, setEditingEventId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        initialDateTime: "",
        endDateTime: "",
        mandatory: false
    });

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

    // Estado para controlar el modal de forma centralizada
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmType: "danger",
        onConfirm: () => { }
    });
    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));


    // #endregion ==== Definición de estados. ====

    // #region ==== Definición de useEffect. ====

    // Inicializa el objeto que manipula las planillas.
    useState(() => {
        setSpreadsheetManipulator(new SpreadsheetManipulator());
    }, []);

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una.
    useEffect(() => {
        if (!course) history.push('/profile?course-missing');
    }, []);

    // Obtiene los eventos de la cursada seleccionada.
    useEffect(() => {
        const getCourseEvents = async () => {
            if (!course) return;

            try {
                const auth0Token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-all-events?course-id=${course.getId()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                );

                const sortedEvents = response.data.eventList.sort((a, b) => a.eventId - b.eventId); // Ordena los eventos por ID
                setEventsList(sortedEvents);
            } catch (error) {
                console.error('Error obteniendo eventos de cursada:', error);
                if (error.response) toast.error("Error al obtener la lista de eventos.");
            } finally {
                setLoading(false);
            }
        }
        getCourseEvents();
    }, [course]);

    // #endregion ==== Definición de useEffect. ====

    // #region ==== Definición de funciones. ====

    const updateEvent = async (eventId, newName, newInitialDate, newEndDate, newMandatory) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventId: eventId,
                    newName: newName,
                    newInitialDate: newInitialDate,
                    newEndDate: newEndDate,
                    newMandatory: newMandatory,
                }),
            });

            if (response.ok) {
                toast.success("El evento se ha actualizado exitosamente");
                // Actualizar el estado local
                setEventsList(prev => prev.map(event =>
                    event.eventId === eventId ? {
                        ...event,
                        name: newName,
                        initialDateTime: newInitialDate,
                        endDateTime: newEndDate,
                        mandatory: newMandatory
                    } : event
                ));
            } else {
                toast.error("Hubo un error al actualizar el evento");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión al actualizar.");
        }
    };

    const handleDetailButtonClick = (eventId) => {
        history.push(`/event-detail/${eventId}`);
    };

    const handleDeleteButtonClick = (eventId) => {
        setModalState({
            isOpen: true,
            title: "Eliminar evento",
            message: "¿Está seguro de que desea eliminar este evento? Esta acción no se puede deshacer",
            confirmType: "danger",
            onConfirm: async () => {
                closeModal();
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/delete-event`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ eventId: eventId }),
                    })
                    const data = await response.json();
                    if (data.success) {
                        setEventsList(eventsList.filter(event => event.eventId !== Number(eventId)));
                        toast.success("El evento se ha eliminado correctamente");
                    } else {
                        toast.error(data.message);
                    }
                } catch (error) {
                    console.error("Error en la petición de borrado:", error);
                    toast.error("Error al intentar borrar el evento")
                }
            }
        });
    };

    const formatForDatetimeLocal = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    function getHumanFormattedDateAndTime(date) {
        if (!date) return '-';
        const initialDate = Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(date));
        const initialTime = Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
        return `${initialDate}, ${initialTime}`;
    }

    const handleExport = () => {
        if (eventsList.length === 0) {
            toast.error("No hay datos para exportar.");
            return;
        }

        const headers = ["ID", "Tipo de evento", "Nombre de evento", "Fecha-Hora Inicio", "Fecha-Hora Fin", "Obligatorio"];
        const rows = eventsList.map(event => [
            event.eventId,
            event.type,
            event.name,
            getHumanFormattedDateAndTime(event.initialDateTime),
            getHumanFormattedDateAndTime(event.endDateTime),
            event.mandatory ? 'x' : ''
        ]);
        const sheetContent = [headers, ...rows];

        const subjectCode = course.getSubjectCode();
        const commission = course.getCommission();
        const year = course.getYear();

        spreadsheetManipulator.create(
            `Eventos - ${subjectCode} C${commission} ${year}`,
            `eventos-cursada`,
            sheetContent
        );
    }

    // #endregion ==== Definición de funciones. ====

    // #region ==== Funciones de Edición ====
    const handleEditClick = (event) => {
        setEditingEventId(event.eventId);
        setEditFormData({
            name: event.name || "",
            initialDateTime: event.initialDateTime ? formatForDatetimeLocal(event.initialDateTime) : "",
            endDateTime: event.endDateTime ? formatForDatetimeLocal(event.endDateTime) : "",
            mandatory: event.mandatory || false
        });
    };

    const handleCancelEdit = () => {
        setEditingEventId(null);
    };

    const handleSaveEdit = (event) => {
        // Validaciones
        if (!editFormData.name || editFormData.name.trim() === '') {
            toast.error("El nombre del evento es obligatorio.");
            return;
        }
        if (!editFormData.initialDateTime) {
            toast.error("La fecha y hora de inicio es obligatoria.");
            return;
        }
        if (!editFormData.endDateTime) {
            toast.error("La fecha y hora de fin es obligatoria.");
            return;
        }

        const newInitialDate = new Date(editFormData.initialDateTime).toISOString();
        const newEndDate = new Date(editFormData.endDateTime).toISOString();

        if (new Date(newInitialDate) > new Date(newEndDate)) {
            toast.error("La fecha de inicio del evento no puede ser mayor que la fecha de fin.");
            return;
        }

        setModalState({
            isOpen: true,
            title: "Modificar evento",
            message: `¿Está seguro de que desea modificar el evento con ID ${event.eventId}?`,
            confirmType: "primary",
            onConfirm: () => {
                closeModal();
                updateEvent(
                    event.eventId,
                    editFormData.name,
                    newInitialDate,
                    newEndDate,
                    editFormData.mandatory
                );
                setEditingEventId(null);
            }
        });
    };
    // #endregion

    const columns = [
        { header: 'ID', accessor: 'eventId', sortable: true, filterable: true, align: 'center' },
        { header: 'Tipo de evento', accessor: 'type', sortable: false, filterable: true, align: 'left' },
        {
            header: 'Nombre de evento',
            accessor: 'name',
            filterable: true,
            align: 'left',
            render: (row) => (
                editingEventId === row.eventId ? (
                    <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                ) : row.name
            )
        },
        {
            header: 'Fecha-Hora Inicio',
            accessor: 'initialDateTime',
            align: 'left',
            render: (row) => (
                editingEventId === row.eventId ? (
                    <input
                        type="datetime-local"
                        value={editFormData.initialDateTime}
                        onChange={(e) => setEditFormData({ ...editFormData, initialDateTime: e.target.value })}
                    />
                ) : getHumanFormattedDateAndTime(row.initialDateTime)
            )
        },
        {
            header: 'Fecha-Hora Fin',
            accessor: 'endDateTime',
            align: 'left',
            render: (row) => (
                editingEventId === row.eventId ? (
                    <input
                        type="datetime-local"
                        value={editFormData.endDateTime}
                        onChange={(e) => setEditFormData({ ...editFormData, endDateTime: e.target.value })}
                    />
                ) : getHumanFormattedDateAndTime(row.endDateTime)
            )
        },
        {
            header: 'Obligatorio',
            accessor: 'mandatory',
            align: 'center',
            render: (row) => (
                editingEventId === row.eventId ? (
                    <input
                        type="checkbox"
                        checked={editFormData.mandatory}
                        onChange={(e) => setEditFormData({ ...editFormData, mandatory: e.target.checked })}
                    />
                ) : (row.mandatory ? 'x' : '')
            )
        },
        {
            header: 'Acciones',
            accessor: 'actions',
            align: 'center',
            render: (row) => (
                <div className="actions-container">
                    {editingEventId === row.eventId ? (
                        <>
                            <button className="edit-button" onClick={() => handleSaveEdit(row)}>Confirmar</button>
                            <button className="delete-button" onClick={handleCancelEdit}>Cancelar</button>
                        </>
                    ) : (
                        <>
                            <button className="detail-button" onClick={() => handleDetailButtonClick(row.eventId)} disabled={editingEventId !== null}>🔍</button>
                            <button className="edit-button" onClick={() => handleEditClick(row)} disabled={editingEventId !== null}>Modificar</button>
                            <button className="delete-button" onClick={() => handleDeleteButtonClick(row.eventId)} disabled={editingEventId !== null}>Eliminar</button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Listar eventos
            </h1>
            <h2 className="selected-course-info">
                {
                    course !== null && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`
                }
                {
                    course === null && 'Sin cursada seleccionada'
                }
            </h2>
            <ConfirmModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmType={modalState.confirmType}
                onConfirm={modalState.onConfirm}
                onCancel={closeModal}
            />

            {loading ? (
                <LoadingState message="Cargando eventos, por favor espere..." />
            ) : (
                <div>
                    <Table columns={columns} data={eventsList} />
                    {eventsList && eventsList.length > 0 && (
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
