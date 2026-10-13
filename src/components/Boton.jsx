import React from 'react';

/** Botón reutilizable: recibe una etiqueta y una función para el clic. */
export default function Boton({ etiqueta, onClick, tipo = 'button' }) {
  return (
    <button type={tipo} onClick={onClick}>
      {etiqueta}
    </button>
  );
}
