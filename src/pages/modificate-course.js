import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react"; 
import axios from 'axios';
import { useParams, useHistory } from "react-router-dom";
import { PageLayout } from "../components/page-layout";

// Reusamos los estilos de crear cursada porque la estructura es igual
import "../styles/create-course.css";

// Diccionario de errores
const ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": "Ocurrió un error en los servidores al cargar los datos de la cursada. Intente en unos minutos.",
    "NETWORK_ERROR": "No se pudo conectar con el servidor. Verifique su conexión a internet.",
    "DEFAULT": "Hubo un problema inesperado al cargar los datos."
};

export function ModificateCourse() {
  // ESTADOS: Para Auth0
  const { getAccessTokenSilently } = useAuth0();

  // ESTADOS: Para redirigir
  const history = useHistory(); 

  // ESTADOS: Para obtener el ID de la cursada a modificar (desde la URL)
  const { id } = useParams();
  
  // ESTADOS: Para los datos del formulario
  const [commissionId, setComissionId] = useState("");
  const [anio, setAnio] = useState("");
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


  // EFECTO: Cargar CURSADA ACTUAL, Comisiones y Profesores
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener token Auth0
        const auth0Token = await getAccessTokenSilently()
        .then(response => response)
        .catch(error => {throw error});

        // Establezco la configuración de los headers para las peticiones al Backend
        const config = {
          headers: {
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}`,
          }
        };

        // Preparo las peticiones con la misma configuración (solo cambia la URL)
        const courseReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get`,
          {
            config,
            params: {
              id: id
            },
          }
        );
        
        const courseProfessorsReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/get-professors`,
          {
            config,
            params: {
              id: id
            },
          }
        );

        const commissionsReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/commission/all`,
          config
        );
        const professorsReq = axios.get(
          `${process.env.REACT_APP_API_SERVER_URL}/api/v1/users/get-all-professors`, 
          config
        );
        
        // Ejecuto las peticiones en paralelo
        const [comRes, profRes, courseRes, courseProfsRes] = await Promise.all([
          commissionsReq, 
          professorsReq, 
          courseReq,
          courseProfessorsReq
        ]);

        setCommissionsList(comRes.data);
        setProfessorsList(profRes.data);


        // 3. Relleno el formulario con los datos de la cursada
        const courseData = courseRes.data;
        
        setComissionId(courseData.comision?.id || "");
        setAnio(courseData.anio);
        
        // Formateo de fechas: Cortamos la parte de la hora (T) para que el input date la acepte
        if (courseData.fechaInicio) setInitialDate(courseData.fechaInicio);
        if (courseData.fechaFin) setEndDate(courseData.fechaFin);
        
        // Extraemos solo los IDs de los profesores ya asignados
        const profesoresVinculados = courseProfsRes.data;
        if (profesoresVinculados && Array.isArray(profesoresVinculados)) {
          const existingProfIds = profesoresVinculados.map(p => String(p.id));
          setSelectedProfessors(existingProfIds);
        }

      } catch (error) {
        console.error("Error cargando datos:", error);
      
        const errorCode = error.response?.data?.errorCode;
        if (errorCode) {
            setError(ERROR_MESSAGES[errorCode] || ERROR_MESSAGES["DEFAULT"]);
        } else if (error.request) {
            setError(ERROR_MESSAGES["NETWORK_ERROR"]);
        } else {
            setError(ERROR_MESSAGES["DEFAULT"]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchData();
    }
  }, [id, getAccessTokenSilently]);


  // HANDLERS Agregar profesor a la lista local
  const handleAddProfessor = () => {
    if (!currentProfesorSelect) return;
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

    const dataToUpdate = {
      id: Number(id), // Mandamos el ID
      commissionId: Number(commissionId),
      anio: Number(anio),
      initialDate: initialDate,
      endDate: endDate,
      professorIds: selectedProfessors
    };

    try {
      // Obtener token Auth0
      const auth0Token = await getAccessTokenSilently()
      .then(response => response)
      .catch(error => {throw error});
      
      // Ejecuto PUT
      await axios.put(
        `${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/update`,
        dataToUpdate,
        {
          headers: { 
            "Host": "back-service.default.svc.cluster.local",
            Authorization: `Bearer ${auth0Token}` 
          }
        }
      );

      // Si se llego acá, fue exitosa la modificación
      setResult('Cursada modificada exitosamente');
      
      // Redirigir al listado usando HISTORY
      setTimeout(() => {
          history.push("/list-courses");
      }, 1500);

    } catch (error) {
      console.error(error);
      //Manejo de errores específico de Axios
      if (error.response) {
        // El servidor respondió con un código de error
        setError(error.response.data || 'Error al modificar la cursada');
      } else {
        // Otro tipo de error
        setError(error.message);
      }
    }
  };

  if (loading) return <PageLayout><div>Cargando datos...</div></PageLayout>;

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Modificar Cursada (ID: {id})</h1>
      
      <form onSubmit={handleSubmit}>
        
        {/* Comisión */}
        <div className="form-group-full">
            <label htmlFor="commission"><p>Comisión (Carrera - Asignatura - N° comisión)</p></label>
            <select
                id="commission"
                value={commissionId}
                onChange={(e) => setComissionId(e.target.value)}
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
                        {com.nombreCarrera || "Sin Carrera"} - {com.nombreAsignatura || "Sin Asignatura"} ({com.codigoAsignatura || "Sin Código"}) - Comisión {com.numero || "Sin Número"}
                    </option>
                ))}
            </select>
        </div>

        {/* Año */}
        <div className="form-group-full">
            <label htmlFor="anio"><p>Año de Cursada</p></label>
            <input
                type="number"
                id="anio"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                required
                min="2000"
                max="2100"
            />
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
                />
            </div>
            <div className="input-wrapper">
                <label htmlFor="endDate"><p>Fecha Fin</p></label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                />
            </div>
        </div>

        {/* Docentes */}
        <label htmlFor="profesorSelect"><p>Asignar Docentes</p></label>

        <div className="form-row professor-row">
            <select
                id="profesorSelect"
                value={currentProfesorSelect}
                onChange={(e) => setCurrentProfesorSelect(e.target.value)}
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

        {/* Botones de acción */}
        <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
            <button 
              type="submit"
              style={{flex: 1}}
              onClick={handleSubmit}
            >
              Guardar Cambios
            </button>
            
            {/* Botón CANCELAR usando history.push */}
            <button 
                type="button" 
                onClick={() => history.push("/list-courses")} 
                style={{flex: 1, backgroundColor: '#6c757d'}}
            >
                Cancelar
            </button>
        </div>
        
        {error && <p className="msg-error">{error}</p>}
        {result && <p className="msg-success">{result}</p>}
      </form>
    </PageLayout>
  );
}

export default ModificateCourse;