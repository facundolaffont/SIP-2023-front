// Componentes externos.
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import { Helmet } from 'react-helmet';

// Componentes internos.
import { PageLoader } from "./components/page-loader";
import { ProtectedRoute } from "./components/protected-route";
import { CallbackPage } from "./pages/callback-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { HomePageProfessor } from "./pages/home-page-professor";
import { HomePageAdmin } from "./pages/home-page-admin";
import { HomePageSuperAdmin } from "./pages/home-page-super-admin";
import { CreateProfessor } from "./pages/create-professor";
import { CreateUser } from "./pages/create-user";
import { SearchProfessor } from "./pages/search-professor";
import { SearchUser } from "./pages/search-user";
import { ChangePasswordForm } from "./pages/change-password";
import { DownProfessor } from "./pages/down-professor";
import { DownUser } from "./pages/down-user";
import { AssignRole } from "./pages/assign-role";
import { AttendanceRegistering } from "./pages/register-attendance";
import { CourseAttendanceRegistering } from "./pages/register-course-attendance";
import { CalificationRegistering } from "./pages/register-califications";
import { StudentRegistering } from "./pages/register-students";
import { FinalCondition } from "./pages/final-condition";
import { CreateCriterion } from "./pages/create-criterion";
import { ModificateCriterion } from "./pages/modificate-criterion";
import { EventsBulkRegistering } from "./pages/register-events-bulk";
import { SearchStudent } from "./pages/search-student";
import { SearchEvent } from "./pages/search-event";
import { ListCourseStudents } from "./pages/list-course-students";
import { ListCourseEvents } from "./pages/list-course-events";
import { ShowEventsSummary } from "./pages/show-events-summary";
import { ShowAllEventsRegisters } from "./pages/show-all-events-registers";

export const App = () => {
    const { isLoading, isAuthenticated, getIdTokenClaims } = useAuth0();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProfessor, setIsProfessor] = useState(false);
    const [isCheckingRoles, setIsCheckingRoles] = useState(true);

    // Determina el rol del usuario.
    useEffect(() => {
        const checkRole = async () => {
            try {
                if (isAuthenticated) {
                    const idTokenClaims = await getIdTokenClaims();
                    const roles = idTokenClaims[`${process.env.REACT_APP_AUTH0_AUDIENCE}/roles`];
                    
                    setIsSuperAdmin(roles?.includes("SuperAdministrador") || false);
                    setIsAdmin(roles?.includes("Administrador") || false);
                    setIsProfessor(roles?.includes("Docente") || false);
                } else {
                    setIsSuperAdmin(false);
                    setIsAdmin(false);
                    setIsProfessor(false);
                }
            } catch (error) {
                console.error("Error checking roles:", error);
            } finally {
                setIsCheckingRoles(false);
            }
        };
        
        if (!isLoading) {
            checkRole();
        }
    }, [isAuthenticated, getIdTokenClaims, isLoading]);

    // Muestra un ícono de carga mientras se verifica la autenticación o los roles.
    if (isLoading || isCheckingRoles) {
        return (
            <div className="page-layout">
                <PageLoader />
            </div>
        );
    }

    return (
        <div className="App"> {/* Este div es necesario para utilizar el componente Helmet. */}
            <Helmet>
                <title>SPGDA</title>
                <meta property="og:title" content="SPGDA" />
                <meta property="og:description" content="Sistema para la Gestión de Asignaturas." />
                <meta property="og:url" content="https://spgda.fl.com.ar/" />
            </Helmet>
            <Switch>
                
                {/* Rutas públicas. */}
                <Route path="/" exact component={HomePage} />
                <Route path="/callback" component={CallbackPage} />
                <ProtectedRoute path="/change-password" component={ChangePasswordForm} />

                {/* Rutas para docentes. */}
                {isProfessor && <ProtectedRoute path="/profile" component={HomePageProfessor} />}
                {isProfessor && <ProtectedRoute path="/register-attendance" component={AttendanceRegistering} />}
                {isProfessor && <ProtectedRoute path="/register-course-attendance" component={CourseAttendanceRegistering} />}
                {isProfessor && <ProtectedRoute path="/register-califications" component={CalificationRegistering} />}
                {isProfessor && <ProtectedRoute path="/register-students" component={StudentRegistering} />}
                {isProfessor && <ProtectedRoute path="/register-events-bulk" component={EventsBulkRegistering} />}
                {isProfessor && <ProtectedRoute path="/final-condition" component={FinalCondition} />}
                {isProfessor && <ProtectedRoute path="/modificate-criterion" component={ModificateCriterion} />}
                {isProfessor && <ProtectedRoute path="/search-student" component={SearchStudent} />}
                {isProfessor && <ProtectedRoute path="/search-event" component={SearchEvent} />}
                {isProfessor && <ProtectedRoute path="/show-all-events-registers" component={ShowAllEventsRegisters} />}
                {isProfessor && <ProtectedRoute path="/create-criterion" component={CreateCriterion} />}
                {isProfessor && <ProtectedRoute path="/list-course-students" component={ListCourseStudents} />}
                {isProfessor && <ProtectedRoute path="/list-course-events" component={ListCourseEvents} />}
                {isProfessor && <ProtectedRoute path="/show-events-summary" component={ShowEventsSummary} />}

                {/* Rutas para administradores. */}
                {isAdmin && <ProtectedRoute path="/profile" component={HomePageAdmin} />}
                {isAdmin && <ProtectedRoute path="/create-professor" component={CreateProfessor} />}
                {isAdmin && <ProtectedRoute path="/search-professor" component={SearchProfessor} />}
                {isAdmin && <ProtectedRoute path="/down-professor" component={DownProfessor} />}

                {/* Rutas para súper administradores. */}
                {isSuperAdmin && <ProtectedRoute path="/profile" component={HomePageSuperAdmin} />}
                {isSuperAdmin && <ProtectedRoute path="/create-user" component={CreateUser} />}
                {isSuperAdmin && <ProtectedRoute path="/assign-role" component={AssignRole} />}
                {isSuperAdmin && <ProtectedRoute path="/search-user" component={SearchUser} />}
                {isSuperAdmin && <ProtectedRoute path="/down-user" component={DownUser} />}

                {/* Dirección para el resto de las rutas. */}
                <Route path="*" component={NotFoundPage} />

            </Switch>
        </div>
    );
};