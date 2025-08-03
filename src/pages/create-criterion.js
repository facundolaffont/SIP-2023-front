import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { PageLayout } from "../components/page-layout";
import { useSelectedCourse } from "../contexts/course/course-provider.js";

export function CreateCriterion() {
  const [criterio, setCriterio] = useState("");
  const [vRegular, setVRegular] = useState("");
  const [vPromovido, setVPromovido] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /** @type {CourseDTO} */ const course = useSelectedCourse(false);
  const history = useHistory();

  // Redirige a la página de selección de cursada, si todavía no se seleccionó una,
  // o si se actualiza la página, ya que se pierde el contexto de la selección que
  // se había hecho.
  useEffect(() => {

      if (!course) history.push('/profile?course-missing');

  }, []);

  const handleCriterioChange = (e) => {
    setCriterio(e.target.value);
    setSubmitMessage("");
    setErrorMessage("");
    // Verificar el tipo de criterio seleccionado y mostrar un mensaje informativo
    if (e.target.value === "5" || e.target.value === "10") {
      setInfoMessage("Ingrese números enteros de 1 a 10 para este criterio.");
    } else {
      setInfoMessage("Ingrese valores entre 0 y 100 para este criterio. Se evaluará en forma de porcentaje.");
    }
  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    const regularValue = parseFloat(vRegular);
    const promovidoValue = parseFloat(vPromovido);

    let isValid = true;

    // Verificar el tipo de criterio seleccionado y validar los valores ingresados
    if (criterio === "5" || criterio === "10") { // Promedio de parciales o Integrador
      if ((regularValue < 1 || regularValue > 10 || promovidoValue < 0 || promovidoValue > 10) || (regularValue > promovidoValue)){
        isValid = false;
      }
    } else {
        if (criterio === "4" || criterio === "2" || criterio === "6" || criterio === "1") {
            if ((regularValue < 0 || regularValue > 100 || promovidoValue < 0 || promovidoValue > 100) || (regularValue > promovidoValue) ) {
              isValid = false;
            } 
        }
        else {
          if ((regularValue < 0 || regularValue > 100 || promovidoValue < 0 || promovidoValue > 100) || (promovidoValue > regularValue)){
            isValid = false;
          }
        }
      }

    if (!isValid) {
      setErrorMessage("Valores incorrectos. Por favor, ingrese valores válidos.");
      return;
    } 

    const data = {
      criteria: {id: criterio },
      value_to_regulate: vRegular,
      value_to_promote: vPromovido,
      course: {id: course.getId()}
    };
    
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al cargar. Por favor, inténtalo de nuevo.");
        }
        setErrorMessage(""); // Limpiar cualquier mensaje de error anterior
        setSubmitMessage("¡Carga exitosa!");
      })
      .then((data) => console.log(data))
      .catch((error) => {
        console.error(error);
        setSubmitMessage(""); // Limpiar cualquier mensaje de éxito anterior
        setErrorMessage("Error al cargar. Por favor, inténtalo de nuevo.");
      });
  };

  return (

    <PageLayout>

      <h1 id="page-title" className="content__title">
        Crear criterio de evaluación
      </h1>
    
      <form onSubmit={handleSubmit}>

      <label htmlFor="criterio">
        <p>Criterio de Evaluacion</p>
      </label>
    
      <select value={criterio} onChange={handleCriterioChange} required>
          <option value="">Seleccione un criterio</option>
          <option value="4">Parciales aprobados</option>
          <option value="8">Parciales recuperados</option>
          <option value="2">Trabajos prácticos aprobados</option>
          <option value="3">Trabajos prácticos recuperados</option>
          <option value="6">Autoevaluaciones aprobadas</option>
          <option value="7">Autoevaluaciones recuperadas</option>
          <option value="1">Asistencias</option>
          <option value="5">Promedio de parciales</option>
          <option value="9">Correlativas</option>
          <option value="10">Integrador</option>
        </select>

      {infoMessage && <p style={{ color: "blue" }}>{infoMessage}</p>}

      <label htmlFor="valorRegular">
        <p>Valor para regular</p>
      </label>
      
      <input
        type="number"
        value={vRegular}
        onChange={(e) => setVRegular(e.target.value)}
        required
      />

      <label htmlFor="valorPromovido">
        <p>Valor para promovido</p>
      </label>

      <input
        type="number"
        value={vPromovido}
        onChange={(e) => setVPromovido(e.target.value)}
        required
      />

      <button type="submit">Cargar</button>
      {submitMessage && <p style={{ color: "blue" }}>{submitMessage}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </form>

    </PageLayout>

  );
}

export default CreateCriterion;
