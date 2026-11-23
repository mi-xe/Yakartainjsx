import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ERROR_MESSAGES = {
  google_not_configured: 'Google todavía no está configurado. Revisa las variables OAuth del backend.',
  google_auth_failed: 'Google no pudo completar la autenticación. Inténtalo nuevamente y comprueba el cliente OAuth.',
  google_account_error: 'Google verificó tu cuenta, pero Yakarta no pudo crear o vincular el usuario. Si ya tienes una cuenta Yakarta con ese correo, inicia sesión primero con tu contraseña y luego vuelve a conectar Google desde esa misma sesión.',
};

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error');
    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] || 'No se pudo iniciar sesión con Google.');
      return () => { active = false; };
    }

    refreshUser()
      .then((user) => {
        if (active && user) navigate('/', { replace: true });
        else if (active) setError('Google devolvió una respuesta, pero Yakarta no encontró una sesión válida.');
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudo validar la sesión de Google.');
      });

    return () => { active = false; };
  }, [location.search, navigate, refreshUser]);

  return (
    <div className="container py-5 text-center text-white">
      <h2>{error ? 'No se pudo iniciar sesión' : 'Completando el inicio de sesión…'}</h2>
      {error ? (
        <div className="alert alert-danger mt-3">
          {error}
          <div className="mt-2"><Link to="/login" className="alert-link">Volver al inicio de sesión</Link></div>
        </div>
      ) : (
        <p className="text-secondary mt-3">Estamos comprobando tu sesión de Yakarta.</p>
      )}
    </div>
  );
}
