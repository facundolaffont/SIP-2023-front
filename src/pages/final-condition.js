import { PageLayout } from "../components/page-layout";
import { useEffect } from "react";
import { useState } from "react";


export function FinalCondition() {
  const [criterias, setCriterias] = useState([]);
  const [finalConditions, setFinalConditions] = useState([]);
  useEffect(() => {
    // Enviamos petición al backend para obtener los criterios de evaluación asociados a la cursada
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/criterion-course/evaluationCriterias?courseId=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((criteria) => {
        // Aquí puedes hacer algo con los criterios recibidos, como actualizar el estado del componente
        console.log(criteria);
        setCriterias(criteria);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    // Enviamos petición al back para calcular condicion final de los alumnos de la cursada

    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/finalCondition?courseId=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setFinalConditions(data);
        })
        .catch((error) => console.error(error));

  }
  
  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Condición Final</h1>
      <form onSubmit={handleSubmit}>
        <p>Se evaluará la condicion final de los estudiantes según los siguientes criterios:</p>
        <table className="criteria-table">
          <thead>
            <tr>
              <th>Criterio</th>
              <th>Valor para regular</th>
              <th>Valor para promover</th>
            </tr>
          </thead>
          <tbody>
            {criterias.map((criteria, index) => (
              <tr key={index}>
                <td>{criteria.criteria.name}</td>
                <td>
                    {criteria.criteria.name !== 'Promedio de parciales'
                    ? `${criteria.value_to_regulate} %`
                    : criteria.value_to_regulate}
                </td>
                <td>
                    {criteria.criteria.name !== 'Promedio de parciales'
                    ? `${criteria.value_to_promote} %`
                    : criteria.value_to_promote}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit" className="calculate-button">Calcular Condicion Final de Alumnos</button>
      </form>

      {/* Mostrar la tabla de condiciones finales */}
      {finalConditions.length > 0 && (
        <div>
          <h2>Condiciones Finales de Alumnos</h2>
          <table className="condition-table">
            <thead>
              <tr>
                <th>Legajo</th>
                {criterias.map((criteria, index) => (
                    <th>{criteria.criteria.name}</th>
                ))}
                <th>Condición Final</th>
              </tr>
            </thead>
            <tbody>
              {finalConditions.map((student, index) => (
                <tr key={index}>
                  <td>{student.Legajo}</td>
                  {criterias.map((criteria, criteriaIndex) => {
                    const conditionObj = student.Detalle.find(
                    (item) => item.Criterio === criteria.criteria.name
                  );
                    const condition = conditionObj ? conditionObj.Condición : "N/A";

                    let cellClassName = "normal-cell"; // Clase por defecto

                    if (condition === "L") {
                      cellClassName = "red-cell"; // Si el contenido es L, aplicamos la clase "red-cell"
                    } else if (condition === "R") {
                      cellClassName = "yellow-cell"; // Si el contenido es R, aplicamos la clase "yellow-cell"
                    } else if (condition === "P") {
                      cellClassName = "green-cell"; // Si el contenido es P, aplicamos la clase "green-cell"
                    }

                    return (
                      <td key={criteriaIndex} className={cellClassName}>
                        {condition} {/* Mostrar la condición específica del criterio para cada estudiante */}
                      </td>
                    );
                  })}
                  <td class="condition-cell">{student.Condición}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </PageLayout>
  );
}