// Componentes externos.
import { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import DynamicTable from "../components/dynamic-table";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";

// Estilos.
import '../styles/search-event.css';

export const SearchEvent = () => {

    // #region ==== Definición de refs. ====

    // Se utiliza para manipular la hoja de cálculo.
    const spreadsheetManipulator = useRef(new SpreadsheetManipulator());
    
    // #endregion ==== Definición de refs. ====

    // #region ==== Definición de estados. ====
    
    const { getAccessTokenSilently } = useAuth0();

    const [eventId, setEventId] = useState("");
    const [eventInfo, setEventInfo] = useState(null);
    const [eventTitle, setEventTitle] = useState("");
    const [tableColumns, setTableColumns] = useState([]);
    const [tableData, setTableData] = useState([]);

    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();
    
    // #endregion ==== Definición de estados. ====

    // #region ==== Definición de useEffect. ====
    
    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => { // Redirige a la página de selección de cursada.

        if (!course) history.push('/profile?course-missing');

    }, []);

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
     * Maneja el evento clic en el botón de buscar y el evento de
     * la tecla Enter en el campo de texto del ID del registro de evento.
     * 
     * @param {Event} event - Tipo de evento.
     * @returns {void}
     * @throws {Error} Si ocurre un error al obtener la información del evento.
     */
    const handleSearch = (event) => { 

        // Evita que se recargue la página.
        event.preventDefault();

        // #region ==== Realiza la solicitud de obtención
        // de información del evento al backend. ====
        
        const getEventInfo = async () => {

            // Obtiene el token Auth0.
            const auth0Token = await getAccessTokenSilently()
            .catch(error => {
                throw error;
            });

            // Realiza la petición al backend.
            const eventInfoResponse = await axios.get(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-event-info?event-id=${eventId}`, 
                {
                    headers: {
                        Authorization: `Bearer ${auth0Token}`,
                    },
                }
            )
            .catch(error => { 
                
                // Obtiene el código y el mensaje de error que se va a mostrar.
                let errorCode;
                let errorDescription;
                if(error.response.data.errorCode === 1) {
                    errorCode = error.response.data.errorCode;
                    errorDescription = error.response.data.errorDescription;
                } else {
                    errorCode = error.code;
                    errorDescription = error.message;
                }

                // Notifica al usuario.
                alert(
                    `Código de error ${errorCode}
                    \nMensaje de error: ${errorDescription}`
                );

                // Registra el error en el log.
                console.error(
                    `Código de error ${errorCode}
                    \nMensaje de error: ${errorDescription}`
                );

                return null;

            });

            // Si hubo un error de red o si el código HTTP de la respuesta no es 2XX, termina
            // la ejecución de la función.
            if (eventInfoResponse === null) return;

            // #region ==== Adecúa los valores de asistencia y nota, de forma tal que:
            // - Si el evento es una clase, la asistencia será "Sí" o "No".
            // - Si el evento es una nota y la asistencia es false, la nota será "AUSENTE". ====
            
            // Por cada registro de evento...
            eventInfoResponse.data.eventRegistersList.forEach((eventRegister) => {

                // Si el evento es una clase, la asistencia será "Sí" o "No", y
                // se eliminará el campo de nota.
                if (eventInfoResponse.data.eventInfo.eventTypeId === 1) {
                    eventRegister.attendance =
                        eventRegister.attendance
                        ? "Sí"
                        : "No";
                    delete eventRegister.note;
                }
                
                // Si el evento es una nota y el alumno estuvo ausente, la asistencia será "AUSENTE";
                // si no, se dejará el valor de la nota. De todas formas, se eliminará el campo
                // de asistencia.
                else {
                    if (!eventRegister.attendance) eventRegister.note = "AUSENTE";
                    delete eventRegister.attendance;
                }

            });
            
            // #endregion ==== Adecúa los valores de asistencia y nota, de forma tal que:
            // - Si el evento es una clase, la asistencia será "Sí" o "No".
            // - Si el evento es una nota y la asistencia es false, la nota será "AUSENTE". ====

            setEventInfo(eventInfoResponse.data);

        }
        getEventInfo();
        
        // #endregion ==== Realiza la solicitud de obtención
        // de información del evento al backend. ====

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
                alert('El legajo tiene registrada la condición final. No se puede modificar el registro de evento.');
                return false;
            }

            // // Actualiza según tipo de evento
            // const newValue = modifiedRow.values.find(
            //     value => value.id === (eventInfo.eventInfo.eventTypeId === 1 ? 'attendance' : 'note')
            // ).value;

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

            alert("El registro de evento se ha actualizado exitosamente.");
            return true;

        } catch (error) {
            alert(`Código de error ${error.response?.data?.errorCode || error.code}\n${error.response?.data?.errorDescription || error.message}`);
            console.error(error);
            return false;
        }
    }

    // Manejador para la eliminación de filas.
    const handleDelete = async (rowData) => {
        try {
            const response = await checkIfEventRegisterDossierHasFinalCondition(rowData.id);
            if (response.data === true) {
                alert('El legajo tiene registrada la condición final. No se puede eliminar el registro de evento.');
                return false;
            }

            if (!window.confirm("¿Estás seguro de eliminar este registro de evento?")) {
                return false;
            }

            await deleteEventRegister(rowData.id);
            
            setEventInfo({
                ...eventInfo,
                eventRegistersList: eventInfo.eventRegistersList.filter(
                    register => register.eventRegisterId !== rowData.id
                )
            });

            alert("El registro de evento fue eliminado exitosamente.");

        } catch (error) {
            alert(`Código de error ${error.response.data.errorCode}\n${error.response.data.errorDescription}`);
            console.error(error);
        }
    };

    // #endregion ==== Definición de funciones. ====

    return (
        <PageLayout>
            <h1 id="page-title" className="content__title">
                Consultar evento
            </h1>
            <div>
                <input
                    id="event-id-input"
                    type="text"
                    placeholder="Ingrese el ID del evento."
                    value={eventId}
                    onChange={event => setEventId(event.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch(e);
                        }
                    }}
                />
                <button className="event-search-button" onClick={handleSearch}>Buscar</button>
            </div>
            {eventInfo && eventInfo.eventRegistersList.length > 0 && (
                <DynamicTable
                    tableTitle={eventTitle}
                    columnHeaders={tableColumns}
                    tableData={tableData}
                    handleEditCallback={handleRowEdit}
                    handleDeleteCallback={handleDelete}
                    handleExportCallback={handleExport}
                />
            )}
        </PageLayout>
    );
};
