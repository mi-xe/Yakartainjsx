import React, { useState } from 'react';

/** Formulario pequeño que demuestra la actualización del estado al escribir. */
export default function FormularioPrueba() {
  const [texto, setTexto] = useState('');

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="nombre-prueba">Nombre</label>
      <input
        id="nombre-prueba"
        name="nombre"
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
      />
      <p aria-live="polite">Texto ingresado: {texto}</p>
    </form>
  );
}
