import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ email: '', nombre: '', telefono: '', comentario: '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  function submit(event) { event.preventDefault(); alert(`¡Información enviada correctamente!\n\nDatos registrados:\n- Nombre: ${form.nombre}\n- Correo: ${form.email}\n- Telefono: ${form.telefono}`); setForm({ email: '', nombre: '', telefono: '', comentario: '' }); }
  return (
    <div className="horizontal">
      <div className="izquierda"><h2>CONTACTANOS</h2><p>Gmail: Mcyakartalovin@solab.cl</p><p>Telefono: 9 2152 3700</p><h4>Quieres trabajar con nosotros?</h4><p>Deja tus datos aqui:</p></div>
      <div className="formcontactanos derecha formularioContacto"><form onSubmit={submit}><div className="mb-3"><label htmlFor="gmail" className="form-label">Gmail</label><input name="email" value={form.email} onChange={update} id="gmail" type="email" className="form-control" placeholder="gmail.com / duoc.cl / profesor.duoc.cl" required /></div><div className="mb-3"><label htmlFor="contactName" className="form-label">Nombre</label><input name="nombre" value={form.nombre} onChange={update} id="contactName" type="text" className="form-control" required /></div><div className="mb-3"><label htmlFor="contactPhone" className="form-label">Telefono</label><input name="telefono" value={form.telefono} onChange={update} id="contactPhone" type="tel" className="form-control" required /></div><div className="mb-3"><label htmlFor="comentario" className="form-label">Comentario</label><textarea name="comentario" value={form.comentario} onChange={update} id="comentario" className="form-control" rows="4" /></div><button type="submit" className="btn btn-primary">Confirmar</button></form></div>
    </div>
  );
}
