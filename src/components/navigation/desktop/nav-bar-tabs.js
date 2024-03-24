  import { useAuth0 } from "@auth0/auth0-react";
  import React,  {useState, useEffect } from "react";
  import { NavBarTab } from "./nav-bar-tab";


  export const NavBarTabs = () => {
    const { isAuthenticated, getIdTokenClaims } = useAuth0();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProfessor, setIsProfessor] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownTop, setDropdownTop] = useState(0);


    // Determina el rol del usuario.
    useEffect(() => {
        const checkRole = async () => {
            if (isAuthenticated) {

                // Obtiene y almacena los claims del token.
                const idTokenClaims = await getIdTokenClaims();
                const roles =
                    idTokenClaims[`${process.env.REACT_APP_AUTH0_AUDIENCE}/roles`];

                // Determina el rol del usuario.
                if (roles && roles.includes("Administrador")) { setIsAdmin(true); }
                if (roles && roles.includes("Docente")) { setIsProfessor(true); }

            }
        };
        checkRole();
    }, [isAuthenticated, getIdTokenClaims]);
    
    const handleMouseEnter = (e) => {
      const rect = e.target.getBoundingClientRect();
      setDropdownTop(rect.bottom);
      setShowDropdown(true);
    };
  
    const handleMouseLeave = () => {
      setShowDropdown(false);
    };  

    return (
      <div className="nav-bar__tabs">
        {isAuthenticated && (
          <>
            
            {/* Rutas para docentes. */}
            {isProfessor && <NavBarTab path="/register-students" label="Alta de estudiantes" />}
            {isProfessor && <NavBarTab path="/create-criterion" label="Alta de criterio" />}
            {isProfessor && <NavBarTab path="/register-event" label="Alta de Evento" />}
            {isProfessor && (
            <div className="nav-bar__tab" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <span>Cargas masivas</span>
              {showDropdown && (
                <div className="dropdown" style={{ top: dropdownTop }}>
                  <NavBarTab path="/register-attendance" label="Registrar asistencia" />
                  <NavBarTab path="/register-califications" label="Registrar calificaciones" />
                  <NavBarTab path="/register-students-in-course" label="Registrar estudiantes en comisión" />
                  <NavBarTab path="/search-student" label="Ver estado de alumno" />
                  <NavBarTab path="/list-course-students" label="Listar alumnos" />
                  </div>
              )}
            </div>
            )}

            {isProfessor && <NavBarTab path="/final-condition" label="Condición Final" />}
            {isProfessor && <NavBarTab path="/modificate-criterion" label="Modificación de Criterio de Evaluación" />}

            {/* Rutas para administradores. */}            
            {isAdmin && (
            <div className="nav-bar__tab" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <span>Gestión de docentes</span>
              {showDropdown && (
                <div className="dropdown" style={{ top: dropdownTop }}>
                  <NavBarTab path="/search-professor" label="Buscar docente" />
                  <NavBarTab path="/create-user" label="Alta de usuario" />
                  <NavBarTab path="/down-user" label="Baja de docente" />
                </div>
              )}
            </div>
          )}

            {/* Rutas públicas. */}
            <NavBarTab path="/change-password" label="Cambiar Contraseña" />

          </>
        )}
      </div>
    );
}
