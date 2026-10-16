import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      await apiRequest('register', { nombre: form.nombre.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      localStorage.setItem('registroExitoso', 'true');
      navigate('/login');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 px-3">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="card bg-dark text-white p-4 shadow-lg rounded-3">
          <h3 className="text-center mb-4">Crear Cuenta</h3>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3"><label htmlFor="nombre" className="form-label">Nombre Completo</label><input name="nombre" value={form.nombre} onChange={update} type="text" id="nombre" className="form-control" required /></div>
            <div className="mb-3"><label htmlFor="email" className="form-label">Correo Electrónico</label><input name="email" value={form.email} onChange={update} type="email" id="email" className="form-control" required /></div>
            <div className="mb-3"><label htmlFor="password" className="form-label">Contraseña</label><input name="password" value={form.password} onChange={update} type="password" id="password" className="form-control" required /></div>
            <div className="mb-4"><label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label><input name="confirmPassword" value={form.confirmPassword} onChange={update} type="password" id="confirmPassword" className="form-control" required /></div>
            <button type="submit" className="btn btn-primary w-100 fw-bold">{loading ? 'Registrando...' : 'Registrarse'}</button>
          </form>
          <p className="text-center mt-4 mb-0">¿Ya tienes una cuenta? <Link to="/login" className="text-info">Inicia Sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
}
