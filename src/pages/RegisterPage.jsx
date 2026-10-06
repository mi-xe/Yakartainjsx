import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { readStorage, writeStorage } from '../lib/storage';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) { alert('Las contraseñas no coinciden. Inténtalo de nuevo.'); return; }
    const users = readStorage('usuarios', []);
    const email = form.email.trim().toLowerCase();
    if (users.some((user) => user.email === email)) { alert('Este correo electrónico ya está registrado. Intenta iniciar sesión.'); return; }
    users.push({ nombre: form.nombre.trim(), email, password: form.password, rol: 'Cliente' });
    writeStorage('usuarios', users);
    localStorage.setItem('registroExitoso', 'true');
    navigate('/login');
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 px-3">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="card bg-dark text-white p-4 shadow-lg rounded-3">
          <h3 className="text-center mb-4">Crear Cuenta</h3>
          <form onSubmit={submit}>
            <div className="mb-3"><label htmlFor="nombre" className="form-label">Nombre Completo</label><input name="nombre" value={form.nombre} onChange={update} type="text" id="nombre" className="form-control" required /></div>
            <div className="mb-3"><label htmlFor="email" className="form-label">Correo Electrónico</label><input name="email" value={form.email} onChange={update} type="email" id="email" className="form-control" required /></div>
            <div className="mb-3"><label htmlFor="password" className="form-label">Contraseña</label><input name="password" value={form.password} onChange={update} type="password" id="password" className="form-control" required /></div>
            <div className="mb-4"><label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label><input name="confirmPassword" value={form.confirmPassword} onChange={update} type="password" id="confirmPassword" className="form-control" required /></div>
            <button type="submit" className="btn btn-primary w-100 fw-bold">Registrarse</button>
          </form>
          <p className="text-center mt-4 mb-0">¿Ya tienes una cuenta? <Link to="/login" className="text-info">Inicia Sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
}
