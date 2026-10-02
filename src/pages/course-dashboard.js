// Imports externos.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useHistory, Link } from "react-router-dom";

// Imports internos.
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider";

// Estilos.
import "../styles/course-dashboard.css";
import "../styles/home-page-professor.css";

// Imagen de fondo.
import aulaBackground from "../img/AULA1.jpg";

// ==============================================================
// Estructura de 3 pasos con sus acciones.
// badge solo aparece cuando la acción usa Excel/planilla.
// ==============================================================

const STEPS = [
    {
        id: "cohorte",
        title: "Datos de la Cohorte",
        shortTitle: "Cohorte",
        actions: [
            {
                path: "/register-students",
                name: "Registrar alumnos",
                desc: "Importar desde planilla",
                icon: "📝",
                badge: "Excel",
            },
            {
                path: "/list-course-students",
                name: "Listar alumnos",
                desc: "Ver y modificar datos de los alumnos inscriptos",
                icon: "📋",
            },
            {
                path: "/register-groups",
                name: "Registrar grupos",
                desc: "Importar grupos de estudiantes desde planilla",
                icon: "🧑‍🤝‍🧑",
                badge: "Excel",
            },
            {
                path: "/list-student-groups",
                name: "Listar grupos",
                desc: "Ver y modificar grupos de estudiantes",
                icon: "📁",
            },
        ],
    },
    {
        id: "eventos-registros",
        title: "Eventos, Asistencia y Notas",
        shortTitle: "Eventos y Notas",
        actions: [
            {
                path: "/register-events-bulk",
                name: "Crear eventos",
                desc: "Importar clases y evaluaciones desde planilla",
                icon: "📅",
                badge: "Excel",
            },
            {
                path: "/list-course-events",
                name: "Listar eventos",
                desc: "Ver, modificar y ver el detalle de cada evento",
                icon: "📋",
            },
            {
                path: "/search-student",
                name: "Consultar eventos por alumno",
                desc: "Buscar todos los registros de asistencia y notas de un alumno",
                icon: "🔍",
            },
            {
                path: "/register-califications",
                name: "Calificaciones individuales",
                desc: "Importar notas de evaluación desde planilla",
                icon: "✏️",
                badge: "Excel",
            },
            {
                path: "/register-group-califications",
                name: "Calificaciones grupales",
                desc: "Importar notas por grupos desde planilla",
                icon: "🧑‍🤝‍🧑",
                badge: "Excel",
            },
            {
                path: "/register-attendance",
                name: "Asistencia (rápida)",
                desc: "Tomar asistencia de un evento específico",
                icon: "✋",
            },
            {
                path: "/register-bulk-attendance",
                name: "Asistencia masiva",
                desc: "Registrar asistencia de varios eventos a la vez",
                icon: "📑",
            },
            {
                path: "/show-all-events-registers",
                name: "Detalle de registros",
                desc: "Ver todos los registros de asistencia y notas por evento",
                icon: "🔍",
            },
            {
                path: "/show-events-summary",
                name: "Resumen de eventos",
                desc: "Ver resumen estadístico de aprobación y asistencia por evento",
                icon: "📊",
            },
            {
                path: "/send-califications",
                name: "Envío de calificaciones",
                desc: "Enviar las notas a los alumnos por email",
                icon: "📧",
            },
        ],
    },
    {
        id: "cierre",
        title: "Cierre de Cursada",
        shortTitle: "Cierre",
        actions: [
            {
                path: "/create-criterion",
                name: "Crear criterio de evaluación",
                desc: "Definir una regla para determinar la condición final del alumno",
                icon: "⚙️",
            },
            {
                path: "/modificate-criterion",
                name: "Modificar criterios",
                desc: "Editar o reordenar criterios existentes",
                icon: "✏️",
            },
            {
                path: "/configure-ausente",
                name: "Configurar AUSENTE",
                desc: "Definir qué se considera 'Ausente' en esta cursada",
                icon: "🚫",
            },
            {
                path: "/final-condition",
                name: "Calcular condiciones finales",
                desc: "Calcular si cada alumno es Regular, Libre o Promovido",
                icon: "🎯",
            },
        ],
    },
];

const EXTRA_ACTIONS = [
    {
        path: "/eliminate-califications",
        name: "Eliminar calificaciones",
        desc: "Eliminar o transferir calificaciones registradas",
        icon: "❌",
    },
    {
        path: "/eliminate-attendance",
        name: "Eliminar asistencias",
        desc: "Eliminar o transferir asistencias registradas",
        icon: "❌",
    },
];

// ==============================================================
// Componente principal
// ==============================================================

export const CourseDashboard = () => {
    const { getAccessTokenSilently } = useAuth0();
    const course = useSelectedCourse(false);
    const history = useHistory();

    const [bgLoaded, setBgLoaded] = useState(false);

    // Datos de estadísticas.
    const [classesCount, setClassesCount]   = useState(null);
    const [evalsCount, setEvalsCount]       = useState(null);
    const [studentsCount, setStudentsCount] = useState(null);
    const [criteriaCount, setCriteriaCount] = useState(null);
    const [groupsCount, setGroupsCount]     = useState(null);

    // Registros pendientes de cargar.
    const [pendingAttendance, setPendingAttendance] = useState(0);
    const [pendingCalifs, setPendingCalifs]         = useState(0);

    // Estado de cierre
    const [hasFinalConditions, setHasFinalConditions] = useState(false);

    // Pasos expandidos: Set de índices. Por defecto abre el primer paso incompleto.
    const [expandedSteps, setExpandedSteps] = useState(new Set([0]));

    // Precarga del fondo.
    useEffect(() => {
        const img = new Image();
        img.src = aulaBackground;
        img.onload = () => setBgLoaded(true);
    }, []);

    // Redirige a /profile si no hay cursada seleccionada.
    useEffect(() => {
        if (course === null) {
            history.push("/profile?course-missing");
        }
    }, [course, history]);

    // Obtiene datos del dashboard.
    useEffect(() => {
        if (!course) return;

        const fetchData = async () => {
            try {
                const token = await getAccessTokenSilently();
                const headers = { Authorization: `Bearer ${token}` };
                const courseId = course.getId();

                const [eventsRes, studentsRes, criteriaRes, groupsRes, summaryRes] = await Promise.allSettled([
                    axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-all-events`,
                        { params: { "course-id": courseId }, headers }),
                    axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-students`,
                        { params: { courseId }, headers }),
                    axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/evaluationCriterias`,
                        { params: { courseId }, headers }),
                    axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-student-groups`,
                        { params: { courseId }, headers }),
                    axios.get(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-events-summary`,
                        { params: { "course-id": courseId }, headers }),
                ]);

                // Eventos: distinguir Clases de Evaluaciones por tipo.
                const eventList = eventsRes.status === "fulfilled" ? eventsRes.value?.data?.eventList : [];
                if (Array.isArray(eventList)) {
                    setClassesCount(eventList.filter(e => e.type === "Clase").length);
                    setEvalsCount(eventList.filter(e => e.type !== "Clase").length);
                } else {
                    setClassesCount(0);
                    setEvalsCount(0);
                }

                // Alumnos.
                const studentsList = studentsRes.status === "fulfilled" ? studentsRes.value?.data?.studentsList : [];
                setStudentsCount(Array.isArray(studentsList) ? studentsList.length : 0);
                if (Array.isArray(studentsList)) {
                    setHasFinalConditions(studentsList.some(s => s.finalCondition != null && s.finalCondition !== ""));
                } else {
                    setHasFinalConditions(false);
                }

                // Criterios.
                setCriteriaCount(
                    criteriaRes.status === "fulfilled" && Array.isArray(criteriaRes.value?.data)
                        ? criteriaRes.value.data.length
                        : 0
                );

                // Grupos.
                const groupsList = groupsRes.status === "fulfilled" ? groupsRes.value?.data?.groups : [];
                setGroupsCount(Array.isArray(groupsList) ? groupsList.length : 0);

                // Pendientes de registrar (asistencia y calificaciones).
                if (summaryRes.status === "fulfilled" && summaryRes.value?.data) {
                    const summary = summaryRes.value.data;
                    setPendingAttendance(
                        (summary.classEventsSummaryList || []).filter(e => e.missingRegisters > 0).length
                    );
                    setPendingCalifs(
                        (summary.evaluationEventsByApprovalRateSummaryList || []).filter(e => e.missingRegisters > 0).length
                    );
                }
            } catch (error) {
                console.error("Error obteniendo datos del dashboard:", error);
            }
        };

        fetchData();
    }, [course, getAccessTokenSilently]);

    if (!course) return null;

    // ---- Estado de cada paso ----
    const totalEvents  = (classesCount ?? 0) + (evalsCount ?? 0);
    const isDataLoaded = classesCount !== null;
    const pendingTotal = pendingAttendance + pendingCalifs;

    const stepStatus = [
        // Paso 1: Cohorte
        studentsCount > 0 ? "done" : (isDataLoaded ? "pending" : "loading"),
        // Paso 2: Eventos y Notas
        !isDataLoaded ? "loading" : pendingTotal > 0 ? "progress" : totalEvents > 0 ? "done" : "pending",
        // Paso 3: Cierre (Criterios y Cálculo)
        !isDataLoaded ? "loading" : hasFinalConditions ? "done" : criteriaCount > 0 ? "progress" : "pending",
    ];

    const toggleStep = (index) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    };

    return (
        <PageLayout>
            <div className={`home-page-professor-bg ${bgLoaded ? "bg-loaded" : ""}`} />

            {/* Header */}
            <div className="dash-header">
                <div className="dash-header-info">
                    <h1>
                        {course.getSubject()}
                        <span className="dash-header-code"> ({course.getSubjectCode()})</span>
                    </h1>
                    <p>
                        {course.getCareer()} — Comisión {course.getCommission()} — Año {course.getYear()}
                    </p>
                </div>
                <Link to="/profile" className="dash-back-btn">← Cambiar cursada</Link>
            </div>

            {/* Chips de estadísticas */}
            <div className="dash-chips">
                <StatChip
                    icon="📅"
                    loading={classesCount === null}
                    label={`${classesCount ?? "—"} Clases + ${evalsCount ?? "—"} Evaluaciones`}
                    warn={pendingAttendance > 0 || pendingCalifs > 0}
                    warnLabel={`${pendingTotal} pendiente${pendingTotal !== 1 ? "s" : ""}`}
                />
                <span className="dash-chips-sep">|</span>
                <StatChip
                    icon="👥"
                    loading={studentsCount === null}
                    label={`${studentsCount ?? "—"} Alumno${studentsCount !== 1 ? "s" : ""}`}
                />
                <span className="dash-chips-sep">|</span>
                <StatChip
                    icon="📋"
                    loading={criteriaCount === null}
                    label={`${criteriaCount ?? "—"} Criterio${criteriaCount !== 1 ? "s" : ""}`}
                    warn={criteriaCount === 0 && isDataLoaded && totalEvents > 0}
                    warnLabel="Sin criterios"
                />
                <span className="dash-chips-sep">|</span>
                <StatChip
                    icon="🧑‍🤝‍🧑"
                    loading={groupsCount === null}
                    label={`${groupsCount ?? "—"} Grupo${groupsCount !== 1 ? "s" : ""}`}
                />
            </div>

            {/* Stepper de 3 pasos */}
            <div className="dash-stepper-container">
                <div className="dash-stepper-bar">
                    {STEPS.map((step, i) => {
                        const status     = stepStatus[i];
                        const isExpanded = expandedSteps.has(i);
                        return (
                            <button
                                key={step.id}
                                className={`dash-step-btn dash-step-btn--${status} ${isExpanded ? "dash-step-btn--expanded" : ""}`}
                                onClick={() => toggleStep(i)}
                                aria-expanded={isExpanded}
                            >
                                <div className={`dash-step-circle dash-step-circle--${status}`}>
                                    {status === "done" ? "✓" : status === "loading" ? "…" : i + 1}
                                </div>
                                <div className="dash-step-label">
                                    <span className="dash-step-label-num">PASO {i + 1}</span>
                                    <span className="dash-step-label-title">{step.shortTitle}</span>
                                </div>
                                <span className="dash-step-chevron">{isExpanded ? "▲" : "▼"}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Paneles expandibles */}
                {STEPS.map((step, i) => {
                    const status     = stepStatus[i];
                    const isExpanded = expandedSteps.has(i);
                    return (
                        <div
                            key={step.id}
                            className={`dash-step-panel ${isExpanded ? "dash-step-panel--open" : ""}`}
                        >
                            <div className="dash-step-panel-inner">
                                <div className="dash-step-panel-header">
                                    <h3>
                                        <span className="dash-step-panel-num">Paso {i + 1}:</span>{" "}
                                        {step.title}
                                    </h3>
                                    <StepStatusBadge
                                        status={status}
                                        step={i}
                                        pendingTotal={pendingTotal}
                                        studentsCount={studentsCount}
                                        totalEvents={totalEvents}
                                        criteriaCount={criteriaCount}
                                    />
                                </div>
                                <div className="dash-actions-grid">
                                    {step.actions.map((action, ai) => (
                                        <Link key={ai} to={action.path} className="dash-action-card">
                                            <span className="dash-action-icon">{action.icon}</span>
                                            <div className="dash-action-text">
                                                <p className="dash-action-name">{action.name}</p>
                                                <p className="dash-action-desc">{action.desc}</p>
                                            </div>
                                            {action.badge && (
                                                <span className="dash-action-badge">{action.badge}</span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Más opciones */}
            <details className="dash-extra">
                <summary className="dash-extra-summary">⚙️ Más opciones (eliminaciones)</summary>
                <div className="dash-actions-grid dash-extra-grid">
                    {EXTRA_ACTIONS.map((action, i) => (
                        <Link key={i} to={action.path} className="dash-action-card dash-action-card--danger">
                            <span className="dash-action-icon">{action.icon}</span>
                            <div className="dash-action-text">
                                <p className="dash-action-name">{action.name}</p>
                                <p className="dash-action-desc">{action.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </details>
        </PageLayout>
    );
};

// ==============================================================
// Subcomponentes
// ==============================================================

const StatChip = ({ icon, label, loading, warn = false, warnLabel }) => (
    <span className={`dash-chip ${warn ? "dash-chip--warn" : ""}`}>
        {icon}{" "}
        {loading ? <span className="dash-chip-spinner" /> : label}
        {warn && warnLabel && !loading && (
            <span className="dash-chip-warn-badge">⚠ {warnLabel}</span>
        )}
    </span>
);

const StepStatusBadge = ({ status, step, pendingTotal, studentsCount, totalEvents, criteriaCount }) => {
    if (status === "done") {
        const labels = [
            "✅ Alumnos y grupos listos",
            "✅ Eventos y registros completos",
            "✅ Cierre finalizado",
        ];
        return <span className="dash-status-badge dash-status-badge--done">{labels[step]}</span>;
    }
    if (status === "progress") {
        if (step === 1) {
            return (
                <span className="dash-status-badge dash-status-badge--progress">
                    🟠 {pendingTotal} evento{pendingTotal !== 1 ? "s" : ""} sin registros completos
                </span>
            );
        }
        if (step === 2) return <span className="dash-status-badge dash-status-badge--progress">🟠 Listo para cierre</span>;
    }
    if (status === "loading") return <span className="dash-status-badge dash-status-badge--loading">Cargando…</span>;
    const pendingLabels = [
        "→ Registrá alumnos para comenzar",
        "→ Creá eventos para poder registrar asistencia y notas",
        "→ Definí criterios y calculá las condiciones",
    ];
    return <span className="dash-status-badge dash-status-badge--pending">{pendingLabels[step]}</span>;
};
