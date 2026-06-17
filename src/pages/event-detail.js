// Componentes externos.
import { useEffect, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import toast from "react-hot-toast";

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import DynamicTable from "../components/dynamic-table";
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

    // Se utiliza para manipular la hoja de cálculo.
    const spreadsheetManipulator = useRef(new SpreadsheetManipulator());
    
    // #endregion ==== Definición de refs. ====

    // #region ==== Definición de estados. ====
    
    const { getAccessTokenSilently } = useAuth0();

    const [eventInfo, setEventInfo] = useState(null);
    const [eventTitle, setEventTitle] = useState("");
    const [tableColumns, setTableColumns] = useState([]);
    const [tableData, setTableData] = useState([]);

    // 
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
    
    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
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
                        eventRegister.attendance = eventRegister.attendance ? "Sí" : "No";
                        delete eventRegister.note;
                    } else {
                        if (!eventRegister.attendance) eventRegister.note = "AUSENTE";
                        delete eventRegister.attendance;
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


    useEffect(() => { // Genera los datos para la tabla.
        if (eventInfo) {
            // Genera el título de la tabla.
            generateEventTitle(
                eventInfo.eventInfo.eventId,
                eventInfo.eventInfo.eventName,
                eventInfo.eventInfo.initialDatetime,
                eventInfo.eventInfo.endDatetime,
                eventInfo.eventInfo.eventTypeName,
                eventInfo.eventInfo.obligatory,
            );
            // Genera los nombres de las columnas para la tabla dinámica.
            setTableColumns([
                { name: 'eventRegisterId', label: 'ID', align: "center", editable: false },
                { name: 'studentDossier', label: 'Legajo', align: "center", editable: false },
                { name: 'studentId', label: 'DNI', align: "center", editable: false },
                { name: 'studentName', label: 'Nombre', editable: false },
                {
                    name: eventInfo?.eventInfo.eventTypeId === 1 ? 'attendance' : 'note',
                    label: eventInfo?.eventInfo.eventTypeId === 1 ? 'Asistió' : 'Nota',
                    editable: true,
                    editOptions: eventInfo?.eventInfo.eventTypeId === 1 
                        ? ['Sí', 'No']
                        : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'A-', 'D', 'AUSENTE'],
                    align: "center",
                    sortFunction: (a, b) => {

                        // Si el evento es una clase, ordena por asistencia.
                        if (eventInfo.eventInfo.eventTypeId === 1) {
                            if (a < b) return -1;
                            if (a > b) return 1;
                            return 0;

                        // Si no, ordena por nota.
                        } else {

                            // Mapeo que servirá para normalizar las notas.
                            const notasNormalizadas = {
                                'AUSENTE': 0,
                                1: 1,
                                2: 2,
                                3: 3,
                                4: 4,
                                5: 5,
                                6: 6,
                                7: 7,
                                8: 8,
                                9: 9,
                                10: 10,
                                'A': 11,
                                'A-': 12,
                                'D': 13
                            };

                            // Compara las notas usando el mapeo.
                            const valorA = notasNormalizadas[a];
                            const valorB = notasNormalizadas[b];
                            if (valorA < valorB) return -1;
                            if (valorA > valorB) return 1;
                            return 0;

                        }

                    }
                },
            ]);

            // Genera los datos para la tabla dinámica.
            setTableData(
                eventInfo.eventRegistersList.map(eventRegister => ({
                    id: eventRegister.eventRegisterId,
                    values: [
                        { columnName: 'eventRegisterId', value: eventRegister.eventRegisterId },
                        { columnName: 'studentDossier', value: eventRegister.studentDossier },
                        { columnName: 'studentId', value: eventRegister.studentId },
                        { columnName: 'studentName', value: eventRegister.studentName },
                        { 
                            columnName: eventInfo.eventInfo.eventTypeId === 1 ? 'attendance' : 'note',
                            value: eventRegister.attendance || eventRegister.note},
                    ]
                }))
            );

        }
    }, [eventInfo]);

    // #endregion ==== Definición de useEffect. ====
    
    // #region ==== Definición de funciones. ====

    /**
     * Envía una solicitud al backend para verificar si el legajo tiene registrada la condición final.
     *  
     * @param {number} eventRegisterId ID del registro de evento.
     * @returns {object} El retorno de la consulta realizada por axios, envuelta en una Promise.
     */
    const checkIfEventRegisterDossierHasFinalCondition = async (eventRegisterId) => {

        try {

            // Envía la solicitud al backend.
            const response = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/check-event-register-final-condition?event-register-id=${eventRegisterId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Si el código HTTP devuelto es 2XX, devuelve la respuesta generada por axios,
            // envuelta en una Promise.
            return response;

        }

        catch (error) {

            // Si existió un problema de red o si el código HTTP de la respuesta no fue
            // exitoso (<> 2XX), devuelve el error generado por axios, envuelto en una Promise.
            throw error;

        }

    }

    /**
     * Envía una solicitud al backend para actualizar la asistencia de un registro de evento.
     * 
     * Si hubo un error de red, si el ID de registro de evento no existe, o si el legajo tiene registrada
     * la condición final, no se realiza la modificación.
     *  
     * @param {number} eventRegisterId ID del registro de evento.
     * @param {boolean} newAttendanceValue Nuevo valor de asistencia.
     * @returns {object} El retorno de la consulta realizada por axios, envuelta en una Promise.
     */
    const updateEventRegisterAttendance = async (eventRegisterId, newAttendanceValue) => {

        try {

            // Envía la solicitud al backend.
            const response = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event-register-attendance`,
                {
                    studentCourseEventRegisterId: eventRegisterId,
                    newAttendanceValue: newAttendanceValue,
                },
                {
                    headers: {
                    "Content-Type": "application/json",
                    },
                }
            );

            // Si el código HTTP devuelto es 2XX, devuelve la respuesta generada por axios,
            // envuelta en una Promise.
            return response;

        }
        
        // Si existió un problema de red o si el código HTTP de la respuesta no fue
        // exitoso (<> 2XX), devuelve el error generado por axios, envuelto en una Promise.
        catch (error) {

            throw error;

        }

    }

    /**
     * Envía una solicitud al backend para actualizar la nota de un registro de evento.
     * 
     * Si hubo un error de red, si el ID de registro de evento no existe, o si el legajo tiene registrada
     * la condición final, no se realiza la modificación.
     *  
     * @param {number} eventRegisterId ID del registro de evento.
     * @param {string} newNoteValue Nuevo valor de la nota.
     * @returns {object} El retorno de la consulta realizada por axios, envuelta en una Promise.
     */
    const updateEventRegisterNote = async (eventRegisterId, newNoteValue) => { 

        try {

            // Envía la solicitud al backend.
            const response = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event-register-note`,
                {
                    studentCourseEventRegisterId: eventRegisterId,
                    newNoteValue: newNoteValue,
                },
                {
                    headers: {
                    "Content-Type": "application/json",
                    },
                }
            );

            // Si el código HTTP devuelto es 2XX, devuelve la respuesta generada por axios,
            // envuelta en una Promise.
            return response;

        }
        
        // Si existió un problema de red o si el código HTTP de la respuesta no fue
        // exitoso (<> 2XX), devuelve el error generado por axios, envuelto en una Promise.
        catch (error) {

            throw error;

        }
    }

    /**
     * Envía una solicitud al backend para eliminar un registro de evento.
     * 
     * Si hubo un error de red, si el ID de registro de evento no existe, o si el legajo tiene registrada
     * la condición final, no se realiza la eliminación.
     *  
     * @param {number} eventRegisterId ID del registro de evento.
     * @returns {object} El retorno de la consulta realizada por axios, envuelta en una Promise.
     */
    const deleteEventRegister = async (eventRegisterId) => { 

        try {

            // Envía la solicitud al backend.
            const response = await axios.post(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/delete-event-register`,
                {
                    eventRegisterId: eventRegisterId,
                },
                {
                    headers: {
                    "Content-Type": "application/json",
                    },
                }
            );

            // Si el código HTTP devuelto es 2XX, devuelve la respuesta generada por axios,
            // envuelta en una Promise.
            return response;

        }
        
        // Si existió un problema de red o si el código HTTP de la respuesta no fue
        // exitoso (<> 2XX), devuelve el error generado por axios, envuelto en una Promise.
        catch (error) {

            throw error;

        }
    }

    /**
     * Genera y establece el título del evento.
     * 
     * @param {String} eventName Nombre del evento.
     * @param {String} initialDateTime Fecha de inicio del evento.
     * @param {String} endDateTime Fecha de finalización del evento.
     * @param {String} eventType Nombre del tipo de evento.
     * @param {Boolean} mandatory Si es obligatorio o no el evento.
     */
    const generateEventTitle = (
        eventId,
        eventName,
        initialDateTime,
        endDateTime,
        eventType,
        mandatory,
    ) => {

        // Contruye el string que contendrá el nombre del evento, solamente si se ingresó un nombre
        // al momento de dar de alta el evento.
        let nameString = '';
        if (eventName !== null)
            nameString = `"${eventName}" `;

        // Construye el string que contendrá el rango de fechas, solamente si ambas fechas
        // fueron ingresadas en la carga del evento; o será una cadena vacía, si alguna
        // de las fechas no fue ingresada.
        let dateTimeString = "";
        if (initialDateTime !== null && endDateTime !== null) {
            const initialDate =
                Intl.DateTimeFormat(
                    'es-AR',
                    {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                    }
                ).format(new Date(initialDateTime));
            const initialTime = 
                Intl.DateTimeFormat(
                    'es-AR',
                    {
                        hour: '2-digit',
                        minute: '2-digit',
                    }
                ).format(new Date(initialDateTime));
            const endDate =
                Intl.DateTimeFormat(
                    'es-AR',
                    {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                    }
                ).format(new Date(endDateTime));
            const endTime = 
                Intl.DateTimeFormat(
                    'es-AR',
                    {
                        hour: '2-digit',
                        minute: '2-digit',
                    }
                ).format(new Date(endDateTime));
            dateTimeString =
                initialDate.valueOf() === endDate.valueOf()
                ? `: ${initialDate} de ${initialTime} a ${endTime}`
                : `: ${initialDate} ${initialTime} - ${endDate} ${endTime}`;
        }
        
        // Construye el string que informará la obligatoriedad del evento.
        let mandatoryString;
        if (mandatory) mandatoryString = 'obligatorio'
        else mandatoryString = 'no obligatorio';

        // Genera el string que contendrá la descripción del evento.
        const eventDescription = 
                `ID ${eventId} - ${eventType} ${nameString}(${mandatoryString})${dateTimeString}`;

        // Establece el título del evento en el estado.
        setEventTitle(eventDescription);
    }

    /**
     * Maneja el evento clic en el botón de exportar.
     * 
     * @param {Event} event - Tipo de evento.
     * @param {HTMLTableElement} htmlTable - Tabla HTML que se exportará.
     */
    const handleExport = (event, htmlTable) => {
        spreadsheetManipulator.current.export(
            htmlTable,
            "Detalle de evento",
            "detalle-evento"
        );
    }

    // Manejador para la edición de filas.
    const handleRowEdit = async (modifiedRow) => {
        try {
            // Verifica condición final
            const response = await checkIfEventRegisterDossierHasFinalCondition(modifiedRow.id);
            if (response.data === true) {
                toast.error('El legajo tiene registrada la condición final. No se puede modificar el registro de evento');
                return false;
            }
            if (eventInfo.eventInfo.eventTypeId === 1) {
                await updateEventRegisterAttendance(
                    modifiedRow.id,
                    modifiedRow.values.find(value => value.columnName === "attendance").value === 'Sí'
                );
            } else {
                await updateEventRegisterNote(
                    modifiedRow.id,
                    modifiedRow.values.find(value => value.columnName === "note").value
                );
            }

            // Actualiza el estado con los nuevos valores
            setEventInfo({
                ...eventInfo,
                eventRegistersList: eventInfo.eventRegistersList.map(register =>
                    register.eventRegisterId === modifiedRow.id
                        ? {
                            ...register,
                            attendance:
                                eventInfo.eventInfo.eventTypeId === 1
                                ? modifiedRow.values.find(value => value.columnName === "attendance").value
                                : register.attendance,
                            note:
                                eventInfo.eventInfo.eventTypeId !== 1
                                ? modifiedRow.values.find(value => value.columnName === "note").value
                                : register.note,
                        }
                        : register
                )
            });

            toast.success("El registro de evento se ha actualizado exitosamente");
            return true;

        } catch (error) {
            toast.error(error.response?.data?.errorDescription || "Error al actualizar el registro");
            console.error(error);
            return false;
        }
    }

    // Manejador para la eliminación de filas.
    const handleDelete = async (rowData) => {
        try {
            const response = await checkIfEventRegisterDossierHasFinalCondition(rowData.id);
            if (response.data === true) {
                toast.error('El legajo tiene registrada la condición final. No se puede eliminar el registro de evento');
                return false;
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
                        await deleteEventRegister(rowData.id);
                        
                        setEventInfo(prev => ({
                            ...prev,
                            eventRegistersList: prev.eventRegistersList.filter(
                                register => register.eventRegisterId !== rowData.id
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

    // #endregion ==== Definición de funciones. ====

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
                <div className="modal-loading">
                    <div className="spinner"></div>
                    <p style={{fontSize: '20px'}}>Cargando detalle del evento...</p>
                </div>
            ) : (
                eventInfo && eventInfo.eventRegistersList.length > 0 && (
                    <DynamicTable
                        tableTitle={eventTitle}
                        columnHeaders={tableColumns}
                        tableData={tableData}
                        handleEditCallback={handleRowEdit}
                        handleDeleteCallback={handleDelete}
                        handleExportCallback={handleExport}
                    />
                )
            )}
        </PageLayout>
    );
};