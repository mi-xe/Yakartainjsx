import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    refreshUser().then(() => { if (active) navigate('/'); })
      .catch((err) => { if (active) setError(err.message || 'No se pudo validar la sesión social.'); });
    return () => { active = false; };
  }, [navigate, refreshUser]);
  return <div className="container py-5 text-center text-white"><h2>{error ? 'No se pudo iniciar sesión' : 'Completando el inicio de sesión...'}</h2>{error && <div className="alert alert-danger mt-3">{error}<div><a href="/login" className="alert-link">Volver al login</a></div></div>}</div>;
}
