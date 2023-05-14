import axios from 'axios';
import { useState } from "react";
import { PageLayout } from "../components/page-layout";

export function DownUser() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const ObtenerAccessToken = async () => {
  const client_id = process.env.API_EXPLORER_CLIENT_ID;
  const client_secret = process.env.API_EXPLORER_CLIENT_SECRET;
  const audience = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`;
  const data = {
    client_id: client_id,
    client_secret: client_secret,
    audience: audience,
    grant_type: "client_credentials"
  };

  try {
    const response = await axios.post(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, data, {
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



  async function actualizarBlocked(email) {
    const token = await ObtenerAccessToken();
    const url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users-by-email`;
    console.log(token);
    axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    params: { 
      email: email
    }
    }).then(response => {
    console.log(response.data);
    const user_id = response.data[0].user_id;
    bloquearUsuario(user_id, token);
    }).catch(error => {
    console.error(error);
    });
}

   function bloquearUsuario(user_id, token) {
    const url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users/${user_id}`;

    axios({
      method: 'patch',
      url: url,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        blocked: true
      }
    })
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.log(error);
    });
  }
  
   const handleSubmit = (event) => {
    event.preventDefault();
    console.log(email);
    actualizarBlocked(email).then(
      function() {
      setResult("Usuario eliminado exitosamente");
      }
    )
  }
  
  return (
    <PageLayout>
    <h1 id="page-title" className="content__title">Baja de docente</h1>
    <form onSubmit={handleSubmit}>
    <label htmlFor="email"><p>Correo electrónico</p></label>
    <input
      type="email"
      id="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
    <button type="submit" className="delete">Bloquear usuario</button>
    <p>{result}</p>
    </form>
    </PageLayout>
  );
}

