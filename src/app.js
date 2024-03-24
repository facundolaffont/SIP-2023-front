import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { PageLoader } from "./components/page-loader";
import { ProtectedRoute } from "./components/protected-route";
import { CallbackPage } from "./pages/callback-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { HomePageProfessor } from "./pages/home-page-professor";
import { HomePageAdmin } from "./pages/home-page-admin";
import { CreateUser } from "./pages/create-user";
import { SearchProfessor } from "./pages/search-professor";
import { ChangePasswordForm } from "./pages/change-password";
import { DownUser } from "./pages/down-user";
import { AssignRole } from "./pages/assign-role";
import { AttendanceRegistering } from "./pages/register-attendance";
import { CalificationRegistering } from "./pages/register-califications";
import { StudentRegistering } from "./pages/register-students";
import { CourseStudentRegistering } from "./pages/register-students-in-course";
import { FinalCondition } from "./pages/final-condition";
import { CreateCriterion } from "./pages/create-criterion";
import { ModificateCriterion } from "./pages/modificate-criterion";
import { EventRegistering } from "./pages/register-events";
import { CriterionMenu } from './pages/criterion-menu';
import { SearchStudent } from "./pages/search-student";



export const App = () => {
    const { isLoading, isAuthenticated, getIdTokenClaims } = useAuth0();
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

    // Muestra el ícono de carga, si todavía no se resolvieron las llamadas de Auth0.
    if (isLoading) {
        return (
            <div className="page-layout">
                <PageLoader />
            </div>
        );
    }

    return (
        <Switch>
            
            {/* Rutas públicas. */}
            <Route path="/" exact component={HomePage} />
            <Route path="/callback" component={CallbackPage} />
            <ProtectedRoute path="/change-password" component={ChangePasswordForm} />
            {/* Rutas para docentes. */}
            {isProfessor && <ProtectedRoute path="/profile" component={HomePageProfessor} />}
            {isProfessor && <ProtectedRoute path="/register-attendance" component={AttendanceRegistering} />}
            {isProfessor && <ProtectedRoute path="/register-califications" component={CalificationRegistering} />}
            {isProfessor && <ProtectedRoute path="/register-students-in-course" component={CourseStudentRegistering} />}
            {isProfessor && <ProtectedRoute path="/register-students" component={StudentRegistering} />}
            {isProfessor && <ProtectedRoute path="/register-event" component={EventRegistering} />}
            {isProfessor && <ProtectedRoute path="/final-condition" component={FinalCondition} />}
            {isProfessor && <ProtectedRoute path="/modificate-criterion" component={ModificateCriterion} />}
            {isProfessor && <ProtectedRoute path="/search-student" component={SearchStudent} />}

            {/* Rutas para administradores. */}
            {isAdmin && <ProtectedRoute path="/profile" component={HomePageAdmin} />}
            {isAdmin && <ProtectedRoute path="/create-user" component={CreateUser} />}
            {isAdmin && <ProtectedRoute path="/assign-role" component={AssignRole} />}
            {isAdmin && <ProtectedRoute path="/search-professor" component={SearchProfessor} />}
            {isAdmin && <ProtectedRoute path="/down-user" component={DownUser} />}
            {isAdmin && <ProtectedRoute path="/create-criterion" component={CreateCriterion} />}

            {/* Dirección para el resto de las rutas. */}
            <Route path="*" component={NotFoundPage} />

        </Switch>
    );
};
