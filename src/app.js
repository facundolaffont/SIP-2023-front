import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { Route, Switch } from "react-router-dom";
import { PageLoader } from "./components/page-loader";
import { ProtectedRoute } from "./components/protected-route";
import { AdminPage } from "./pages/admin-page";
import { CallbackPage } from "./pages/callback-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProfilePage } from "./pages/profile-page";
import { ProtectedPage } from "./pages/protected-page";
//import { PublicPage } from "./pages/public-page";
import { AltaDocente } from "./pages/alta-docente";
import { BuscarDocente } from "./pages/buscar-docente";
import { ChangePasswordForm } from "./pages/cambiar-password";

export const App = () => {
  const { isLoading } = useAuth0();

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
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/alta-docente" component={AltaDocente} />
      <ProtectedRoute path="/buscar-docente" component={BuscarDocente} />
      <ProtectedRoute path="/protected" component={ProtectedPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/cambiar-password" component={ChangePasswordForm} />
      <Route path="*" component={NotFoundPage} />
    </Switch>
  );
};
