import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from "react";
import { NavBarTab } from "./nav-bar-tab";

export const NavBarTabs = () => {
    const { isAuthenticated, getIdTokenClaims } = useAuth0();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProfessor, setIsProfessor] = useState(false);
    const [showBulkRegistrationsDropdown, setShowBulkRegistrationsDropdown] = useState(false);
    const [showListingsDropdown, setShowListingsDropdown] = useState(false);
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
                        <NavBarTab
                            path="/register-event"
                            label="Crear evento"
                        />
                    )}
                    {isProfessor && (
                        <div
                            className="nav-bar__tab"
                            onMouseEnter={(event) => handleMouseEnter(event, setShowBulkRegistrationsDropdown)}
                            onMouseLeave={(event) => handleMouseLeave(event, setShowBulkRegistrationsDropdown)}
                        >
                            <span>Cargas masivas</span>
                            {showBulkRegistrationsDropdown && (
                                <div className="dropdown" style={{ top: dropdownTopStyle }}>
                                    <NavBarTab
                                        path="/register-students"
                                        label="Registrar estudiantes"
                                    />
                                    <NavBarTab
                                        path="/register-students-in-course"
                                        label="Vincular estudiantes con comisión"
                                    />
                                    <NavBarTab
                                        path="/register-attendance"
                                        label="Registrar asistencias"
                                    />
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
                                        path="/list-course-students"
                                        label="Listar alumnos"
                                    />
                                    <NavBarTab path="/search-student" label="Consultar alumno" />
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
                                        label="Crear criterio"
                                    />
                                    <NavBarTab
                                        path="/modificate-criterion"
                                        label="Modificar criterio"
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
                                    <NavBarTab path="/create-user" label="Alta de usuario" />
                                    <NavBarTab path="/down-user" label="Baja de docente" />
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
