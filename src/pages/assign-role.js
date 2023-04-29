import { useState } from 'react';
import axios from 'axios';
import { PageLayout } from "../components/page-layout";

export function AssignRole() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState(null);
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
      const response = await axios.post(
        `https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`,
        data, {
          headers: {
            'content-type': 'application/json'
          }
        }
      );
  
      const token = response.data.access_token;
      console.log('Token obtenido.', token);
      return token;
    }
    catch (error) {
      console.log('Error al obtener el token.', error);
      throw error;
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    // assignRole(); // TODO: crear la llamada al back para cambiar de rol.
  };

  return (
    <PageLayout>
      <h1 id="page-title" className="content__title">Asignar rol</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="role"><p>Rol</p></label>
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Seleccione un rol</option>
          <option value="Administrador">Administrador</option>
          <option value="Docente">Docente</option>
        </select>
        <button type="submit">Registrar</button>
      </form>
    </PageLayout>
  );
}

export default AssignRole;