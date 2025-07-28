// Componentes externos.
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

// Componentes internos.
import { NavBar } from "./navigation/desktop/nav-bar";
import { PageFooter } from "./page-footer";

export const PageLayout = ({ children }) => {
  const { isAuthenticated } = useAuth0();
  
  // Carga perezosa para reducir el impacto inicial.
  const Login = React.lazy(() => import('./login'));

  return (
    <>
      {!isAuthenticated && (
        <React.Suspense fallback={<div>Cargando...</div>}>
          <Login />
        </React.Suspense>
      )}
      {isAuthenticated && (
        <div className="page-layout">
          <NavBar />
            <div className="page-layout__content">{children}</div>
          <PageFooter />
        </div>
      )}
    </>
  );
};
