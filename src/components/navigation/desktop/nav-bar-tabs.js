  import { useAuth0 } from "@auth0/auth0-react";
  import React,  {useState, useEffect } from "react";
  import { NavBarTab } from "./nav-bar-tab";


  export const NavBarTabs = () => {
    const { isAuthenticated, getIdTokenClaims } = useAuth0();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProfessor, setIsProfessor] = useState(false);

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

    return (
      <div className="nav-bar__tabs">
        {isAuthenticated && (
          <>

            {/* Rutas para docentes. */}
            {isProfessor && <NavBarTab path="/register-students" label="Alta de estudiantes" />}
            {isProfessor && <NavBarTab path="/create-criterion" label="Alta de criterio" />}
            {isProfessor && <NavBarTab path="/register-attendance" label="Registrar asistencia" />}
            {isProfessor && <NavBarTab path="/register-califications" label="Registrar calificaciones" />}
            {isProfessor && <NavBarTab path="/register-students-in-course" label="Registrar estudiantes en comisión" />}
            {isProfessor && <NavBarTab path="/final-condition" label="Condición Final" />}

            {/* Rutas para administradores. */}
            {isAdmin && <NavBarTab path="/search-professor" label="Buscar docente" /> }
            {isAdmin && <NavBarTab path="/create-user" label="Alta de usuario" /> }
            {isAdmin && <NavBarTab path="/down-user" label="Baja de docente"/> }

            {/* Rutas públicas. */}
            <NavBarTab path="/change-password" label="Cambiar Contraseña" />

          </>
        )}
      </div>
    );
}
