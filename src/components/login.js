// Componentes externos.
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const Login = () => {

  const { loginWithRedirect } = useAuth0();

  // Iniciar Auth0 automáticamente.
  React.useEffect(() => {
    loginWithRedirect({
      appState: {
        returnTo: "/profile",
      },
      authorizationParams: {
        prompt: "login",
      },
    });
  }, [loginWithRedirect]);

  return <></>;
  
};

export default Login;