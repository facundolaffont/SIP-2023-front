import React from "react";
import { PageLayout } from "../components/page-layout";
import { useAuth0 } from "@auth0/auth0-react";
import { Redirect } from "react-router-dom";

export const HomePage = () => {
  const { isAuthenticated } = useAuth0();

  // Si el usuario ya inició sesión, lo redirigimos automáticamente a su panel (/profile)
  if (isAuthenticated) {
    return <Redirect to="/profile" />;
  }

  return (
    <PageLayout>
    </PageLayout>
  );
};