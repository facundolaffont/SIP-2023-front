import { useState } from 'react';
import axios from 'axios';
import { callExternalApi } from "../services/external-api.service";
import { PageLayout } from "../components/page-layout";

export function CreateProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [legajo, setLegajo] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState('');

  const apiServerUrl = process.env.REACT_APP_API_SERVER_URL;

 /* const ObtenerAccessToken = async () => {
    const client_id = "ZrJFK8q1bRMnQxjsapmVn5LNZPgWVsFs";
    const client_secret = "qLV2dwEEtmacS1jpzoC97uhHd5G1QoggWL67THWxyt2dQwYT1-gx2wkBn42kU_ez";
    const audience = "https://dev-jhurd8vkuqfbvs4g.us.auth0.com/api/v2/";
  
    const data = {
      client_id: client_id,
      client_secret: client_secret,
      audience: audience,
      grant_type: "client_credentials"
    };  
  
    try {
      const response = await axios.post('https://dev-jhurd8vkuqfbvs4g.us.auth0.com/oauth/token', data, {
        headers: {
          'content-type': 'application/json'
        }
      });
  
      const token = response.data.access_token;
      console.log('Token obtenido', token);
      return token;
    } catch (error) {
      console.log('Error al obtener el token', error);
      throw error;
    }
  }

  async function createUser() {

    // Obtengo Token de Acceso

    const token = await ObtenerAccessToken();
    const user = {
        email: email,
        password: password,
        connection: 'Username-Password-Authentication',
      }
    let url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(user)
    };
    
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.error) {
      setError(data);
    } else {
      setResult('Usuario creado exitosamente');
      console.log(data);
    }
    // Usuario creado

    // Obtengo el user_id del usuario creado
    const USER_ID = data.user_id;
    
    // Obtengo el id del rol

    const urlRol = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/roles`;
    const roleName = role;
    const optionsRol = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    fetch(urlRol, optionsRol)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error al obtener la lista de roles');
        }
      })
      .then(data => {
        const rol = data.find(rol => rol.name === roleName);
        if (rol) {
          console.log(`El ID del rol ${roleName} es: ${rol.id}`);
        } else {
          console.log(`El rol ${roleName} no existe en tu tenant de Auth0`);
        }

        // Asigno rol al usuario
        const url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/roles/${rol.id}/users`;

        const idUsuario = {
        users: [USER_ID]
        };

        const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(idUsuario)
        };

        fetch(url, options)
          .then(data => {
          console.log('Roles agregados al usuario:', data);
          })
          .catch(error => {
          console.error('Error:', error);
          });

      })
      .catch(error => {
        console.error('Error:', error);
      });
  } */


    const handleSubmit = async (event) => {
      event.preventDefault();
      //createUser();
      //const token = await ObtenerAccessToken();
      const data = {
        email: email,
        password: password,
        rol: role,
        nombre: nombre,
        apellido: apellido,
        legajo: legajo
      };
      fetch(
        `${apiServerUrl}/api/v1/professors/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            //Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data)
        }
      )
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error)); 
        };
  

  function getError(error) {
    switch (error.message) {
      case "PasswordStrengthError: Password is too weak":
        return `La contraseña es muy debil. Recuerde que debe tener por lo menos 8 caracteres. Ademas, no se olvide que tiene que contar por lo menos con una mayúscula, una minuscula, un numero y un caracter especial.`;
      default:
        return error.message;
    }
  }

  function validatePassword() {
    const passwordInput = document.getElementById('password');
    const passwordLengthRequirement = document.getElementById('password-length');
    const passwordUppercaseRequirement = document.getElementById('password-uppercase');
    const passwordLowercaseRequirement = document.getElementById('password-lowercase');
    const passwordDigitRequirement = document.getElementById('password-digit');
    
    // Validar longitud
    if (passwordInput.value.length >= 8) {
      passwordLengthRequirement.style.color = 'green';
    } else {
      passwordLengthRequirement.style.color = 'red';
    }
    
    // Validar mayúsculas
    if (passwordInput.value.match(/[A-Z]/)) {
      passwordUppercaseRequirement.style.color = 'green';
    } else {
      passwordUppercaseRequirement.style.color = 'red';
    }

    // Validar mayúsculas
    if (passwordInput.value.match(/[a-z]/)) {
      passwordLowercaseRequirement.style.color = 'green';
    } else {
      passwordLowercaseRequirement.style.color = 'red';
    }
    
    // Validar números
    if (passwordInput.value.match(/\d/)) {
      passwordDigitRequirement.style.color = 'green';
    } else {
      passwordDigitRequirement.style.color = 'red';
    }
  }

  return (
    <PageLayout>
    <h1 id="page-title" className="content__title">Alta de usuario </h1>
    <form onSubmit={handleSubmit}>
      <label for="email"><p>Correo electrónico</p></label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password"><p>Contraseña</p></label>
      <input
        id="password"
        type="password"
        value={password}
        onInput={validatePassword}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div id="password-requirements">
      <p>Requisitos de contraseña:</p>
      <p id="password-length">Debe tener al menos 8 caracteres</p>
      <p id="password-uppercase">Debe contener al menos una letra mayúscula</p>
      <p id="password-lowercase">Debe contener al menos una letra minúscula</p>
      <p id="password-digit">Debe contener al menos un número</p>
      </div>

      
    <label htmlFor="role"><p>Rol</p></label>
      <select value={role} onChange={(e) => setRole(e.target.value)} required>
        <option value="">Seleccione un rol</option>
        <option value="Administrador">Administrador</option>
        <option value="Docente">Docente</option>
      </select> 

    <label htmlFor="nombre"><p>Nombre</p></label>
      <input 
        type="text"
        id="nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />

    <label htmlFor="apellido"><p>Apellido</p></label>
      <input 
        type="text"
        id="apellido"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        required
      />

    <label htmlFor="legajo"><p>Legajo</p></label>
      <input 
        type="text"
        id="legajo"
        value={legajo}
        onChange={(e) => setLegajo(e.target.value)}
        required
      />

      <button type="submit">Registrar</button>
      {error && (
      <div>
      <p>Error al crear usuario:</p>
      <p>{getError(error)}</p>
      </div>
      )}
      <p>{result}</p>
    </form>
    </PageLayout>
  );
}

export default CreateProfessor;

