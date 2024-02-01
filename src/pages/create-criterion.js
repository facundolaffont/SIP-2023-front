import { useState } from "react";
import { PageLayout } from "../components/page-layout";

export function CreateCriterion() {
  const [criterio, setCriterio] = useState("");
  const [vRegular, setVRegular] = useState("");
  const [vPromovido, setVPromovido] = useState("");

  const handleSubmit = async (event) => {

    event.preventDefault();

    const data = {
      criteria: {id: criterio },
      value_to_regulate: vRegular,
      value_to_promote: vPromovido,
      course: {id: 1}
    };
    
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));

  };

  return (

    <PageLayout>

      <h1 id="page-title" className="content__title">
        Alta de criterio
      </h1>
    
      <form onSubmit={handleSubmit}>

      <label htmlFor="criterio">
        <p>Criterio de Evaluacion</p>
      </label>
    
      <select value={criterio} onChange={(e) => setCriterio(e.target.value)} required>
        <option value="">Seleccione un criterio</option>
        <option value="4">Parciales aprobados</option>
        <option value="8">Parciales recuperados</option>
        <option value="2">Trabajos prácticos aprobados</option>
        <option value="3">Trabajos prácticos recuperados</option>
        <option value="6">Autoevaluaciones aprobadas</option>
        <option value="7">Autoevaluaciones recuperadas</option>
        <option value="1">Asistencias</option>
        <option value="5">Promedio de parciales</option>
      </select>

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

      </form>

    </PageLayout>

  );
}

export default CreateCriterion;
