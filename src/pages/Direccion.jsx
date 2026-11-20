import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Direccion() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', calle: '', comuna: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getAddress().then((saved) => { if (active && saved) setForm({ nombre: saved.nombre || '', calle: saved.calle || '', comuna: saved.comuna || '', telefono: saved.telefono || '' }); })
      .catch((err) => { if (active && err.status !== 401) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try { await api.saveAddress(form); navigate('/resumen'); }
    catch (err) { setError(err.message || 'No se pudo guardar la dirección en MySQL.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 text-white px-3">
      <div className="card bg-secondary text-white p-4 shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <h3 className="mb-4 text-center">Datos de Despacho</h3>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {loading ? <p className="text-center">Cargando tus datos...</p> : <form onSubmit={submit}>
          <div className="mb-3"><label htmlFor="nombre" className="form-label">Nombre Completo</label><input name="nombre" value={form.nombre} onChange={update} type="text" className="form-control" id="nombre" required placeholder="Ej: Cristian Orlando" /></div>
          <div className="mb-3"><label htmlFor="calle" className="form-label">Dirección de Calle y Número</label><input name="calle" value={form.calle} onChange={update} type="text" className="form-control" id="calle" required placeholder="Ej: Av. Pudahuel 800" /></div>
          <div className="mb-3"><label htmlFor="comuna" className="form-label">Ciudad / Comuna</label><input name="comuna" value={form.comuna} onChange={update} type="text" className="form-control" id="comuna" required placeholder="Ej: Santiago" /></div>
          <div className="mb-3"><label htmlFor="telefono" className="form-label">Teléfono de Contacto</label><input name="telefono" value={form.telefono} onChange={update} type="tel" className="form-control" id="telefono" required placeholder="+56 9 1234 5678" /></div>
          <div className="d-grid gap-2 mt-4"><button type="submit" className="btn btn-primary fw-bold" disabled={saving}>{saving ? 'Guardando...' : 'Enviar y Ver Resumen'}</button><Link to="/carrito" className="btn btn-outline-light btn-sm">Volver al Carrito</Link></div>
        </form>}
      </div>
    </div>
  );
}
