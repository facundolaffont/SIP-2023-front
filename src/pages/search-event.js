// Componentes externos.
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';
import ReactDOMServer from 'react-dom/server';

// Componentes internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import HTMLTableManipulator from "../services/html-table-manipulator";

// Estilos.
import '../styles/search-event.css';

export const SearchEvent = () => {

    // #region ==== Definición de estados. ====
    
    const { getAccessTokenSilently } = useAuth0();

    const [eventId, setEventId] = useState("");
    const [eventInfo, setEventInfo] = useState(null);
    const [eventTitle, setEventTitle] = useState("");

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

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

    useState(() => { // Inicializa el objeto que manipula las planillas.

        setSpreadsheetManipulator(new SpreadsheetManipulator());

    }, []);

    useEffect(() => { // Muestra y actualiza la tabla.

        // Evita la ejecución si todavía no hay información de evento.
        if (eventInfo === null) return;

        // Genera y establece el título del evento.
        generateAndSetEventTitle(
            eventInfo.eventInfo.eventId,
            eventInfo.eventInfo.eventName,
            eventInfo.eventInfo.initialDatetime,
            eventInfo.eventInfo.endDatetime,
            eventInfo.eventInfo.eventTypeName,
            eventInfo.eventInfo.obligatory,
        );
        
        // #region ==== Define los cambios en la tabla, según
        // la información de los registros del evento. ====
        
        // Obtiene el manejador del contenedor de la tabla.
        let tableContainer = document.getElementsByClassName(
            "table-container"
        )[0];

        // Si hay registros de evento...
        if (eventInfo.eventRegistersList.length !== 0) {
            
            // #region ==== Renderiza el div, de clase "actions-container", y su contenido, que
            // previamente se añadió como una propiedad más en cada objeto que representa un evento. ====
            
            const eventsWithActionsAsString = eventInfo.eventRegistersList.map(event => {
                return {
                    ...event,
                    actions: ReactDOMServer.renderToString(event.actions)
                };
            });
            
            // #endregion ==== Renderiza el div, de clase "actions-container", y su contenido, que
            // previamente se añadió como una propiedad más en cada objeto que representa un evento. ====

            // Obtiene el manejador de la tabla.
            let table = document.getElementsByClassName(
                "table"
            )[0];

            // Inserta los datos en la tabla.
            HTMLTableManipulator.insertDataIntoTable(
                table,
                {
                    tableRows: eventsWithActionsAsString,
                    columnNames: [
                        "eventRegisterId:ID",
                        "studentDossier:Legajo",
                        "studentId:DNI",
                        "studentName:Nombre",
                        eventInfo.eventInfo.eventTypeId === 1 // Es una clase.
                            ? "attendance:Asistió"
                            : "note:Nota",
                        "actions:Acciones",
                    ],
                },
            );

            // Muestra la tabla.
            tableContainer.classList.remove("not-displayed");
        
        } else tableContainer.classList.add("not-displayed"); // Esconde la tabla.
        
        // #endregion ==== Define los cambios en la tabla, según
        // la información de los registros del evento. ====
        
    }, [eventInfo]);

    useEffect(() => { // Agrega manejador para el evento clic del botón "Modificar".

        // Evita la ejecución si todavía no hay información de evento.
        if (eventInfo === null) return;
    
        // Agrega un manejador para el evento clic de cada botón
        // de modificación de la tabla de eventos.
        let eventsTable = document.getElementsByClassName("table")[0];
        eventsTable.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditButtonClick);
        });
    
        // Agrega una función de limpieza para evitar que el manejador de eventos
        // se agregue más de una vez, debido a la naturaleza del ciclo de vida del
        // useEffect.
        return () => {
            eventsTable.querySelectorAll('.edit-button').forEach(button => {
                button.removeEventListener('click', handleEditButtonClick);
            });
        };

    }, [eventInfo]);
    
    useEffect(() => { // Agrega manejador para el evento clic del botón "Eliminar".

        // Evita la ejecución si todavía no hay información de evento.
        if (eventInfo === null) return;

        // Agrega manejador del evento clic a cada botón de eliminar.
        let eventsTable = document.getElementsByClassName("table")[0];
        eventsTable.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteButtonClick);
        });

        // Función de limpieza: evita que el listener se agregue más de una vez y que, 
        // por ende, se generen múltiples eventos al hacer clic en el botón.
        return () => {
            eventsTable.querySelectorAll('.delete-button').forEach(button => {
                button.removeEventListener('click', handleDeleteButtonClick);
            });
        };

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
     * Manejador del evento clic en el botón de modificar.
     * 
     * Habilita la edición de las correspondientes celdas, quitando los botones
     * de modificación y eliminación, y agregando botones de confirmación y cancelación,
     * agregando los correspondientes manejadores a estos últimos dos botones.
     * 
     * Si se presiona el botón de confirmación, se actualiza el evento, siempre que haya
     * habido alguna modificación, y se muestan los nuevos valores en la tabla. También
     * se vuelven a mostrar los botones de modificación y eliminación.
     * 
     * Si se presiona el botón de cancelación, se restauran los valores originales de las
     * celdas editables y se deshabilita la edición, volviendo a aparecer los botones de
     * edición y eliminación.
     * 
     * @param {*} event Objeto que representa al evento clic.
     */
    const handleEditButtonClick = async (event) => {

        // Obtiene la fila de la tabla que contiene el botón "Modificar" que fue presionado.
        const row = event.target.closest('tr');

        // Obtiene todas las celdas de la fila.
        const cells = row.querySelectorAll('td');
        
        // Obtiene el valor de la celda editable.
        const eventRegisterTdElement = cells[4];
        const oldEventRegisterValue = eventRegisterTdElement.textContent;

        // Obtiene el ID del registro de evento.
        const eventRegisterIdTdElement = cells[0];
        const eventRegisterId = eventRegisterIdTdElement.textContent;

        // #region ==== Consulta al backend si el registro de evento a modificar tiene registrada la condición final.
        // Si la tiene, notifica al usuario que no se puede modificar el registro de evento.
        // Si sucedió algún error durante la solicitud de la información al backend, notifica al usuario. ====
        
        try {

            // Realiza la consulta al backend.
            const response = await checkIfEventRegisterDossierHasFinalCondition(eventRegisterId)

            // Si el legajo tiene registrada la condición final, notifica al usuario que no se puede
            // modificar el registro de evento.
            if (response.data === true) {
                alert(`El legajo tiene registrada la condición final. No se puede modificar el registro de evento.`);
                return;
            }

        // Si hubo un error de red o si el código HTTP de la respuesta no es 2XX,
        // notifica al usuario y retorna la función.
        } catch(error) {
                
            // Notifica al usuario.
            alert(
                `Código de error ${error.response.data.errorCode}
                \n${error.response.data.errorDescription}`
            );

            // Registra el error en el log.
            console.error(`Código de error: ${error.response.data.errorCode}
                \nMensaje de error: ${error.response.data.errorDescription}`
            );

            return;

        }
        
        // #endregion ==== Consulta al backend si el registro de evento a modificar tiene registrada la condición final.
        // Si la tiene, notifica al usuario que no se puede modificar el registro de evento.
        // Si sucedió algún error durante la solicitud de la información al backend, notifica al usuario. ==== 

        // #region ==== Crea un elemento interactuable que permite seleccionar
        // el valor desde una lista desplegable. ====
        
        // Crea una lista desplegable de opciones con los valores que se pueden elegir.
        const selectElement = document.createElement('select');
        const options = 
            eventInfo.eventInfo.eventTypeId === 1
            ? ['Sí', 'No']
            : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'A-', 'D', 'AUSENTE'];

        // Agrega cada opción al datalist.
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;

            // Si el valor de la opción coincide con el valor de la celda editable,
            // se selecciona la opción.
            if (optionValue === oldEventRegisterValue) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        });

        // Reemplaza el contenido de la celda editable por el elemento select.
        eventRegisterTdElement.innerHTML = '';
        eventRegisterTdElement.appendChild(selectElement);
        
        // #endregion ==== Crea un elemento interactuable que permite seleccionar
        // el valor desde una lista desplegable. ====

        // #region ==== Quita los botones de modificación y eliminación y agrega los botones de confirmación y cancelación. ====

        // Limpia el contenido de la celda de acciones.
        const actionsCell = row.querySelector('.actions-container');
        actionsCell.textContent = '';

        // Deshabilita los botones del resto de las filas.
        const buttons = document.querySelectorAll('.actions-container button');
        buttons.forEach(button => {
            button.classList.add('disabled');
            button.disabled = true;
        });

        // Agrega el botón de confirmación.
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirmar';
        confirmButton.addEventListener('click', (event) => handleConfirmButtonClick(event, oldEventRegisterValue));
        actionsCell.appendChild(confirmButton);
        
        // Agrega el botón de cancelación.
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.addEventListener('click', (event) => handleCancelButtonClick(event, oldEventRegisterValue));
        actionsCell.appendChild(cancelButton);
        
        // #endregion ==== Quita los botones de modificación y eliminación y agrega los botones de confirmación y cancelación. ====

    };

    /**
     * Manejador del evento clic en el botón de confirmación, el cual aparece cuando se presiona
     * el botón de modificación.
     * 
     * @param {*} event Objeto que representa al evento clic.
     * @param {*} oldEventRegisterValue Valor viejo del registro de evento. 
     */
    const handleConfirmButtonClick = async (event, oldEventRegisterValue) => {

        // Obtiene el ID del registro de evento.
        const cells = event.target.closest('tr').querySelectorAll('td');
        const eventRegisterIdTdElement = cells[0];
        const eventRegisterIdTdContent = eventRegisterIdTdElement.textContent;

        // Obtiene el valor de la celda editable.
        const selectElement = cells[4].firstElementChild;
        let newEventRegisterValue = selectElement.value;

        // Obtiene el valor de la celda editable.
        const eventRegisterTdElement = cells[4];
        
        // Si no hubo modificación en el valor de la celda, en comparación con el valor anterior, 
        // se notifica al usuario y se retorna la función.
        if (oldEventRegisterValue === newEventRegisterValue) {
            alert('No se realizaron cambios en el registro. Realice un cambio o cancele la edición.');
            return;
        }

        try {

            // Si se trata de una clase, envía solicitud de actualización de asistencia.
            if (eventInfo.eventInfo.eventTypeId === 1 /* Clase */)
                await updateEventRegisterAttendance(
                    Number(eventRegisterIdTdContent),
                    newEventRegisterValue === 'Sí' ? true : false,
                );
            
            // Si se trata de una nota, envía solicitud de actualización de nota.
            else
                await updateEventRegisterNote(
                    Number(eventRegisterIdTdContent),
                    newEventRegisterValue,
                );

            // Notifica al usuario que se pudo actualizar el registro de evento.
            alert("El registro de evento se ha actualizado exitosamente.");

            // Actualiza el estado de los registros de evento, para que se refleje
            // en la tabla.
            setEventInfo({
                eventInfo: eventInfo.eventInfo,
                eventRegistersList: eventInfo.eventRegistersList.map(
                    (eventRegister) =>
                        eventRegister.eventRegisterId === Number(eventRegisterIdTdContent)
                            ? {
                                    ...eventRegister,
                                    [eventInfo.eventInfo.eventTypeId === 1
                                        ? "attendance"
                                        : "note"]: newEventRegisterValue,
                                }
                            : eventRegister
                ),
            });

        // Si hubo un error de red o si el código HTTP de la respuesta no es 2XX,
        // notifica al usuario.
        } catch (error) {
            
            // Notifica al usuario.
            alert(
                `Código de error ${error.response.data.errorCode}
                \n${error.response.data.errorDescription}`
            );

            // Registra el error en el log.
            console.error(`Código de error: ${error.response.data.errorCode}
                \nMensaje de error: ${error.response.data.errorDescription}`
            );

            // Establece el valor viejo en la celda editable.
            eventRegisterTdElement.innerHTML = oldEventRegisterValue;

        } finally {

            // #region ==== Quita los botones de confirmación y cancelación y vuelve a crear
            // los botones de modificación y eliminación. ====
        
            // Limpia la celda de acciones.
            const actionsCell = event.target.closest('tr').querySelector('.actions-container');
            actionsCell.textContent = '';

            // Habilita los botones del resto de las filas.
            const buttons = document.querySelectorAll('.actions-container button');
            buttons.forEach(button => {
                button.classList.remove('disabled');
                button.disabled = false;
            });

            // Crea el botón de modificación.
            const modifyButton = document.createElement('button');
            modifyButton.textContent = 'Modificar';
            modifyButton.className = 'edit-button';
            modifyButton.addEventListener('click', handleEditButtonClick);
            actionsCell.appendChild(modifyButton);

            // Crea el botón de eliminación.
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.className = 'delete-button';
            deleteButton.addEventListener('click', handleDeleteButtonClick); 
            actionsCell.appendChild(deleteButton);
            
            // #endregion ==== Quita los botones de confirmación y cancelación y vuelve a crear
            // los botones de modificación y eliminación. ====

        }

    }

    /**
     * Manejador del evento clic en el botón de cancelación, el cual aparece cuando se presiona
     * el botón de modificación.
     * 
     * @param {*} event Objeto que representa al evento clic.
     * @param {*} oldEventRegisterValue Valor viejo del registro de evento.
     */
    const handleCancelButtonClick = (event, oldEventRegisterValue) => {
        
        // Restaura el valor original de la celda editable y deshabilita su edición.
        const eventRegisterTdElement = event.target.closest('tr').querySelectorAll('td')[4];
        eventRegisterTdElement.textContent = oldEventRegisterValue;

        // #region ==== Quita los botones de confirmación y cancelación y vuelve a crear
        // los botones de modificación y eliminación. ====

        // Limpia la celda de acciones.
        const actionsCell = event.target.closest('tr').querySelector('.actions-container');
        actionsCell.textContent = '';

        // Habilita los botones del resto de las filas.
        const buttons = document.querySelectorAll('.actions-container button');
        buttons.forEach(button => {
            button.classList.remove('disabled');
            button.disabled = false;
        });

        // Crea y configura el botón de modificación.
        const modifyButton = document.createElement('button');
        modifyButton.textContent = 'Modificar';
        modifyButton.className = 'edit-button';
        modifyButton.addEventListener('click', handleEditButtonClick);
        actionsCell.appendChild(modifyButton);

        // Crea y configura el botón de eliminación.
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Eliminar';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', handleDeleteButtonClick); 
        actionsCell.appendChild(deleteButton);
        
        // #endregion ==== Quita los botones de confirmación y cancelación y vuelve a crear
        // los botones de modificación y eliminación. ====
        
    }

    /**
     * Maneja el evento clic en el botón de eliminar.
     * 
     * @param {*} eventRegisterId ID del registro de evento a eliminar.
     */
    const handleDeleteButtonClick = (event) => {
        
        // Obtiene el ID del registro de evento a eliminar.
        const eventRegisterId = Number((event.target.closest('tr').querySelectorAll('td'))[0].textContent);

        // Consulta al backend si el registro de evento a eliminar tiene registrada la condición final.
        // Si la tiene, notifica al usuario que no se puede eliminar el registro de evento.
        // Si sucedió algún error durante la solicitud de la información al backend, notifica al usuario.
        checkIfEventRegisterDossierHasFinalCondition(eventRegisterId)
            .then((response) => {

                // Si el legajo tiene registrada la condición final, notifica al usuario que no se puede
                // eliminar el registro de evento.
                if (response.data === true) {
                    alert(
                        `El legajo tiene registrada la condición final. No se puede eliminar el registro de evento.`
                    );
                    return;
                }

                // Consulta al usuario si quiere eliminar el registro de evento, finalizando la función
                // si el usuario no lo desea.
                if (!window.confirm("¿Estás seguro de eliminar este registro de evento?")) return;

                // Envía la solicitud al backend para eliminar el registro de evento.
                deleteEventRegister(eventRegisterId)

                // Si se eliminó el registro de evento, notifica al usuario y actualiza la tabla.
                .then(() => {

                    // Actualiza el estado de los registros de evento, para que se refleje
                    // en la tabla.
                    setEventInfo({
                        eventInfo: eventInfo.eventInfo,
                        eventRegistersList: eventInfo.eventRegistersList.filter(
                            (eventRegister) => eventRegister.eventRegisterId !== eventRegisterId
                        ),
                    });

                    // Notifica al usuario que se pudo eliminar el registro de evento.
                    alert("El registro de evento fue eliminado exitosamente.");

                })

                // Si hubo un error de red o si el código HTTP de la respuesta no es 2XX,
                // notifica al usuario.
                .catch((error) => {

                    // Notifica al usuario.
                    alert(
                        `Código de error ${error.response.data.errorCode}
                        \n${error.response.data.errorDescription}`
                    );

                    // Registra el error en el log.
                    console.error(`Código de error: ${error.response.data.errorCode}
                        \nMensaje de error: ${error.response.data.errorDescription}`
                    );

                });

            })
            .catch((error) => {
                
                // Notifica al usuario.
                alert(
                    `Código de error ${error.response.data.errorCode}
                    \n${error.response.data.errorDescription}`
                );

                // Registra el error en el log.
                console.error(`Código de error: ${error.response.data.errorCode}
                    \nMensaje de error: ${error.response.data.errorDescription}`
                );

                return;

            });

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
    const generateAndSetEventTitle = (
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

        const eventDescription = 
                `ID ${eventId} - ${eventType} ${nameString}(${mandatoryString})${dateTimeString}`;

        // Establece el título del evento en el estado.
        setEventTitle(eventDescription);

    }

    /**
     * Maneja el evento de cambio en el campo de ID del evento.
     * 
     * @param {*} event Evento de cambio.
     * @returns {void}
     */
    const handleEventIdChange = (event) => {
        setEventId(event.target.value);
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

                // Si el evento es una clase, la asistencia será "Sí" o "No".
                if (eventInfoResponse.data.eventInfo.eventTypeId === 1)
                    eventRegister.attendance =
                        eventRegister.attendance
                        ? "Sí"
                        : "No";
                
                // Si el evento es una nota, la asistencia será "AUSENTE" o la nota.
                else if (!eventRegister.attendance) eventRegister.note = "AUSENTE";

            });
            
            // #endregion ==== Adecúa los valores de asistencia y nota, de forma tal que:
            // - Si el evento es una clase, la asistencia será "Sí" o "No".
            // - Si el evento es una nota y la asistencia es false, la nota será "AUSENTE". ====

            // Agrega el campo de acciones a cada registro.
            eventInfoResponse.data.eventRegistersList.forEach((eventRegister) => {
                eventRegister.actions = (
                    <div className="actions-container">
                        <button className="edit-button">Modificar</button>
                        <button className="delete-button">Eliminar</button>
                    </div>
                );
            });

            // Muestra la lista recibida por tabla.
            setEventInfo(eventInfoResponse.data);

        }
        getEventInfo();
        
        // #endregion ==== Realiza la solicitud de obtención
        // de información del evento al backend. ====

    }

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {
        spreadsheetManipulator.export(
            document.getElementById("table"),
            "Detalle de evento",
            "detalle-evento"
        );
    }
    
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
                    onChange={handleEventIdChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch(e);
                        }
                    }}
                />
                <button className="event-search-button" onClick={handleSearch}>Buscar</button>
            </div>
            <h2 className="event-title">{eventTitle}</h2>
            <div id="table" className="table-container not-displayed">
                <table className="table"></table>
                <button
                    type="button"
                    className="export-button"
                    onClick={handleExport}
                >
                    Exportar a Excel
                </button>
            </div>
        </PageLayout>
    );
};
