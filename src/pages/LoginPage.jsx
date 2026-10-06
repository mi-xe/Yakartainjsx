import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { readStorage, writeStorage } from '../lib/storage';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(() => localStorage.getItem('registroExitoso') === 'true' ? '¡Tu cuenta se ha creado con éxito! Ya puedes iniciar sesión.' : '');
  const [error, setError] = useState(false);

  useEffect(() => {
    localStorage.removeItem('registroExitoso');
  }, []);

  function submit(event) {
    event.preventDefault();
    const users = readStorage('usuarios', []);
    const admin = { nombre: 'Cristian Orlando', email: 'admin@tienda.com', password: '123', rol: 'Administrador' };
    const found = users.find((user) => user.email === email.trim().toLowerCase() && user.password === password) ?? (email.trim().toLowerCase() === admin.email && password === admin.password ? admin : null);
    if (!found) {
      setError(true);
      setMessage('Correo o contraseña incorrectos.');
      return;
    }
    writeStorage('usuarioLogueado', { nombre: found.nombre, email: found.email, rol: found.rol });
    navigate('/');
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 px-3">
      <div className="card card-login p-4 shadow-lg rounded-3">
        <div className="text-center mb-4"><i className="bi bi-controller display-3 text-primary" /><h3 className="fw-bold mt-2">Iniciar Sesión</h3><p className="text-secondary small">Ingresa tus credenciales para acceder</p></div>
        {message && <div className={`alert ${error ? 'alert-danger' : 'alert-success'} py-2`} role="alert"><i className={`bi ${error ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`} />{message}</div>}
        <form onSubmit={submit}>
          <div className="mb-3"><label htmlFor="email" className="form-label text-start w-100">Correo Electrónico</label><div className="input-group"><span className="input-group-text bg-secondary text-white border-secondary"><i className="bi bi-envelope-fill" /></span><input type="email" id="email" className="form-control" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
          <div className="mb-3"><label htmlFor="password" className="form-label text-start w-100">Contraseña</label><div className="input-group"><span className="input-group-text bg-secondary text-white border-secondary"><i className="bi bi-lock-fill" /></span><input type="password" id="password" className="form-control" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></div></div>
          <div className="d-flex justify-content-between align-items-center mb-4"><div className="form-check"><input className="form-check-input" type="checkbox" id="recordar" /><label className="form-check-label small text-secondary" htmlFor="recordar">Recordarme</label></div><button type="button" className="btn btn-link p-0 small text-primary text-decoration-none">¿Olvidaste tu contraseña?</button></div>
          <button type="submit" className="btn btn-primary w-100 fw-bold py-2 mb-3"><i className="bi bi-box-arrow-in-right me-1" />Entrar</button>
          <div className="d-flex align-items-center my-3"><hr className="flex-grow-1 border-secondary m-0" /><span className="px-2 text-secondary small">¿No tienes una cuenta?</span><hr className="flex-grow-1 border-secondary m-0" /></div>
          <Link to="/registro" className="btn btn-outline-success w-100 fw-bold py-2 mb-3"><i className="bi bi-person-plus-fill me-1" />Crear Cuenta Nueva</Link>
          <div className="text-center"><Link to="/" className="text-secondary text-decoration-none small"><i className="bi bi-arrow-left me-1" />Volver a la Tienda</Link></div>
        </form>
      </div>
    </div>
  );
}
