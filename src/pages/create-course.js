import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import { PageLayout } from "../components/page-layout";

// Estilos.
import "../styles/create-course.css";

// Mensajes por si se corta la red o el back está apagado.
const FALLBACK_ERRORS = {
  "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
  "DEFAULT": "Hubo un problema inesperado."
};

export function CreateCourse() {
  // ESTADOS: Para Auth0
  const { getAccessTokenSilently } = useAuth0();

  // ESTADOS: Para los datos del formulario
  const [commissionId, setComissionId] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear()); // Año actual por defecto
  const [initialDate, setInitialDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ESTADOS: Para manejar la lista de profesores que se van a vincular a la cursada
  const [selectedProfessors, setSelectedProfessors] = useState([]);
  const [currentProfesorSelect, setCurrentProfesorSelect] = useState("");

  // ESTADOS: Para las listas que vienen del Backend (comisiones y profesores)
  const [commissionsList, setCommissionsList] = useState([]);
  const [professorsList, setProfessorsList] = useState([]);

  // ESTADOS: UI
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});


  // EFECTO: Cargar Comisiones y Profesores al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener token Auth0
        const auth0Token = await getAccessTokenSilently()
        // Establezco la configuración de los headers para las peticiones al Backend
        const config = {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        }
        // Preparo las peticiones con la misma configuración (solo cambia la URL)
        const commissionsRequest = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/commission/all`,
          config
        );
        const professorsRequest = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/users/get-all-professors`,
          config
        );
        // Ejecuto ambas peticiones en paralelo
        const [comResponse, profResponse] = await Promise.all([
          commissionsRequest,
          professorsRequest
        ]);
        // Guardo los datos en los estados
        setCommissionsList(comResponse.data);
        setProfessorsList(profResponse.data);
      } catch (error) {
        console.error("Error cargando comisiones o profesores:", error);
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
  }, [getAccessTokenSilently]); // Se ejecuta solo una vez


  // FUNCIÓN: Evaluar si el formulario es válido y bloquear el botón
  const isFormValid = () => {
    if (!String(commissionId).trim()) return false;
    if (!String(initialDate).trim()) return false;
    if (!String(endDate).trim()) return false;

    const numAnio = Number(anio);
    if (!numAnio || numAnio < 2000 || numAnio > 2100) return false;

    // Validar coherencia de fechas (Inicio <= Fin)
    if (new Date(initialDate) > new Date(endDate)) return false;

    const selectedYearStr = String(numAnio);
    if (initialDate.split('-')[0] !== selectedYearStr) return false;
    if (endDate.split('-')[0] !== selectedYearStr) return false;

    return true;
  };

  // EFECTO: Validar fechas en tiempo real para dar feedback visual
  useEffect(() => {
    const errors = {};
    const selectedYearStr = String(anio);
    const numAnio = Number(anio)

    if (numAnio < 0) {
      errors.anio = "El año no puede ser negativo.";
    } else if (numAnio < 2000 || numAnio > 2100) {
      errors.anio = "El año debe estar entre 2000 y 2100.";
    }

    if (initialDate && endDate && new Date(initialDate) > new Date(endDate)) {
      errors.dates = "La fecha de inicio no puede ser mayor a la fecha de fin.";
    }

    if (initialDate && initialDate.split('-')[0] !== selectedYearStr) {
      errors.initialDateYear = `La fecha de inicio debe pertenecer al año ${anio}.`;
    }

    if (endDate && endDate.split('-')[0] !== selectedYearStr) {
      errors.endDateYear = `La fecha de fin debe pertenecer al año ${anio}.`;
    }

    setValidationErrors(errors);
  }, [initialDate, endDate, anio]);

  // HANDLER: Agregar profesor a la lista local
  const handleAddProfessor = () => {
    if (!currentProfesorSelect) return;
    // Evitar duplicados
    if (selectedProfessors.includes(currentProfesorSelect)) return;
    setSelectedProfessors([...selectedProfessors, currentProfesorSelect]);
    setCurrentProfesorSelect("");
  };

  // HANDLER: Quitar profesor de la lista local
  const handleRemoveProfessor = (idToRemove) => {
    setSelectedProfessors(selectedProfessors.filter(id => id !== idToRemove));
  };

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
      commissionId: Number(commissionId),
      anio: Number(anio),
      initialDate: initialDate,
      endDate: endDate,
      professorIds: selectedProfessors
    };

    try {
      // Obtener token Auth0
      const auth0Token = await getAccessTokenSilently()

      // Ejecuto POST
      const response = await axios.post(
        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/add`,
        data,
        {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        }
      );

      // Capturamos el DTO de respuesta
      const createdCourse = response.data;
      console.log("Cursada creada exitosamente en base de datos: ", createdCourse);

      // Mostramos un mensaje de éxito
      setResult(`Cursada (año ${createdCourse.anio}) creada exitosamente para la comisión ${createdCourse.numeroComision} de la asignatura ${createdCourse.nombreAsignatura} (${createdCourse.codigoAsignatura}) de la carrera ${createdCourse.nombreCarrera}`);

      // Limpiar formulario tras éxito
      setSelectedProfessors([]);
      setComissionId("");
      setInitialDate("");
      setEndDate("");
      setAnio(new Date().getFullYear())

    } catch (error) {
      console.error(error);
      setResult('');
      if (error.response) {
        // El servidor respondió
        if (error.response.data && error.response.data.message) {
          // Atrapa excepciones personalizadas
          setError(error.response.data.message);
        } else if (error.response.status === 400) {
          // Atrapa fallos de validación genéricos de Spring (@Valid)
          setError("Los datos enviados son inválidos. Por favor, verifique el formulario.");
        } else {
          setError(FALLBACK_ERRORS["DEFAULT"]);
        }
      } else if (error.request) {
        // La petición salió pero no hubo respuesta (problema de red)
        setError(FALLBACK_ERRORS["NETWORK_ERROR"]);
      } else {
        // Otro tipo de error de Javascript
        setError(FALLBACK_ERRORS["DEFAULT"]);
      }
    }
  };

  if (loading) return <PageLayout><div>Cargando datos...</div></PageLayout>;

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Alta de cursada</h1>
      <form onSubmit={handleSubmit}>

        {/* Comisión */}
        <div className="form-group-full">
          <label htmlFor="commission"><p>Comisión (Carrera - Asignatura - N° comisión)</p></label>
          <select
            id="commission"
            value={commissionId}
            onChange={(e) => {
              setComissionId(e.target.value);
              setResult(""); // Borra el mensaje de éxito
              setError(null); // Borra el error anterior si lo hubiera
            }}
            required
            disabled={commissionsList.length === 0}
          >
            <option value="">
              {commissionsList.length === 0
                ? "No hay comisiones disponibles"
                : "-- Seleccione una comisión --"
              }
            </option>
            {commissionsList.map((com) => (
              <option key={com.id} value={com.id}>
                {com.nombreCarrera || "Sin Carrera"} - {com.nombreAsignatura || "Sin Asignatura"} ({com.codigoAsignatura || "Sin Código"}) - Comisión {com.numero || "Sin Número de Comisión"}
              </option>
            ))}
          </select>
          {commissionsList.length === 0 && (
            <small className="warning-text">Debe crear comisiones antes de dar de alta una cursada</small>
          )}
        </div>

        {/* Año */}
        <div className="form-group-full">
          <label htmlFor="anio"><p>Año de Cursada</p></label>
          <input
            type="number"
            id="anio"
            value={anio}
            onChange={(e) => {
              setAnio(e.target.value);
              setInitialDate("");
              setEndDate("");
              setResult("")
              setError("")
            }}
            required
            min={0}
            max={2100}
          />
          {validationErrors.anio && (
            <span className="validation-error-text">{validationErrors.anio}</span>
          )}
        </div>

        {/* Fechas */}
        <div className="form-row dates-row">
          <div className="input-wrapper">
            <label htmlFor="initialDate"><p>Fecha Inicio</p></label>
            <input
              type="date"
              id="initialDate"
              value={initialDate}
              onChange={(e) => setInitialDate(e.target.value)}
              required
              min={`${anio}-01-01`}
              max={`${anio}-12-31`}
            />
            {validationErrors.initialDateYear && (
              <span className="validation-error-text">{validationErrors.initialDateYear}</span>
            )}
          </div>

          <div className="input-wrapper">
            <label htmlFor="endDate"><p>Fecha Fin</p></label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              min={initialDate || `${anio}-01-01`}
              max={`${anio}-12-31`}
            />
            {validationErrors.endDateYear && (
              <span className="validation-error-text">{validationErrors.endDateYear}</span>
            )}
          </div>
        </div>
        {validationErrors.dates && (
          <p className="msg-error">
            {validationErrors.dates}
          </p>
        )}

        {/* Docentes */}
        <label htmlFor="profesorSelect"><p>Asignar Docentes</p></label>

        <div className="form-row professor-row">
          <select
            id="profesorSelect"
            value={currentProfesorSelect}
            onChange={(e) => {
              setCurrentProfesorSelect(e.target.value)
              setResult("")
              setError(null)
            }}
            className="flex-grow select-professor"
            disabled={professorsList.length === 0}
          >
            <option value="">
              {professorsList.length === 0
                ? "No hay profesores disponibles"
                : "-- Seleccione un docente --"
              }
            </option>
            {professorsList
              .filter(p => !selectedProfessors.includes(String(p.id)))
              .map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre || "Sin Nombre"} ({prof.legajo || "Sin Legajo"}) - {prof.email}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={handleAddProfessor}
            className="btn-add-inline"
            disabled={!currentProfesorSelect}
          >
            Agregar
          </button>
        </div>
        {professorsList.length === 0 && (
          <small className="warning-text">Debe crear docentes si desea vincular docentes a la cursada</small>
        )}

        {/* Lista de docentes a asignar */}
        {selectedProfessors.length > 0 && (
          <div className="assigned-professors-wrapper">
            <ul className="professor-list">
              {selectedProfessors.map(id => {
                const prof = professorsList.find(p => String(p.id) === String(id));
                return (
                  <li key={id} className="professor-item">
                    <span className="prof-name">
                      {prof ? `${prof.nombre || ""} ${prof.apellido || ""} (${prof.legajo}) - ${prof.email}` : id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProfessor(id)}
                      className="btn-remove-item"
                    >
                      Quitar
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <button type="submit" disabled={!isFormValid()}>Crear Cursada</button>

        {error && <p className="msg-error">{error}</p>}
        {result && <p className="msg-success">{result}</p>}
      </form>
    </PageLayout>
  );
}

export default CreateCourse;