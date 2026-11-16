import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { writeStorage } from '../lib/storage';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('http://localhost:8080/api/auth/me', { credentials: 'include' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'No se pudo validar la sesión social.');
        if (active) { writeStorage('usuarioLogueado', data.user); navigate('/'); }
      })
      .catch(err => active && setError(err.message || 'Error al completar el inicio de sesión.'))
    return () => { active = false; };
  }, [navigate]);
  return <div className="container py-5 text-center text-white"><h2>{error ? 'No se pudo iniciar sesión' : 'Completando inicio de sesión...'}</h2>{error && <div className="alert alert-danger mt-3">{error}<div><a href="/login" className="alert-link">Volver al login</a></div></div>}</div>;
}
