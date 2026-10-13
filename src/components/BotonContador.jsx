import React, { useState } from 'react';
import Boton from './Boton.jsx';

export default function BotonContador({ onAccion }) {
  const [contador, setContador] = useState(0);

  function manejarClick() {
    setContador((valor) => valor + 1);
    onAccion?.();
  }

  return (
    <section>
      <p>Contador: {contador}</p>
      <Boton etiqueta="Incrementar" onClick={manejarClick} />
    </section>
  );
}
