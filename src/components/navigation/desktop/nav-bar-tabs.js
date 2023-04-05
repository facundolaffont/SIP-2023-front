  import { useAuth0 } from "@auth0/auth0-react";
  import React,  {useState, useEffect } from "react";
  import { NavBarTab } from "./nav-bar-tab";


  export const NavBarTabs = () => {
    const { isAuthenticated, getIdTokenClaims} = useAuth0();
    const [isAdmin, setIsAdmin] = useState(false);

    
   useEffect(() => {
      const checkAdminRole = async () => {
        if (isAuthenticated) {
         const idTokenClaims = await getIdTokenClaims();
          const user_metadata = idTokenClaims['https://hello-world.example.com/user_metadata'];
          if (user_metadata && user_metadata.role === "admin") {
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
            <NavBarTab path="/perfil" label="Mi perfil" />
            <NavBarTab path="/cambiar-password" label="Cambiar Contraseña" />
            {isAdmin && (
            <>
            <NavBarTab path="/buscar-docente" label="Buscar docente" />
            <NavBarTab path="/alta-docente" label="Alta de docente" />
            </>
            )}
          </>
        )}
      </div>
    );
}
