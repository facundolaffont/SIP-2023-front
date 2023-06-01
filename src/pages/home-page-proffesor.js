import React from "react";
import { PageLayout } from "../components/page-layout";
import { useAuth0 } from '@auth0/auth0-react';

export const HomePageProffesor = () => {
  
  const { getIdTokenClaims } = useAuth0();
  // Obtener las cursadas del usuario logueado desde el backend
  getIdTokenClaims()
  .then(tokenClaims => {
    const token = tokenClaims.__raw;
    fetch(`${process.env.REACT_APP_API_SERVER_URL}/api/v1/course/getProfessor`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        // Aquí tienes los datos de las cursadas del usuario
        // Puedes manipularlos para mostrarlos en el navegador

        // Obtener el contenedor de las cursadas en el HTML
        const cursadasContainer = document.getElementById('cursadas-container');

        // Limpiar el contenedor antes de agregar nuevos elementos
        cursadasContainer.innerHTML = '';

        // Iterar sobre las cursadas y crear un cuadro para cada una
        data.forEach((cursada, index) => {
          const cuadroCursada = document.createElement('div');
          cuadroCursada.classList.add('cuadro-cursada');
          // Agregar un atributo de datos para almacenar el índice de la cursada
          cuadroCursada.setAttribute('data-index', index);

          // Mostrar los detalles de la cursada dentro del cuadro
          const nombreCursada = document.createElement('h3');
          nombreCursada.textContent = `Nombre de la Asignatura: ` + cursada.nombreAsignatura;

          const detallesCursada = document.createElement('p');
          detallesCursada.textContent = `Año de la cursada: ${cursada.anio}, Numero de Comision: ${cursada.numeroComision}`;

          cuadroCursada.appendChild(nombreCursada);
          cuadroCursada.appendChild(detallesCursada);

          // Agregar un evento de clic al cuadro de la cursada
          cuadroCursada.addEventListener('click', () => {
            // Obtener el índice de la cursada seleccionada
            const selectedIndex = parseInt(cuadroCursada.getAttribute('data-index'), 10);

            // Realizar alguna acción con la cursada seleccionada
            // Por ejemplo, puedes mostrar una alerta con el nombre de la cursada
            const selectedCursada = data[selectedIndex];
            alert(`Cursada seleccionada: ${selectedCursada[0]}`);
          });
          cursadasContainer.appendChild(cuadroCursada);
        });
      })
      .catch(error => {
        console.error('Error al obtener las cursadas:', error);
      })
    })
  .catch(error => {
    console.error('Error al obtener el token:', error);
  });
  
  return (
    <PageLayout>
    <h1 className="content__title">Mis Asignaturas</h1>
      <div id="cursadas-container">
      </div>
    </PageLayout>
  );
};
