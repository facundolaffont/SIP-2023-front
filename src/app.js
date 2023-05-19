import { useAuth0 } from "@auth0/auth0-react";
import React,  {useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { PageLoader } from "./components/page-loader";
import { ProtectedRoute } from "./components/protected-route";
import { CallbackPage } from "./pages/callback-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProfilePage } from "./pages/profile-page";
import { CreateUser } from "./pages/create-user";
import { SearchProfessor } from "./pages/search-professor";
import { ChangePasswordForm } from "./pages/change-password";
import { DownUser } from "./pages/down-user";
import { AssignRole } from "./pages/assign-role";
import { AttendanceRegistering } from "./pages/register-attendance";
import { CreateCriterion } from "./pages/create-criterion";

export const App = () => {
  const { isLoading, isAuthenticated, getIdTokenClaims } = useAuth0();
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
      <ProtectedRoute path="/change-password" component={ChangePasswordForm} />
      <ProtectedRoute path="/register-attendance" component={AttendanceRegistering} />
      {isAdmin && <ProtectedRoute path="/create-user" component={CreateUser} />}
      {isAdmin && <ProtectedRoute path="/assign-role" component={AssignRole} />}
      {isAdmin && <ProtectedRoute path="/search-professor" component={SearchProfessor} />}
      {isAdmin && <ProtectedRoute path="/down-user" component={DownUser} />}
      {isAdmin && <ProtectedRoute path="/create-criterion" component={CreateCriterion} />}
      <Route path="*" component={NotFoundPage} />
    </Switch>
  );
};
