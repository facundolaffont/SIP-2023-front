import { useAuth0 } from "@auth0/auth0-react";
import React,  {useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { PageLoader } from "./components/page-loader";
import { ProtectedRoute } from "./components/protected-route";
import { CallbackPage } from "./pages/callback-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProfilePage } from "./pages/profile-page";
import { CreateProfessor } from "./pages/create-professor";
import { SearchProfessor } from "./pages/search-professor";
import { ChangePasswordForm } from "./pages/change-password";
import { DownUser } from "./pages/down-user";

export const App = () => {
  const { isLoading } = useAuth0();
  const { isAuthenticated, getIdTokenClaims } = useAuth0();
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
      {isAdmin && <>
        <ProtectedRoute path="/create-professor" component={CreateProfessor} />
        <ProtectedRoute path="/search-professor" component={SearchProfessor} />
        <ProtectedRoute path="/down-user" component={DownUser} />
      </> }
      <Route path="*" component={NotFoundPage} /> {/* TODO: no lo muestra, porque está bloqueado
                                                      por <ShowAdminRoutes /> */}
    </Switch>
  );
};
