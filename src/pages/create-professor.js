import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { PageLayout } from "../components/page-layout";

// Mensajes por si se corta la red o el back está apagado.
const FALLBACK_ERRORS = {
  "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
  "DEFAULT": "Hubo un problema inesperado."
};

export function CreateProfessor() {
  // ESTADOS: Auth0
  const { getAccessTokenSilently } = useAuth0();

  // ESTADOS: Formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [legajo, setLegajo] = useState("");

  // ESTADOS: UI
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // VALIDACIÓN DECLARATIVA DE CONTRASEÑA (React-way)
  const isPasswordLongEnough = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const isPasswordValid = isPasswordLongEnough && hasUppercase && hasLowercase && hasDigit;

  // HANDLER: Enviar formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setResult("");

    // Validamos antes de enviar
    if (!isPasswordValid) {
      setError({ message: "La contraseña no cumple con los requisitos mínimos." });
      return;
    }

    setIsSubmitting(true);

    // Armamos el payload (asegurando que legajo sea numérico como indica la BD)
    const data = {
      email: email,
      password: password,
      rol: "docente",
      nombre: nombre,
      apellido: apellido,
      legajo: Number(legajo),
    };

    try {
      // Obtener token Auth0
      const auth0Token = await getAccessTokenSilently();

      // Ejecutar POST
      const response = await axios.post(
        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/users/add-professor`,
        data,
        {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        }
      );

      // Si se llega acá, fue exitosa el alta
      setResult("Docente " + response.data.nombre + " " + response.data.apellido + " creado exitosamente.");

      // Limpiar formulario tras el éxito
      setEmail("");
      setPassword("");
      setNombre("");
      setApellido("");
      setLegajo("");

    } catch (error) {
      console.error(error);
      setResult("");

      // Manejo de errores específico de Axios
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else if (error.response.status === 400) {
          setError("Los datos enviados son inválidos. Por favor, verifique el formulario.");
        } else {
          setError(FALLBACK_ERRORS["DEFAULT"]);
        }
      } else if (error.request) {
        setError(FALLBACK_ERRORS["NETWORK_ERROR"]);
      } else {
        setError(FALLBACK_ERRORS["DEFAULT"]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función auxiliar para renderizar el color de los requisitos
  const getRequirementStyle = (isValid) => ({
    color: password.length === 0 ? "gray" : isValid ? "green" : "red",
    transition: "color 0.3s ease"
  });

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">
        Alta de Docente
      </h1>
      <form onSubmit={handleSubmit}>

        {/* Email */}
        <div className="form-group-full">
          <label htmlFor="email"><p>Correo electrónico</p></label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); setResult(""); }}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div className="form-group-full">
          <label htmlFor="password"><p>Contraseña</p></label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); setResult(""); }}
            required
            disabled={isSubmitting}
          />

          {/* Requisitos de contraseña reactivos */}
          <div id="password-requirements" style={{ marginTop: '10px', fontSize: '0.9em' }}>
            <p><strong>Requisitos de contraseña:</strong></p>
            <p style={getRequirementStyle(isPasswordLongEnough)}>
              • Debe tener al menos 8 caracteres
            </p>
            <p style={getRequirementStyle(hasUppercase)}>
              • Debe contener al menos una letra mayúscula
            </p>
            <p style={getRequirementStyle(hasLowercase)}>
              • Debe contener al menos una letra minúscula
            </p>
            <p style={getRequirementStyle(hasDigit)}>
              • Debe contener al menos un número
            </p>
          </div>
        </div>

        {/* Nombre */}
        <div className="form-group-full">
          <label htmlFor="nombre"><p>Nombre</p></label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(null); setResult(""); }}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Apellido */}
        <div className="form-group-full">
          <label htmlFor="apellido"><p>Apellido</p></label>
          <input
            type="text"
            id="apellido"
            value={apellido}
            onChange={(e) => { setApellido(e.target.value); setError(null); setResult(""); }}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Legajo */}
        <div className="form-group-full">
          <label htmlFor="legajo"><p>Legajo</p></label>
          <input
            type="number"
            id="legajo"
            value={legajo}
            onChange={(e) => { setLegajo(e.target.value); setError(null); setResult(""); }}
            required
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email || !password || !nombre || !apellido || !legajo || !isPasswordValid}
        >
          {isSubmitting ? "Registrando..." : "Registrar Docente"}
        </button>

        {/* Mensajes de feedback unificados */}
        {error && <p className="msg-error">Error: {error.message}</p>}
        {result && <p className="msg-success">{result}</p>}

      </form>
    </PageLayout>
  );
}

export default CreateProfessor;