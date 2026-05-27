import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import { PageLayout } from "../components/page-layout";

import "../styles/create-entity.css";

// Mensajes por si se corta la red o el back está apagado.
const FALLBACK_ERRORS = {
  "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
  "DEFAULT": "Hubo un problema inesperado."
};

export function CreateCommission() {
  // ESTADOS: Auth0
  const { getAccessTokenSilently } = useAuth0();

  // ESTADOS: Formulario
  const [subjectId, setSubjectId] = useState("");
  const [comissionNumber, setComissionNumber] = useState("");

  // ESTADOS: Datos del Backend
  const [subjectsList, setSubjectsList] = useState([]);
  const [commissionsList, setCommissionsList] = useState([]);

  // ESTADOS: UI
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);


  // EFECTO: Cargar Asignaturas y Comisiones al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth0Token = await getAccessTokenSilently()
        const config = {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        }
        const subjectsReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/subject/all`,
          config
        );
        const comissionsReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/commission/all`,
          config
        );
        const [subResponse, comResponse] = await Promise.all([
          subjectsReq,
          comissionsReq
        ]);
        setSubjectsList(subResponse.data);
        setCommissionsList(comResponse.data);
      } catch (error) {
        console.error("Error cargando comisiones o asignaturas:", error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else if (error.request) {
          setError(FALLBACK_ERRORS["NETWORK_ERROR"]);
        } else {
          setError(FALLBACK_ERRORS["DEFAULT"]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAccessTokenSilently]);


  //Obtener los números de comisión ya ocupados para la asignatura seleccionada
  const numerosOcupados = commissionsList
    .filter(com => String(com.idAsignatura) === String(subjectId))
    .map(com => Number(com.numero))
    .sort((a, b) => a - b); // Ordenamos de menor a mayor

  // FUNCIÓN: Evaluar si el formulario es válido y bloquear el botón
  const isFormValid = () => {
    if (!String(subjectId).trim()) return false;
    if (!String(comissionNumber).trim()) return false;

    const numeroIngresado = Number(comissionNumber);
    if (!numeroIngresado || numeroIngresado <= 0) return false;
    if (numerosOcupados.includes(numeroIngresado)) return false;

    return true;
  };

  // VALIDACIÓN EN TIEMPO REAL: Calculamos el error directamente en tiempo de renderizado
  // Esto evita usar `useEffect` y `useState`, y nunca causa re-renders en loop.
  let comissionNumberError = null;
  const numeroIngresado = Number(comissionNumber);

  if (comissionNumber !== "" && numeroIngresado <= 0) {
    comissionNumberError = "El número de comisión debe ser mayor a 0.";
  } else if (comissionNumber !== "" && numerosOcupados.includes(numeroIngresado)) {
    comissionNumberError = `El número de comisión ${numeroIngresado} ya está en uso para esta asignatura.`;
  }


  // HANDLER: Enviar formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setResult("");

    if (!isFormValid()) {
      setError("Por favor, complete todos los campos correctamente");
      return;
    }

    const data = {
      subjectId: Number(subjectId),
      commissionNumber: Number(comissionNumber)
    };

    try {
      const auth0Token = await getAccessTokenSilently();
      // Ejecuto POST
      const response = await axios.post(
        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/commission/add`,
        data,
        {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        }
      );
      // Capturamos el DTO de respuesta
      const createdCommission = response.data;
      console.log("Comisión creada exitosamente: ", createdCommission);
      // Si se llego acá, fue exitosa el alta
      setResult(`Comisión ${createdCommission.numero} creada exitosamente para la asignatura ${createdCommission.nombreAsignatura} (${createdCommission.codigoAsignatura}) de la carrera ${createdCommission.nombreCarrera}`);

      // Actualizo estado local, agregando la nueva comisión a la lista 
      setCommissionsList(prevCommissions => [
        ...prevCommissions,
        createdCommission
      ]);

      // Limpiar formulario tras éxitoo
      setComissionNumber("");
      setSubjectId("")

    } catch (error) {
      console.error(error);
      setResult('');
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
    }
  };

  if (loading) return <PageLayout><div>Cargando datos...</div></PageLayout>;

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Alta de Comisión</h1>
      <form onSubmit={handleSubmit}>

        {/* Asignatura */}
        <div className="form-group-full">
          <label htmlFor="subject"><p>Asignatura (Carrera - Asignatura)</p></label>
          <select
            id="subject"
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setComissionNumber(""); // Limpiar el número si cambia de materia
              setError(null);
            }}
            required
            disabled={subjectsList.length === 0}
          >
            <option value="">
              {subjectsList.length === 0
                ? "No hay asignaturas disponibles"
                : "-- Seleccione una asignatura --"
              }
            </option>
            {subjectsList.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.nombreCarrera || "Sin Carrera"} - {subject.nombre || "Sin Nombre"} ({subject.codigo || "Sin Código"})
              </option>
            ))}
          </select>
          {subjectsList.length === 0 && (
            <small className="warning-text">Debe crear asignaturas antes de dar de alta una comisión</small>
          )}
        </div>

        {/* Número de Comisión */}
        <div className="form-group-full">
          <label htmlFor="comissionNumber">
            <p>
              Número de Comisión
              {subjectId && (
                numerosOcupados.length > 0
                  ? ` (Números ocupados: ${numerosOcupados.join(', ')})`
                  : ` (Todos los números están libres)`
              )}
            </p>
          </label>
          <input
            type="number"
            id="comissionNumber"
            value={comissionNumber}
            onChange={(e) => {
              setComissionNumber(e.target.value);
              setResult(""); // Borra el mensaje de éxito
              setError(null); // Limpiamos el error visual si el usuario empieza a tipear de nuevo
            }}
            required
            min="1"
            disabled={!subjectId} // Se bloquea si no eligió materia
          />
          {comissionNumberError && (
            <span className="validation-error-text">{comissionNumberError}</span>
          )}
        </div>

        <button type="submit" disabled={!isFormValid()}>
          Crear Comisión
        </button>

        {error && <p className="msg-error">{error}</p>}
        {result && <p className="msg-success">{result}</p>}
      </form>
    </PageLayout>
  );
}

export default CreateCommission;