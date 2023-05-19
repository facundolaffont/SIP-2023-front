import { useState } from "react";
import { PageLayout } from "../components/page-layout";

export function CreateCriterion() {
  const [criterio, setCriterio] = useState("");
  const [vRegular, setVRegular] = useState("");
  const [vPromovido, setVPromovido] = useState("");
  const [idAsignatura, setIdAsignatura] = useState("");
  const [nroComision, setNroComision] = useState("");
  const [año, setAño] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = {
      criterio: criterio,
      vRegular: vRegular,
      vPromovido: vPromovido,
      idAsignatura: idAsignatura,
      nroComision: nroComision,
      anio: año,
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
        <option value="parciales">Parciales</option>
        <option value="tps">Trabajos Practicos</option>
        <option value="asistencia">Asistencia</option>
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

      <label htmlFor="idAsignatura">
        <p>ID Asignatura</p>
      </label>
      <input
        type="number"
        value={idAsignatura}
        onChange={(e) => setIdAsignatura(e.target.value)}
        required
      />

      <label htmlFor="nroComision">
        <p>Numero de Comision</p>
      </label>
      <input
        type="number"
        value={nroComision}
        onChange={(e) => setNroComision(e.target.value)}
        required
      />

      <label htmlFor="anio">
        <p>Año</p>
      </label>
      <input
        type="number"
        value={año}
        onChange={(e) => setAño(e.target.value)}
        required
      />
      
      <button type="submit">Cargar</button>

      </form>
    </PageLayout>
  );
}

export default CreateCriterion;
