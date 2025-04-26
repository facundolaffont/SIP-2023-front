// Componentes externos.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useHistory } from 'react-router-dom';

// Componentes internos.
import { PageLayout } from "../components/page-layout.js";
import HTMLTableManipulator from "../services/html-table-manipulator";
import SpreadsheetManipulator from "../services/spreadsheet-manipulator.service";
import { useSelectedCourse } from "../contexts/course/course-provider.js";
import CourseDTO from "../contexts/course/course-d-t-o";
import ReactDOMServer from 'react-dom/server';

// Estilos.
import '../styles/list-course-events.css';

export const ListCourseEvents = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [spreadsheetManipulator, setSpreadsheetManipulator] = useState(null);
    const [eventsList, setEventsList] = useState([]);
    
    /** @type {CourseDTO} */ const course = useSelectedCourse(false);
    const history = useHistory();

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
            HTMLTableManipulator.insertDataIntoTable(eventsTable, {
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
                actionsColumnIndex: 4
            });
    
            // Muestra la tabla de eventos.
            eventsTable.classList.remove("not-displayed");

        } else eventsTable.classList.add("not-displayed");

    }, [eventsList]);
        
    // Agrega eventos de edición al hacer clic en el botón "Modificar".
    useEffect(() => {

        const handleEditButtonClick = (event) => {
            const row = event.target.closest('tr');
            const cells = row.querySelectorAll('td');
    
            const fechaInicioVieja = cells[2].textContent;
            const fechaFinVieja = cells[3].textContent;
            const obligatorioViejo = cells[4].textContent;
    
            // Habilita la edición solo para las celdas de fecha y obligatorio
            cells[2].contentEditable = true; // Fecha y hora inicio
            cells[3].contentEditable = true; // Fecha y hora fin
            cells[4].contentEditable = true; // Obligatorio

            const initialDateTimeInput = document.createElement('input');
            initialDateTimeInput.type = 'datetime-local';
            cells[2].innerHTML = '';
            cells[2].appendChild(initialDateTimeInput);

            // Crea un nuevo elemento input para la fecha y hora de fin
            const endDateTimeInput = document.createElement('input');
            endDateTimeInput.type = 'datetime-local';
            cells[3].innerHTML = '';
            cells[3].appendChild(endDateTimeInput);

            // Agregar botones de confirmar y cancelar
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmar';
            confirmButton.addEventListener('click', () => {
                // Guardar los cambios y deshabilitar la edición
                cells[2].contentEditable = false;
                cells[3].contentEditable = false;
                cells[4].contentEditable = false;
                // Aquí podrías agregar la lógica para guardar los cambios en el estado eventsList
                
                const eventId = cells[0].textContent;
                let newMandatory = cells[4].textContent;
                let newStartDate = new Date(initialDateTimeInput.value).toISOString();
                let newEndDate = new Date(endDateTimeInput.value).toISOString();
                cells[2].textContent = getFormattedDateAndTime(newStartDate);
                cells[3].textContent = getFormattedDateAndTime(newEndDate);

                if (obligatorioViejo !== newMandatory ||
                    fechaInicioVieja !== newStartDate ||
                    fechaFinVieja !== newEndDate) {
                    // Llamar a la función para actualizar el evento en el backend
                    
                    if (newMandatory === "x")                        
                        newMandatory = true
                    else
                        newMandatory = false
                    
                    updateEvent(eventId, newMandatory, newStartDate, newEndDate);
                }

                const actionsCell = row.querySelector('.actions-container');
                actionsCell.textContent = '';
    
                const modifyButton = document.createElement('button');
                modifyButton.textContent = 'Modificar';
                modifyButton.className = 'edit-button';
                modifyButton.addEventListener('click', handleEditButtonClick);
    
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.className = 'delete-button';
    
                actionsCell.appendChild(modifyButton);
                actionsCell.appendChild(deleteButton);

            });
    
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancelar';
            cancelButton.addEventListener('click', () => {
                
                // Restaura los valores originales y deshabilita la edición.
                cells[2].textContent = fechaInicioVieja; // Restaura el valor original de la fecha.
                cells[3].textContent = fechaFinVieja; // Restaura el valor original del campo obligatorio.
                cells[4].textContent = obligatorioViejo;
                cells[2].contentEditable = false;
                cells[3].contentEditable = false;
                cells[4].contentEditable = false;

                // Muestra los botones "Modificar" y "Eliminar".
                const actionsCell = row.querySelector('.actions-container');
                actionsCell.textContent = '';
    
                const modifyButton = document.createElement('button');
                modifyButton.textContent = 'Modificar';
                modifyButton.className = 'edit-button';
                modifyButton.addEventListener('click', handleEditButtonClick);
    
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.className = 'delete-button';
                deleteButton.addEventListener('click', handleDeleteButtonClick);
    
                actionsCell.appendChild(modifyButton);
                actionsCell.appendChild(deleteButton);
            });
    
            // Agregar los botones a la celda de acciones
            const actionsCell = row.querySelector('.actions-container');
            actionsCell.textContent = ''; // Limpiar contenido existente
            actionsCell.appendChild(confirmButton);
            actionsCell.appendChild(cancelButton);
        };
    
        // Obtiene el manejador de la tabla de eventos, y luego agrega a cada botón
        // de modificar el evento un listener que llama a la función handleEditButtonClick.
        let eventsTable = document.getElementsByClassName("events-table")[0];
        eventsTable.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditButtonClick);
        });
    
        return () => {
            eventsTable.querySelectorAll('.edit-button').forEach(button => {
                button.removeEventListener('click', handleEditButtonClick);
            });
        };

    }, [eventsList]);

    // Agrega eventos de eliminación al hacer clic en el botón "Eliminar".
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
                                    getFormattedDateAndTime(event.initialDateTime)
                                ) : '-',
                            endDateTime:
                                event.endDateTime !== null
                                ? (
                                    getFormattedDateAndTime(event.endDateTime)
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

    // Actualiza los datos de un evento.
    const updateEvent = async (eventId, newMandatory, initialDate, endDate) => {

        fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/update-event`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ eventId: eventId, newMandatory: newMandatory, 
                initialDate: initialDate, endDate: endDate
            }), // Pasar un objeto con las propiedades eventId y newData
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
     * Formatea la fecha y hora de un evento.
     * 
     * @param {*} date 
     * @returns La fecha y hora formateada.
     */
    function getFormattedDateAndTime(date) {

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
