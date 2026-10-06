import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/storage';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());

  function logout() {
    localStorage.removeItem('usuarioLogueado');
    setUser(null);
    navigate('/');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src="/img/logofeoyakarta.png" alt="Logo Yakarta" className="logo-navbar" />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Abrir navegación">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/tienda">Tienda</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/blogs">Blogs</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/contactanos">Contactanos</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/somos">Acerca de nosotros</Link></li>
          </ul>
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            <li className="nav-item">
              <Link className="btn btn-outline-light btn-navbar-custom d-flex align-items-center justify-content-center gap-2" to="/carrito">
                <i className="bi bi-cart3" /> <span>Carrito</span>
              </Link>
            </li>
            <li className="nav-item">
              {user ? (
                <div className="dropdown">
                  <button className="btn btn-outline-light btn-navbar-custom d-flex align-items-center justify-content-center gap-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="bi bi-person-circle" /> <span>{user.nombre}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow mt-2">
                    {user.rol === 'Administrador' ? (
                      <li><Link className="dropdown-item text-warning fw-bold" to="/admin"><i className="bi bi-shield-lock-fill me-2" />Panel Admin</Link></li>
                    ) : (
                      <li><Link className="dropdown-item text-info fw-bold" to="/compras"><i className="bi bi-bag-check-fill me-2" />Mis Compras Recientes</Link></li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger fw-bold" type="button" onClick={logout}><i className="bi bi-box-arrow-right me-2" />Cerrar Sesión</button></li>
                  </ul>
                </div>
              ) : (
                <Link className="btn btn-outline-light btn-navbar-custom d-flex align-items-center justify-content-center gap-2" to="/login">
                  <i className="bi bi-box-arrow-in-right" /> <span>Iniciar Sesión</span>
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
