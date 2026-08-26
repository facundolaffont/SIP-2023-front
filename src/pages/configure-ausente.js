import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useHistory } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider";
import './configure-ausente.css';

export function ConfigureAusente() {
    const [eventTypes, setEventTypes] = useState([]);
    const [selectedTypeIds, setSelectedTypeIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { getAccessTokenSilently } = useAuth0();
    const course = useSelectedCourse(false);
    const history = useHistory();

    useEffect(() => {
        if (!course) {
            history.push('/profile?course-missing');
            return;
        }

        const fetchData = async () => {
            try {
                const token = await getAccessTokenSilently();

                // Fetch all event types
                const typesResponse = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/get-event-types`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (typesResponse.status === 200) {
                    setEventTypes(typesResponse.data.eventTypesList || []);
                }

                // Fetch selected ausente categories
                const categoriesResponse = await axios.get(
                    `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/ausente-categories?courseId=${course.getId()}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (categoriesResponse.status === 200) {
                    // API returns List<EventType> which maps to {id, nombre}
                    const selectedIds = categoriesResponse.data.map(cat => cat.id);
                    setSelectedTypeIds(selectedIds);
                }
            } catch (error) {
                console.error("Error fetching data", error);
                toast.error("Ocurrió un error al obtener la configuración actual.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [course, getAccessTokenSilently, history]);

    const handleCheckboxChange = (eventTypeId, isChecked, eventTypeName) => {
        // Prevent unchecking 'Parcial'
        if (eventTypeName === 'Parcial') return;

        if (isChecked) {
            setSelectedTypeIds(prev => [...prev, eventTypeId]);
        } else {
            setSelectedTypeIds(prev => prev.filter(id => id !== eventTypeId));
        }
    };

    const handleSave = async () => {
        try {
            const token = await getAccessTokenSilently();
            const response = await axios.put(
                `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/ausente-categories`,
                {
                    courseId: course.getId(),
                    eventTypeIds: selectedTypeIds
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                toast.success("Configuración de condición AUSENTE guardada correctamente.");
            }
        } catch (error) {
            console.error("Error saving configuration", error);
            toast.error("Hubo un error al guardar la configuración.");
        }
    };

    if (isLoading) {
        return <PageLayout><div className="content__title">Cargando...</div></PageLayout>;
    }

    return (
        <PageLayout>
            <h1 className="content__title">Configurar condición de AUSENTE</h1>
            <h2 className="selected-course-info">
                {course && `Cursada seleccionada: (${course.getSubjectCode()}) ${course.getSubject()}, comisión ${course.getCommission()}, año ${course.getYear()}`}
            </h2>

            <div className="configure-ausente-container">
                <h3 className="configure-ausente-title">¿Cómo se calcula la condición AUSENTE?</h3>
                <p className="configure-ausente-explanation">
                    Esta configuración le dice al sistema en qué actividades el alumno debe faltar para quedar definitivamente como <strong>AUSENTE</strong>.
                </p>
                <p className="configure-ausente-explanation">
                    Si marca varias categorías (por ejemplo, "Parcial" y "Trabajo práctico"), el alumno solo quedará Ausente si falta <strong>a todas</strong> las evaluaciones de esos tipos. Con que asista a un solo TP o Parcial (incluso si desaprueba), ya entrará en evaluación normal para ver si queda Libre o Regular por nota, pero no será Ausente.
                </p>
            </div>

            <div className="configure-ausente-list">
                <h3 className="configure-ausente-subtitle">Categorías de eventos a tener en cuenta:</h3>
                {eventTypes
                    .filter(type => !type.eventTypeName.startsWith('Recuperatorio') && type.eventTypeName !== 'Final')
                    .sort((a, b) => {
                        const order = ['Parcial', 'Trabajo práctico', 'Autoevaluación', 'Integrador', 'Clase'];
                        let indexA = order.indexOf(a.eventTypeName);
                        let indexB = order.indexOf(b.eventTypeName);
                        if (indexA === -1) indexA = 99;
                        if (indexB === -1) indexB = 99;
                        return indexA - indexB;
                    })
                    .map(type => {
                        const isParcial = type.eventTypeName === 'Parcial';
                        // Parcial is always checked
                        const isChecked = isParcial || selectedTypeIds.includes(type.eventTypeId);

                        let displayName = type.eventTypeName;
                        if (['Parcial', 'Trabajo práctico', 'Autoevaluación'].includes(type.eventTypeName)) {
                            displayName += ' (incluye recuperatorios)';
                        }

                        return (
                            <div key={type.eventTypeId} className="configure-ausente-item">
                                <label className="configure-ausente-label" style={{ cursor: isParcial ? "not-allowed" : "pointer", opacity: isParcial ? 0.7 : 1 }}>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isParcial}
                                        onChange={(e) => handleCheckboxChange(type.eventTypeId, e.target.checked, type.eventTypeName)}
                                        className="configure-ausente-checkbox"
                                    />
                                    <span className="configure-ausente-event-name">{displayName}</span>
                                </label>
                            </div>
                        );
                    })}
            </div>

            <div style={{ marginTop: "30px" }}>
                <button
                    onClick={handleSave}
                >
                    Guardar Configuración
                </button>
            </div>

        </PageLayout>
    );
}
