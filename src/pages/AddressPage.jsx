import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { readStorage, writeStorage } from '../lib/storage';

export default function AddressPage() {
  const navigate = useNavigate();
  const saved = readStorage('direccionDespacho', {});
  const [form, setForm] = useState({ nombre: saved.nombre ?? '', calle: saved.calle ?? '', comuna: saved.comuna ?? '', telefono: saved.telefono ?? '' });

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    writeStorage('direccionDespacho', form);
    navigate('/resumen');
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 text-white px-3">
      <div className="card bg-secondary text-white p-4 shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <h3 className="mb-4 text-center">Datos de Despacho</h3>
        <form onSubmit={submit}>
          <div className="mb-3"><label htmlFor="nombre" className="form-label">Nombre Completo</label><input name="nombre" value={form.nombre} onChange={update} type="text" className="form-control" id="nombre" required placeholder="Ej: Cristian Orlando" /></div>
          <div className="mb-3"><label htmlFor="calle" className="form-label">Dirección de Calle y Número</label><input name="calle" value={form.calle} onChange={update} type="text" className="form-control" id="calle" required placeholder="Ej: Av. Pudahuel 800" /></div>
          <div className="mb-3"><label htmlFor="comuna" className="form-label">Ciudad / Comuna</label><input name="comuna" value={form.comuna} onChange={update} type="text" className="form-control" id="comuna" required placeholder="Ej: Santiago" /></div>
          <div className="mb-3"><label htmlFor="telefono" className="form-label">Teléfono de Contacto</label><input name="telefono" value={form.telefono} onChange={update} type="tel" className="form-control" id="telefono" required placeholder="+56 9 1234 5678" /></div>
          <div className="d-grid gap-2 mt-4"><button type="submit" className="btn btn-primary fw-bold">Enviar y Ver Resumen</button><Link to="/carrito" className="btn btn-outline-light btn-sm">Volver al Carrito</Link></div>
        </form>
      </div>
    </div>
  );
}
