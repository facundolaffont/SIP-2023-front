import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from "react";
import { NavBarTab } from "./nav-bar-tab";

export const NavBarTabs = () => {
    const { isAuthenticated, getIdTokenClaims } = useAuth0();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProfessor, setIsProfessor] = useState(false);
    const [showRegistrationsDropdown, setShowRegistrationsDropdown] = useState(false);
    const [showListingsDropdown, setShowListingsDropdown] = useState(false);
    const [showUsersManagementDropdown, setShowUsersManagementDropdown] = useState(false);
    const [showTeachersManagementDropdown, setShowTeachersManagementDropdown] = useState(false);
    const [showCalificationCriterionsDropdown, setShowCalificationCriterionsDropdown] = useState(false);
    const [dropdownTopStyle, setDropdownTopStyle] = useState(0);

    // Determina el rol del usuario.
    useEffect(() => {
        const checkRole = async () => {
            if (isAuthenticated) {
                
                // Obtiene y almacena los claims del token.
                const idTokenClaims = await getIdTokenClaims();
                const roles =
                    idTokenClaims[`${process.env.REACT_APP_AUTH0_AUDIENCE}/roles`];

                // Determina el rol del usuario.
                if (roles && roles.includes("SuperAdministrador")) {
                    setIsSuperAdmin(true);
                }
                if (roles && roles.includes("Administrador")) {
                    setIsAdmin(true);
                }
                if (roles && roles.includes("Docente")) {
                    setIsProfessor(true);
                }
            }
        };
        checkRole();
    }, [isAuthenticated, getIdTokenClaims]);

    // Manejador del evento q ue surge cuando se posa el mouse encima.
    const handleMouseEnter = (event, setDropdownFunctionCallback) => {
        const rect = event.target.getBoundingClientRect();
        setDropdownTopStyle(rect.bottom);
        setDropdownFunctionCallback(true);
    };

    // Manejador del evento que surge cuando se quita el mouse de encima.
    const handleMouseLeave = (event, setFunctionCallback) => {
        setFunctionCallback(false);
    };

    return (
        <div className="nav-bar__tabs">
            {isAuthenticated && (
                <>

                    {/* Rutas para docentes */}
                    {isProfessor && (
                        <div
                            className="nav-bar__tab"
                            onMouseEnter={(event) => handleMouseEnter(event, setShowRegistrationsDropdown)}
                            onMouseLeave={(event) => handleMouseLeave(event, setShowRegistrationsDropdown)}
                        >
                            <span>Registraciones</span>
                            {showRegistrationsDropdown && (
                                <div className="dropdown" style={{ top: dropdownTopStyle }}>
                                    <NavBarTab
                                        path="/register-events-bulk"
                                        label="Crear eventos"
                                    />
                                    {/*
                                    <NavBarTab
                                        path="/register-event"
                                        label="Crear evento"
                                    />
                                    */}
                                    <NavBarTab
                                        path="/register-students"
                                        label="Registrar estudiantes"
                                    />
                                    {/*
                                    <NavBarTab
                                        path="/register-students-in-course"
                                        label="Vincular estudiantes con cursada"
                                    />
                                    */}
                                    <NavBarTab
                                        path="/register-attendance"
                                        label="Registrar asistencias"
                                    />
                                    {/*<NavBarTab
                                        path="/register-course-attendance"
                                        label="Registrar asistencias del curso"
                                    />*/}
                                    <NavBarTab
                                        path="/register-califications"
                                        label="Registrar calificaciones"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {isProfessor && (
                        <div
                            className="nav-bar__tab"
                            onMouseEnter={(event) => handleMouseEnter(event, setShowListingsDropdown)}
                            onMouseLeave={(event) => handleMouseLeave(event, setShowListingsDropdown)}
                        >
                            <span>Información de cursada</span>
                            {showListingsDropdown && (
                                <div className="dropdown" style={{ top: dropdownTopStyle }}>
                                    <NavBarTab
                                        path="/list-course-events"
                                        label="Listar eventos"
                                    />
                                    <NavBarTab
                                        path="/show-all-events-registers"
                                        label="Listar detalle de eventos"
                                    />
                                    <NavBarTab
                                        path="/list-course-students"
                                        label="Listar alumnos"
                                    />
                                    <NavBarTab
                                        path="/search-student"
                                        label="Consultar eventos por alumno"
                                    />
                                    <NavBarTab
                                        path="/search-event"
                                        label="Consultar evento"
                                    />
                                    {/*<NavBarTab
                                        path="/show-criteria-summary"
                                        label="Mostrar resumen por criterio"
                                    />*/}
                                    <NavBarTab
                                        path="/show-events-summary"
                                        label="Resumen de eventos"
                                    />
                                    {/*<NavBarTab
                                        path="/list-events-attendance"
                                        label="Listar asistencia"
                                    />
                                    <NavBarTab
                                        path="/list-events-califications"
                                        label="Listar calificaciones"
                                    />*/}
                                </div>
                            )}
                        </div>
                    )}
                    {isProfessor && (
                        <div
                            className="nav-bar__tab"
                            onMouseEnter={(event) => handleMouseEnter(event, setShowCalificationCriterionsDropdown)}
                            onMouseLeave={(event) => handleMouseLeave(event, setShowCalificationCriterionsDropdown)}
                        >
                            <span>Condición final</span>
                            {showCalificationCriterionsDropdown && (
                                <div className="dropdown" style={{ top: dropdownTopStyle }}>
                                    <NavBarTab
                                        path="/create-criterion"
                                        label="Crear criterio de evaluación"
                                    />
                                    <NavBarTab
                                        path="/modificate-criterion"
                                        label="Modificar criterios de evaluación"
                                    />
                                    <NavBarTab
                                        path="/final-condition"
                                        label="Calcular condición final"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rutas para administradores */}
                    {isAdmin && (
                        <div
                            className="nav-bar__tab"
                            onMouseEnter={(event) => handleMouseEnter(event, setShowTeachersManagementDropdown)}
                            onMouseLeave={(event) => handleMouseLeave(event, setShowTeachersManagementDropdown)}
                        >
                            <span>Gestión de docentes</span>
                            {showTeachersManagementDropdown && (
                                <div className="dropdown" style={{ top: dropdownTopStyle }}>
                                    <NavBarTab path="/search-professor" label="Buscar docente" />
                                    <NavBarTab path="/create-professor" label="Alta de docente" />
                                    <NavBarTab path="/down-professor" label="Baja de docente" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rutas para súper administradores */}
                    {isSuperAdmin && (
                        <div
                            className="nav-bar__tab"
                            onMouseEnter={(event) => handleMouseEnter(event, setShowUsersManagementDropdown)}
                            onMouseLeave={(event) => handleMouseLeave(event, setShowUsersManagementDropdown)}
                        >
                            <span>Gestión de usuarios</span>
                            {showUsersManagementDropdown && (
                                <div className="dropdown" style={{ top: dropdownTopStyle }}>
                                    <NavBarTab path="/search-user" label="Buscar usuario" />
                                    <NavBarTab path="/create-user" label="Alta de usuario" />
                                    <NavBarTab path="/down-user" label="Baja de usuario" />
                                    <NavBarTab path="/assign-role" label="Asignar rol" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rutas públicas */}
                    <NavBarTab path="/change-password" label="Cambiar contraseña" />

                </>
            )}
        </div>
    );
};
