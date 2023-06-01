import axios from 'axios';

const getAccessToken = async () => {
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
      console.log('Token obtenido', token);
      return token;
    }
    catch (error) {
      console.log('Error al obtener el token', error);
      throw error;
    }
  }

  export default getAccessToken;