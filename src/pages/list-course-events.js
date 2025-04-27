// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useHistory } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import HTMLTableManipulator from "../services/html-table-manipulator";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";

// Estilos.
import '../styles/list-course-events.css';

export const ListCourseEvents = () => {

    // #region ==== Definición de estados. ====
    
    const { getAccessTokenSilently } = useAuth0();

    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);

    const [eventsList, setEventsList] = useState([]);
    
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();
    
    // #endregion ==== Definición de estados. ====

    // #region ==== Definición de useEffect. ====
    
    // Inicializa el objeto que manipula las planillas.
    useState(() => {

        setSpreadsheetManipulator(new SpreadsheetManipulator());

    }, []);

    // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
    // o si se actualiza la página, ya que se pierde el contexto de la selección que
    // se había hecho.
    useEffect(() => {

        if (!course) history.push('/profile?course-missing');

    }, []);

    // Muestra y actualiza la tabla de eventos.
    useEffect(() => {

        // Obtiene el manejador de la tabla de eventos.
        let eventsTable = document.getElementsByClassName("events-table")[0];

        if (eventsList.length !== 0) {

            // Agrega el div de clase "actions-container" y de su contenido, como texto, como un
            // miembro más de cada objeto que representa un evento.
            const eventsWithActionsAsString = eventsList.map(event => {
                return {
                    ...event,
                    actions: ReactDOMServer.renderToString(event.actions)
                };
            });
    
            // Ingresa los datos de los eventos en la tabla.
            HTMLTableManipulator.insertDataIntoTable(
                eventsTable,
                {
                    tableRows: eventsWithActionsAsString,
                    columnNames: [
                        "eventId:ID",
                        "type:Tipo de evento",
                        "name:Nombre de evento",
                        "initialDateTime:Fecha-Hora Inicio",
                        "endDateTime: Fecha-Hora Fin",
                        "mandatory:Obligatorio",
                        "actions:Acciones"
                    ],
                }
            );
    
            // Muestra la tabla de eventos.
            eventsTable.classList.remove("not-displayed");

        } else eventsTable.classList.add("not-displayed");

    }, [eventsList]);
        
    // Agrega manejador para el evento clic del botón "Modificar".
    useEffect(() => {

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
         * @param {*} event Evento clic.
         */
        const handleEditButtonClick = (event) => {

            // Obtiene la fila de la tabla que contiene el botón "Modificar" que fue presionado.
            const row = event.target.closest('tr');

            // Obtiene todas las celdas de la fila.
            const cells = row.querySelectorAll('td');
   
            // #region ==== Obtiene los valores de las celdas y habilita su edición. ====
            
            const eventIdTdElement = cells[0];
            const eventIdContent = eventIdTdElement.textContent;
            
            const eventNameTdElement = cells[2];
            const oldEventNameContent = eventNameTdElement.textContent;
            eventNameTdElement.contentEditable = true;

            const initialDatetimeTdElement = cells[3];
            const oldInitialDatetimeContent = initialDatetimeTdElement.textContent;

            const endDatetimeTdElement = cells[4];
            const oldEndDatetimeContent = endDatetimeTdElement.textContent;

            const mandatoryTdElement = cells[5];
            const oldMandatoryContent = mandatoryTdElement.textContent;
            mandatoryTdElement.contentEditable = true;
            
            // #endregion ==== Obtiene los valores de las celdas y habilita su edición. ====

            // Crea un elemento interactuable que permite seleccionar la fecha de inicio
            // desde un calendario.
            const initialDateTimeInput = document.createElement('input');
            initialDateTimeInput.type = 'datetime-local';
            initialDatetimeTdElement.innerHTML = '';
            initialDatetimeTdElement.appendChild(initialDateTimeInput);

            // Crea un elemento interactuable que permite seleccionar la fecha de fin
            // desde un calendario.
            const endDateTimeInput = document.createElement('input');
            endDateTimeInput.type = 'datetime-local';
            endDatetimeTdElement.innerHTML = '';
            endDatetimeTdElement.appendChild(endDateTimeInput);

            // #region ==== Crea y configura el botón de confirmación. ====
            
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmar';
            confirmButton.addEventListener('click', () => {
                
                // Obtiene el ID de evento.
                const eventId = eventIdContent;

                // Obtiene los valores de las celdas editables.
                let newEventNameContent = eventNameTdElement.textContent;
                let newInitialDatetimeContent =
                    initialDateTimeInput.value !== ''
                    ? new Date(initialDateTimeInput.value).toISOString()
                    : null;
                let newEndDatetimeContent =
                    endDateTimeInput.value !== ''
                    ? new Date(endDateTimeInput.value).toISOString()
                    : null;
                let newMandatoryContent = mandatoryTdElement.textContent;

                // Si hubo alguna modificación en los valores de las celdas, se actualiza el evento.
                if (
                    oldEventNameContent !== newEventNameContent ||
                    oldInitialDatetimeContent !== newInitialDatetimeContent ||
                    oldEndDatetimeContent !== newEndDatetimeContent ||
                    oldMandatoryContent !== newMandatoryContent
                ) {

                    // #region ==== Si hubo cambio en las fechas y la fecha mínima es mayor que la fecha
                    // máxima, se muestra un mensaje de error al usuario. ====
                    
                    if (
                        oldInitialDatetimeContent !== newInitialDatetimeContent ||
                        oldEndDatetimeContent !== newEndDatetimeContent
                    ) {
                        if (
                            newInitialDatetimeContent !== null &&
                            newEndDatetimeContent !== null &&
                            new Date(newInitialDatetimeContent) > new Date(newEndDatetimeContent)
                        ) {
                            alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
                            return;
                        }
                    }
                    
                    // #endregion ==== Si hubo cambio en las fechas y la fecha mínima es mayor que la fecha
                    // máxima, se muestra un mensaje de error al usuario. ====

                    // #region ==== Si no hubo cambio en las fechas o si hubo, pero la fecha mínima es menor o igual
                    // que la fecha máxima, o alguna de las fechas es nula, se modifica el evento. ====

                    // Se deshabilita la edición de las celdas.
                    eventNameTdElement.contentEditable = false;
                    mandatoryTdElement.contentEditable = false;

                    // Establece, en las celdas de fecha, el valor equivalente en texto de la nueva fecha seleccionada.
                    initialDatetimeTdElement.textContent = 
                        newInitialDatetimeContent !== null
                        ? getHumanFormattedDateAndTime(newInitialDatetimeContent)
                        : '-';
                    endDatetimeTdElement.textContent = 
                        newEndDatetimeContent !== null
                        ? getHumanFormattedDateAndTime(newEndDatetimeContent)
                        : '-';
                    
                    // Llama al método que actualiza el evento.
                    updateEvent(
                        eventId,
                        newEventNameContent,
                        newInitialDatetimeContent,
                        newEndDatetimeContent,
                        newMandatoryContent === 'x' ? true : false,
                    );

                    // #region ==== Vuelve a crear los botones de modificación y eliminación. ====
                
                    // Obtiene el elemento HTML que debe contener los botones de modificación
                    // y eliminación de eventos.
                    const actionsCell = row.querySelector('.actions-container');
                    actionsCell.textContent = '';
        
                    // Crea y configura el botón de modificación.
                    const modifyButton = document.createElement('button');
                    modifyButton.textContent = 'Modificar';
                    modifyButton.className = 'edit-button';
                    modifyButton.addEventListener('click', handleEditButtonClick);
        
                    // Crea y configura el botón de eliminación.
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Eliminar';
                    deleteButton.className = 'delete-button';
                    deleteButton.addEventListener('click', handleDeleteButtonClick);
        
                    // Agrega los botones.
                    actionsCell.appendChild(modifyButton);
                    actionsCell.appendChild(deleteButton);
                    
                    // #endregion ==== Vuelve a crear los botones de modificación y eliminación. ====
                
                    // #endregion ==== Si no hubo cambio en las fechas o si hubo, pero la fecha mínima es menor o igual
                    // que la fecha máxima, se modifica el evento. ====

                }

            });
            
            // #endregion ==== Crea y configura el botón de confirmación. ====
                                                
            // #region ==== Crea y configura el botón de cancelación. ====
            
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancelar';
            cancelButton.addEventListener('click', () => {
                
                // Restaura los valores originales de las celdas editables y deshabilita su edición.
                eventNameTdElement.textContent = oldEventNameContent;
                initialDatetimeTdElement.textContent = oldInitialDatetimeContent;
                endDatetimeTdElement.textContent = oldEndDatetimeContent;
                mandatoryTdElement.textContent = oldMandatoryContent;
                eventNameTdElement.contentEditable = false;
                mandatoryTdElement.contentEditable = false;

                // #region ==== Vuelve a crear los botones de modificación y eliminación. ====
                
                // Obtiene el elemento HTML que debe contener los botones de modificación
                // y eliminación de eventos.
                const actionsCell = row.querySelector('.actions-container');
                actionsCell.textContent = '';
    
                // Crea y configura el botón de modificación.
                const modifyButton = document.createElement('button');
                modifyButton.textContent = 'Modificar';
                modifyButton.className = 'edit-button';
                modifyButton.addEventListener('click', handleEditButtonClick);
    
                // Crea y configura el botón de eliminación.
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.className = 'delete-button';
                deleteButton.addEventListener('click', handleDeleteButtonClick);
    
                // Agrega los botones.
                actionsCell.appendChild(modifyButton);
                actionsCell.appendChild(deleteButton);
                
                // #endregion ==== Vuelve a crear los botones de modificación y eliminación. ====
                
            });
            
            // #endregion ==== Crea y configura el botón de cancelación. ====
                
            // Agregar los botones.
            const actionsCell = row.querySelector('.actions-container');
            actionsCell.textContent = '';
            actionsCell.appendChild(confirmButton);
            actionsCell.appendChild(cancelButton);
        };
    
        // Agrega un manejador para el evento clic de cada botón
        // de modificación de la tabla de eventos.
        let eventsTable = document.getElementsByClassName("events-table")[0];
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

    }, [eventsList]);

    // Agrega manejador para el evento clic del botón "Eliminar".
    useEffect(() => {

        // Manejador del evento clic en el botón de eliminar.
        const handleDeleteButtonClick_localScope = (event) => {
            const row = event.target.closest('tr');
            const cells = row.querySelectorAll('td');
            const eventId = cells[0].textContent;
            handleDeleteButtonClick(eventId);
        };

        // Agrega a cada botón de eliminar el evento un listener que llama a una función
        // que está definida dentro de este useEffect.
        let eventsTable = document.getElementsByClassName("events-table")[0];
        eventsTable.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteButtonClick_localScope);
        });

        // Función de limpieza: evita que el listener se agregue más de una vez y que, 
        // por ende, se generen múltiples eventos al hacer clic en el botón.
        return () => {
            eventsTable.querySelectorAll('.delete-button').forEach(button => {
                button.removeEventListener('click', handleDeleteButtonClick_localScope);
            });
        };

    }, [eventsList]);
    
    // Obtiene los eventos de la cursada seleccionada.
    useEffect(() => {

        const getCourseEvents = async () => {

            // Evita que el primer render arroje una excepción porque course es null.
            if (!course) return;

            try {
            
                // Obtiene el token Auth0.
                const auth0Token = await getAccessTokenSilently()
                .then(response => response)
                .catch(error => {
                    throw error;
                });

                // Realiza la petición al back para obtener la lista de eventos de la cursada.
                axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-all-events?course-id=${course.getId()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth0Token}`,
                        },
                    }
                )

                // Si la petición fue exitosa, se guarda la información obtenida.
                .then(response => {
                    const sortedEvents = response.data.eventList.sort((a, b) => a.eventId - b.eventId); // Ordena los eventos por ID
                    setEventsList(sortedEvents.map(event => {
                        return {
                            eventId: event.eventId,
                            type: event.type,
                            name: event.name,
                            initialDateTime:
                                event.initialDateTime !== null
                                ? (
                                    getHumanFormattedDateAndTime(event.initialDateTime)
                                ) : '-',
                            endDateTime:
                                event.endDateTime !== null
                                ? (
                                    getHumanFormattedDateAndTime(event.endDateTime)
                                ) : '-',
                            mandatory: event.mandatory,
                            actions: (
                                <div className="actions-container">
                                    <button className="edit-button">Modificar</button>
                                    <button className="delete-button">Eliminar</button>
                                </div>
                            )
                        }
                    }));
                })

                // Si la petición no fue exitosa, se genera una excepción.
                .catch(
                    error => error.response
                );

            } catch (error) {
                console.error('Error obteniendo eventos de cursada:', error);
            }

        }
        getCourseEvents();

    }, [course]);
    
    // #endregion ==== Definición de useEffect. ====

    // #region ==== Definición de funciones. ====
    
    /**
     * Envía una solicitud de actualización de información de evento al backend.
     * 
     * Si el evento se actualiza correctamente, se muestra un mensaje de éxito. Si
     * no, se muestra un mensaje de error.
     * 
     * @param {number} eventId ID del evento a modificar.
     * @param {string} newName Nuevo nombre del evento.
     * @param {string} newInitialDate Nueva fecha y hora inicial del evento.
     * @param {string} newEndDate Nueva fecha y hora final del evento.
     * @param {boolean} newMandatory Nuevo valor de obligatoriedad.
     */
    const updateEvent = async (eventId, newName, newInitialDate, newEndDate, newMandatory) => {

        fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event`, {
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
        })
        .then(response => {

            if (response.ok) {

                // Si la respuesta es exitosa, muestra un mensaje.
                alert("¡El evento se ha actualizado exitosamente!");

                
                // Elimina los botones de modificar y cancelar.
                const row = document.querySelector(`tr[data-event-id="${eventId}"]`);
                const actionsCell = row.querySelector('.actions-container');
                actionsCell.textContent = '';

            } else {

                // Si la respuesta no es exitosa, notifica al usuario que hubo un error.
                alert("Hubo un error al actualizar el evento.");
                console.error(response);

            }

        })
        .catch(error => console.error(error));
    };

    /**
     * Maneja el evento clic en el botón de eliminar.
     * 
     * @param {*} eventId ID del evento a eliminar. 
     */
    const handleDeleteButtonClick = (eventId) => {
        
        if (window.confirm("¿Estás seguro de que deseas eliminar este evento?")) {
            
            // Envìa el ID del evento para que el backend lo intente eliminar.
            fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/delete-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ eventId: eventId }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    
                    // Si hay un mensaje en la respuesta, lo muestra al usuario.
                    alert(data.message);
                    
                    // Si la respuesta es exitosa, actualiza la lista de eventos.
                    if (data.success) {
                        setEventsList(eventsList.filter(event => event.eventId !== eventId));
                    }

                } else {
                    
                    // Si no hay un mensaje en la respuesta, notifica al usuario que hubo un error.
                    alert("Hubo un error al eliminar el evento.");
                    console.error(data);

                }
            })
            .catch(error => console.error(error));
        }

    };

    /**
     * Formatea la fecha y hora de un evento con formato
     * legible para las personas.
     * 
     * @param {*} date Fecha a formatear.
     * @returns La fecha y hora formateada.
     */
    function getHumanFormattedDateAndTime(date) {

        const initialDate =
            Intl.DateTimeFormat(
                'es-AR',
                {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                }
            ).format(new Date(date));
        const initialTime = 
            Intl.DateTimeFormat(
                'es-AR',
                {
                    hour: '2-digit',
                    minute: '2-digit',
                }
            ).format(new Date(date));

        return `${initialDate}, ${initialTime}`
    }

    /**
     * Maneja el evento clic en el botón de exportar.
     */
    const handleExport = () => {

        // Exporta el libro de hojas de cálculo.
        spreadsheetManipulator.export(
            document.getElementById("events-table"),
            "Eventos de cursada",
            "eventos-cursada"
        );

    }
    
    // #endregion ==== Definición de funciones. ====

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
            {eventsList && (
                <div>
                    <table id="events-table" className="events-table table-container not-displayed"></table>
                    <button
                        type="button"
                        className="export-button"
                        onClick={handleExport}
                    >
                        Exportar a Excel
                    </button>
                </div>
            )}
        </PageLayout>
    );
};
