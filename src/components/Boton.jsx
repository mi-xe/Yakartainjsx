import React from 'react';

export default function Boton({ etiqueta, onClick, tipo = 'button' }) {
  return (
    <button type={tipo} onClick={onClick}>
      {etiqueta}
    </button>
  );
}
