import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import React, { useState } from 'react';
import { PageLayout } from '../components/page-layout';

export const ChangePasswordForm = () => {
  const { getAccessTokenSilently } = useAuth0();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }
    const token = await getAccessTokenSilently();
    axios.put('/api/change-password', {
      currentPassword,
      newPassword,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(() => {
        setSuccess(true);
        setError(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((error) => {
        setError(error.response.data.message);
      });
  }

  return (
    <PageLayout>
    <form onSubmit={handleSubmit}>
      <label>
        Contraseña actual:
        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
      </label>
      <label>
        Nueva contraseña:
        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
      </label>
      <label>
        Confirmar nueva contraseña:
        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </label>
      {error && <div>{error}</div>}
      {success && <div>Contraseña actualizada correctamente</div>}
      <button type="submit">Cambiar contraseña</button>
    </form>
    </PageLayout>
  );
}
