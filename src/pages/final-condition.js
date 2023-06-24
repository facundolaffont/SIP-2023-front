import { PageLayout } from "../components/page-layout";

export function FinalCondition() {

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
        .then((data) => console.log(data))
        .catch((error) => console.error(error));

  }
  
  return (
    <PageLayout>
    <h1 id="page-title" className="content__title">Condición Final</h1>
    <form onSubmit={handleSubmit}>
    <button type="submit" >Calcular Condicion Final de Alumnos</button>
    </form>
    </PageLayout>
  );
}