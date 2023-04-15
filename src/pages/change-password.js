import auth0 from "auth0-js";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useState } from "react";
import { PageLayout } from "../components/page-layout";
import { useEffect } from "react/cjs/react.development";

export const ChangePasswordForm = () => {
  // Se obtienen tres parámetros de un objeto que implementa la interfaz
  // Auth0ContextInterface<TUser>:
  // * La propiedad user es opcional, y contiene información sobre el usuario.
  // * isAuthenticated determina si se logueó o no el usuario.
  // * getIdTokenClaims permite obtener, si existe, el token ID del usuario actual.
  const { user, isAuthenticated} = useAuth0();

  // La variable email será actualizada con el mail del usuario, si se pudo obtener,
  // a través de la función setEmail.
  const [email, setEmail] = useState(null);

  // Se utiliza finalMessage para generar tags HTML que informen al usuario de los
  // resultados del procesamiento.
  const [finalMessage, setFinalMessage] = useState("");

  useEffect(() => {
    const getUserMail = () => {

      // Si el usuario está logueado y se pudieron obtener sus datos,
      // se actualiza la variable email.
      debugger;
      if (isAuthenticated && typeof user.email !== "undefined") {
        debugger;
        setEmail(user.email);
      }

      // Función de limpieza.
      return () => {
        debugger;
        setEmail(null);
      };

    };
    getUserMail();
  }, [user, isAuthenticated, setEmail]);

  // Obtiene el manejador que permitirá enviar la petición de
  // cambio de mail a Auth0.
  const auth0WebAuth = new auth0.WebAuth({
    domain: process.env.REACT_APP_AUTH0_DOMAIN,
    clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
  });

  // Intenta realizar el envío del mail, a la casilla del usuario, para que pueda
  // realizar el cambio de mail, y actualiza el contenido del sitio, ya sea si se pudo
  // enviar el mail o no.
  const processSubmit = async (event) => {
    event.preventDefault();
    debugger;
    auth0WebAuth.changePassword(
      {
        client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
        email: email,
        connection: process.env.REACT_APP_DB_CONNECTION,
      },
      (err, resp) => {
        if (err) {
          console.log(err.message);
          setFinalMessage(
            "No se pudo enviar el mail. Intente nuevamente más tarde, o contáctese con su administrador."
          );
        } else {
          console.log(resp);
          setFinalMessage(
            "Se envío el mail para el cambio de contraseña a su casilla. Por favor, verifíquela."
          );
        }
      }
    );
  };

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Cambio de contraseña </h1>
      <form onSubmit={processSubmit}>
        <button type="submit">Solicitar cambio de contraseña</button>
        {<p>{finalMessage}</p>}
      </form>
      
    </PageLayout>
  );
};
