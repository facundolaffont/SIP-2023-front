  import { useAuth0 } from "@auth0/auth0-react";
  import React,  {useState, useEffect } from "react";
  import { NavBarTab } from "./nav-bar-tab";


  export const NavBarTabs = () => {
    const { isAuthenticated, getIdTokenClaims } = useAuth0();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
      const checkAdminRole = async () => {
        if (isAuthenticated) {
          const idTokenClaims = await getIdTokenClaims();
          const roles = idTokenClaims[`${process.env.REACT_APP_AUTH0_AUDIENCE}/roles`];
          if (roles && roles[0] === "Administrador") {
            setIsAdmin(true);
          }
        }
      };
      checkAdminRole();
    }, [isAuthenticated, getIdTokenClaims]);

    return (
      <div className="nav-bar__tabs">
        {isAuthenticated && (
          <>
            <NavBarTab path="/change-password" label="Cambiar Contraseña" />

            {/* TODO: las próximas rutas deberían poder accederse como docente, solamente. */}
            <NavBarTab path="/register-attendance" label="Registrar asistencia" />
            <NavBarTab path="/register-califications" label="Registrar calificaciones" />
            <NavBarTab path="/register-students" label="Registrar estudiantes" />
            <NavBarTab path="/create-criterion" label="Alta de criterio" />
            <NavBarTab path="/final-condition" label="Condición Final" />

            {isAdmin && <NavBarTab path="/search-professor" label="Buscar docente" /> }
            {isAdmin && <NavBarTab path="/create-user" label="Alta de usuario" /> }
            {isAdmin && <NavBarTab path="/down-user" label="Baja de docente"/> }
          </>
        )}
      </div>
    );
}
