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

export function CreateSubject() {
  // ESTADOS: Auth0
  const { getAccessTokenSilently } = useAuth0();

  // ESTADOS: Formulario
  const [careerId, setCareerId] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // ESTADOS: Datos del Backend
  const [careersList, setCareersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  // ESTADOS: UI
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);

  // EFECTO: Cargar Carreras y Asignaturas al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth0Token = await getAccessTokenSilently();
        const config = {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        };
        const careersReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/career/all`,
          config
        );
        const subjectsReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/subject/all`,
          config
        );
        const [careersResponse, subjectsResponse] = await Promise.all([
          careersReq,
          subjectsReq
        ]);
        setCareersList(careersResponse.data);
        setSubjectsList(subjectsResponse.data);
      } catch (error) {
        console.error("Error cargando datos:", error);
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

  // Obtener los códigos de asignatura ya ocupados
  const codigosOcupados = subjectsList
    .map(subj => Number(subj.codigo))
    .sort((a, b) => a - b);

  // FUNCIÓN: Evaluar si el formulario es válido y bloquear el botón
  const isFormValid = () => {
    if (!String(careerId).trim()) return false;
    if (!String(subjectCode).trim()) return false;
    if (!String(subjectName).trim()) return false;

    const codigoIngresado = Number(subjectCode);
    if (!codigoIngresado || codigoIngresado <= 0) return false;
    if (codigosOcupados.includes(codigoIngresado)) return false;

    return true;
  };

  // VALIDACIÓN EN TIEMPO REAL
  let subjectCodeError = null;
  const codigoIngresado = Number(subjectCode);

  if (subjectCode !== "" && codigoIngresado <= 0) {
    subjectCodeError = "El código de asignatura debe ser mayor o igual a 1.";
  } else if (subjectCode !== "" && codigosOcupados.includes(codigoIngresado)) {
    subjectCodeError = `El código de asignatura ${codigoIngresado} ya está en uso.`;
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
      careerId: Number(careerId),
      subjectCode: Number(subjectCode),
      subjectName: subjectName
    };

    try {
      const auth0Token = await getAccessTokenSilently();
      const response = await axios.post(
        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/subject/add`,
        data,
        {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        }
      );
      const createdSubject = response.data;
      console.log("Asignatura creada exitosamente: ", createdSubject);
      setResult(`Asignatura ${createdSubject.nombre} (${createdSubject.codigo}) creada exitosamente para la carrera ${createdSubject.nombreCarrera}`);

      // Actualizo el estado local agregando la asignatura a la lista
      setSubjectsList(prevSubjects => [
        ...prevSubjects,
        createdSubject
      ]);

      // Limpiar formulario tras el éxito
      setCareerId("");
      setSubjectCode("");
      setSubjectName("");

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
      <h1 id="page-title" className="content__title">Alta de Asignatura</h1>
      <form onSubmit={handleSubmit}>

        {/* Carrera */}
        <div className="form-group-full">
          <label htmlFor="career"><p>Carrera</p></label>
          <select
            id="career"
            value={careerId}
            onChange={(e) => {
              setCareerId(e.target.value);
              setResult("");
              setError(null);
            }}
            required
            disabled={careersList.length === 0}
          >
            <option value="">
              {careersList.length === 0
                ? "No hay carreras disponibles"
                : "-- Seleccione una carrera --"
              }
            </option>
            {careersList.map((career) => (
              <option key={career.id} value={career.id}>
                {career.nombre || "Sin Nombre"}
              </option>
            ))}
          </select>
          {careersList.length === 0 && (
            <small className="warning-text">Debe crear carreras antes de dar de alta una asignatura</small>
          )}
        </div>

        {/* Código de la Asignatura */}
        <div className="form-group-full">
          <label htmlFor="subjectCode">
            <p>
              Código de Asignatura
              {codigosOcupados.length > 0 && ` (Ocupados: ${codigosOcupados.join(', ')})`}
            </p>
          </label>
          <input
            type="number"
            id="subjectCode"
            value={subjectCode}
            onChange={(e) => {
              setSubjectCode(e.target.value);
              setResult("");
              setError(null);
            }}
            required
            min="1"
            disabled={!careerId}
          />
          {subjectCodeError && (
            <span className="validation-error-text">{subjectCodeError}</span>
          )}
        </div>

        {/* Nombre de la Asignatura */}
        <div className="form-group-full">
          <label htmlFor="subjectName"><p>Nombre de la Asignatura</p></label>
          <input
            type="text"
            id="subjectName"
            value={subjectName}
            onChange={(e) => {
              setSubjectName(e.target.value);
              setResult("");
              setError(null);
            }}
            required
            disabled={!careerId}
          />
        </div>

        <button type="submit" disabled={!isFormValid()}>
          Crear Asignatura
        </button>

        {error && <p className="msg-error">Error: {error}</p>}
        {result && <p className="msg-success">{result}</p>}
      </form>
    </PageLayout>
  );
}

export default CreateSubject;