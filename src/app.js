import { useAuth0 } from "@auth0/auth0-react";
import React,  {useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { PageLoader } from "./components/page-loader";
import { ProtectedRoute } from "./components/protected-route";
import { CallbackPage } from "./pages/callback-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { HomePageProffesor } from "./pages/home-page-proffesor";
import { HomePageAdmin } from "./pages/home-page-admin";
import { CreateUser } from "./pages/create-user";
import { SearchProfessor } from "./pages/search-professor";
import { ChangePasswordForm } from "./pages/change-password";
import { DownUser } from "./pages/down-user";
import { AssignRole } from "./pages/assign-role";
import { AttendanceRegistering } from "./pages/register-attendance";
import { CalificationRegistering } from "./pages/register-califications";
import { CreateCriterion } from "./pages/create-criterion";

export const App = () => {
  const {isLoading, isAuthenticated, getIdTokenClaims } = useAuth0();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfessor, setIsProfessor] = useState(false);
  const [isDocente, setIsDocente] = useState(false);


  // TODO: se debería consultar el rol, del sistema de roles de Auth0, en vez del
  // metadato.
  useEffect(() => {
    const checkRole = async () => {
      if (isAuthenticated) {
        const idTokenClaims = await getIdTokenClaims();
        const roles = idTokenClaims[`${process.env.REACT_APP_AUTH0_AUDIENCE}/roles`];
        if (roles && roles[0] === "Administrador") {
          setIsAdmin(true);
        }
        if (roles && roles[0] === "Docente") {
          setIsDocente(true);
        }
      }
    };
    checkRole();
  }, [isAuthenticated, getIdTokenClaims]);

  if (isLoading) {
    return (
      <div className="page-layout">
        <PageLoader />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" exact component={HomePage} />
      <Route path="/callback" component={CallbackPage} />
      {isDocente && <ProtectedRoute path="/profile" component={HomePageProffesor} />}
      {isAdmin && <ProtectedRoute path="/profile" component={HomePageAdmin} />}
      <ProtectedRoute path="/change-password" component={ChangePasswordForm} />

      {/* TODO: Cuando se implemente la consulta al sistema de roles de Auth0, en vez
        * de obtener el rol desde los metadatos, hacer que las siguientes rutas sea
        * accesibles sólo si el usuario es docente. />}
        */}
      <ProtectedRoute path="/register-attendance" component={AttendanceRegistering} />
      <ProtectedRoute path="/register-califications" component={CalificationRegistering} />

      {isAdmin && <ProtectedRoute path="/create-user" component={CreateUser} />}
      {isAdmin && <ProtectedRoute path="/assign-role" component={AssignRole} />}
      {isAdmin && <ProtectedRoute path="/search-professor" component={SearchProfessor} />}
      {isAdmin && <ProtectedRoute path="/down-user" component={DownUser} />}
      {isAdmin && <ProtectedRoute path="/create-criterion" component={CreateCriterion} />}
      <Route path="*" component={NotFoundPage} />
    </Switch>
  );
};
