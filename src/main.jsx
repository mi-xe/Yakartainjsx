import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';

import PageLayout from './components/PageLayout';
import Inicio from './pages/Inicio';
import Blogs from './pages/Blogs';
import BlogDeadByDaylight from './pages/BlogDeadByDaylight';
import BlogNeedForSpeed from './pages/BlogNeedForSpeed';
import MidnightClub from './pages/MidnightClub';
import Nosotros from './pages/Nosotros';
import Tienda from './pages/Tienda';
import Carrito from './pages/Carrito';
import Compras from './pages/Compras';
import Contacto from './pages/Contacto';
import Direccion from './pages/Direccion';
import IniciarSesion from './pages/IniciarSesion';
import Registro from './pages/Registro';
import Resumen from './pages/Resumen';
import Administracion from './pages/Administracion';
import Fondos from './pages/Fondos';

function Layout({ children }) {
  return <PageLayout>{children}</PageLayout>;
}

function Routed({ component, layout = true }) {
  return layout ? <Layout>{component}</Layout> : component;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Routed component={<Inicio />} />} />
        <Route path="/blogs" element={<Routed component={<Blogs />} />} />
        <Route path="/blogs/dead-by-daylight" element={<Routed component={<BlogDeadByDaylight />} />} />
        <Route path="/blogs/need-for-speed-shift" element={<Routed component={<BlogNeedForSpeed />} />} />
        <Route path="/midnight-club" element={<Routed component={<MidnightClub />} />} />
        <Route path="/somos" element={<Routed component={<Nosotros />} />} />
        <Route path="/tienda" element={<Routed component={<Tienda />} />} />
        <Route path="/fondos" element={<Routed component={<Fondos />} />} />
        <Route path="/carrito" element={<Routed component={<Carrito />} layout={false} />} />
        <Route path="/compras" element={<Routed component={<Compras />} />} />
        <Route path="/contactanos" element={<Routed component={<Contacto />} />} />
        <Route path="/direccion" element={<Routed component={<Direccion />} layout={false} />} />
        <Route path="/login" element={<Routed component={<IniciarSesion />} layout={false} />} />
        <Route path="/registro" element={<Routed component={<Registro />} layout={false} />} />
        <Route path="/resumen" element={<Routed component={<Resumen />} layout={false} />} />
        <Route path="/admin" element={<Routed component={<Administracion />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
