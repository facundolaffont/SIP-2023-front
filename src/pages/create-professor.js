//import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
// import auth0 from 'auth0-js';
import axios from 'axios';
import { PageLayout } from "../components/page-layout";

export function CreateProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState('');

  const ObtenerAccessToken = async () => {
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

  async function createUser(user) {
    const token = await ObtenerAccessToken();
    const url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(user)
    };
    debugger
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.error) {
      setError(data);
    }
    return data; 
  }



 // const { getAccessTokenSilently } = useAuth0();
 /* const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);

  const auth0Client = new auth0.WebAuth({
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientID: process.env.REACT_APP_AUTH0_CLIENT_ID, 
}); */

    const handleSubmit = async (event) => {
      event.preventDefault();
    
    const newUser = await createUser({
      email: email,
      password: password,
      connection: 'Username-Password-Authentication',
      user_metadata: {
        role: role
      }
  });
    setResult('Usuario creado exitosamente');
    console.log(newUser);


  

 /*   event.preventDefault();
    auth0Client.signup(
      {
        connection: 'Username-Password-Authentication',
        email,
        password,
        username,
        user_metadata: {
          role: role,
          blocked : '0'
        },
      },
      (err) => {
        if (err) {
          console.error(err);
          setError(err.description);
          return;
        }
        console.log('Usuario creado exitosamente');
      }
    ); */
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

 /* function getErrorMessage(rule) {
      switch (rule.code) {
        case "lengthAtLeast":
          return `La contraseña debe tener al menos ${rule.format[0]} caracteres`;
        case "containsAtLeast":
          const characterTypes = getCharacterTypes(rule.items);
          return `La contraseña debe contener al menos ${rule.format[0]} de los siguientes tipos de caracteres: ${characterTypes}`;
        default:
          return rule.message;
      }
    }

    function getCharacterTypes(items) {
      const types = {
          lowerCase: "letras minúsculas",
          upperCase: "letras mayúsculas",
          numbers: "números",
          specialCharacters: "caracteres especiales",
        };

        // Filtra los elementos verificados y asigna a sus tipos de caracteres correspondientes
      const requiredTypes = items
       // .filter((item) => item.verified)
        .map((item) => types[item.code]);

        // Devuelve una cadena separada por comas de los tipos de caracteres requeridos
        return requiredTypes.join(", ");
    }  */

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
        <option value="admin">admin</option>
        <option value="user">user</option>
      </select> 

    <label htmlFor="nombre"><p>Nombre</p></label>
      <input type="text"/>

    <label htmlFor="apellido"><p>Apellido</p></label>
      <input type="text"/>

    <label htmlFor="legajo"><p>Legajo</p></label>
    <input type="text"/>

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

