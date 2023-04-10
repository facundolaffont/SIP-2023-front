//import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import auth0 from 'auth0-js';
import { PageLayout } from "../components/page-layout";

export function CreateProfessor() {
 // const { getAccessTokenSilently } = useAuth0();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');

  const auth0Client = new auth0.WebAuth({
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
});

 /* const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const accessToken = await getAccessTokenSilently({
        audience: 'https://hello-world.example.com',
        scope: 'create:users'
      });
      console.log(accessToken);
      const response = await fetch(
        `https://dev-jhurd8vkuqfbvs4g.auth0.com/api/v2/users`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password, 
            app_metadata: {
              roles: [role],
            },
          }),
        }
      );

      const data = await response.json();

      console.log(data);
    } catch (error) {
      console.error(error);
    }
  }; */

    const handleSubmit = (event) => {
    event.preventDefault();
    auth0Client.signup(
      {
        connection: 'Username-Password-Authentication',
        email,
        password,
        username,
        user_metadata: {
          role: role,
        },
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log('Usuario creado exitosamente');
      }
    );
  };

  return (
    <PageLayout>
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Correo electrónico</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
    <label htmlFor="role">Rol</label>
      <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
        <option value="">Seleccione un rol</option>
        <option value="admin">admin</option>
        <option value="user">user</option>
      </select> 


    <label htmlFor="username">Usuario</label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <button type="submit">Registrarse</button>
    </form>
    </PageLayout>
  );
}

export default CreateProfessor;
