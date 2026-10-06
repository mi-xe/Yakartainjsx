import { useState } from 'react';

const emptyForm = { email: '', nombre: '', telefono: '', comentario: '' };

export default function ContactPage() {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (submitted) setSubmitted(false);
  };

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    setForm(emptyForm);
  }

  return (
    <div className="horizontal">
      <div className="izquierda">
        <h2>CONTACTANOS</h2>
        <p>Gmail: Mcyakartalovin@solab.cl</p>
        <p>Telefono: 9 2152 3700</p>
        <h4>Quieres trabajar con nosotros?</h4>
        <p>Deja tus datos aqui:</p>
      </div>

      <div className="formcontactanos derecha formularioContacto">
        {submitted && (
          <div className="alert alert-success shadow-sm border-0 mb-4" role="status">
            <div className="d-flex align-items-start gap-3">
              <i className="bi bi-check-circle-fill fs-4" aria-hidden="true" />
              <div className="flex-grow-1">
                <h5 className="alert-heading mb-1">¡Mensaje enviado correctamente!</h5>
                <p className="mb-0">Gracias por contactarnos. Recibimos tus datos y nos pondremos en contacto contigo pronto.</p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar mensaje"
                onClick={() => setSubmitted(false)}
              />
            </div>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label htmlFor="gmail" className="form-label">Gmail</label>
            <input name="email" value={form.email} onChange={update} id="gmail" type="email" className="form-control" placeholder="gmail.com / duoc.cl / profesor.duoc.cl" required />
          </div>
          <div className="mb-3">
            <label htmlFor="contactName" className="form-label">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={update} id="contactName" type="text" className="form-control" required />
          </div>
          <div className="mb-3">
            <label htmlFor="contactPhone" className="form-label">Telefono</label>
            <input name="telefono" value={form.telefono} onChange={update} id="contactPhone" type="tel" className="form-control" required />
          </div>
          <div className="mb-3">
            <label htmlFor="comentario" className="form-label">Comentario</label>
            <textarea name="comentario" value={form.comentario} onChange={update} id="comentario" className="form-control" rows="4" />
          </div>
          <button type="submit" className="btn btn-primary">Confirmar</button>
        </form>
      </div>
    </div>
  );
}
