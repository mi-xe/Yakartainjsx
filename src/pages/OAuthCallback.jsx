import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    refreshUser().then((user) => {
      if (!active) return;
      if (user) navigate('/');
      else setError('El inicio de sesión social no está configurado en este backend. Ingresa con tu correo y contraseña.');
    });
    return () => { active = false; };
  }, [navigate, refreshUser]);
  return <div className="container py-5 text-center text-white"><h2>{error ? 'No se pudo iniciar sesión' : 'Comprobando sesión...'}</h2>{error && <div className="alert alert-warning mt-3">{error}<div><a href="/login" className="alert-link">Volver al login</a></div></div>}</div>;
}
