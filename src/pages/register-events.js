import { useState } from "react";
import { PageLayout } from "../components/page-layout";
import '../styles/register-students.css';

export function EventRegistering() {
  const [obligatorio, setObligatorio] = useState(false); // Cambiado a un valor booleano
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = {
      idCursada: 1,
      tipoEvento: tipoEvento,
      obligatorio: obligatorio,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    };
    console.log(data);
    
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/events/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Host": "back-service.default.svc.cluster.local"
        //Authorization: `Bearer ${token}`,
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
        Registro de eventos
      </h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="event-type">
          <p>Tipo de evento</p>
        </label>
        <select
          id="event-type"
          required
          onChange={(e) => setTipoEvento(e.target.value)}
          value={tipoEvento}
        >
          <option value="">Selecciona un tipo de evento</option>
          <option value="1">Clase</option>
          <option value="2">Trabajo Práctico</option>
          <option value="3">Parcial</option>
          <option value="4">Autoevaluación</option>
          <option value="5">Recuperatorio Trabajo Práctico</option>
          <option value="6">Recuperatorio Parcial</option>
          <option value="7">Recuperatorio Autoevaluación</option>
          <option value="8">Integrador</option>          
          <option value="9">Final</option>
        </select>
        <label htmlFor="calification-date">
          <p>Fecha de inicio del evento</p>
        </label>
        <input
          type="datetime-local"
          id="calification-date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
        />
        <label htmlFor="calification-date">
          <p>Fecha de finalización del evento</p>
        </label>
        <input
          type="datetime-local"
          id="calification-date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          required
        />
        <label htmlFor="event-required">
          <p>Evento obligatorio</p>
          <input
            type="checkbox"
            id="event-required"
            checked={obligatorio}
            onChange={(e) => setObligatorio(e.target.checked)}
          />
        </label>
        <button type="submit" className="register-student-button">
          Registrar evento
        </button>
      </form>
    </PageLayout>
  );
}
