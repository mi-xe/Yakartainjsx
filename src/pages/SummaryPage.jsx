import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP, readStorage, writeStorage } from '../lib/storage';

export default function SummaryPage() {
  const navigate = useNavigate();
  const [address] = useState(() => readStorage('direccionDespacho', null));
  const [cart] = useState(() => readStorage('carrito', []));
  const [message, setMessage] = useState(null);
  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  function finishPurchase() {
    const user = readStorage('usuarioLogueado', null);
    if (!user) {
      setMessage({ type: 'login', text: 'Para confirmar tu compra necesitas iniciar sesión.' });
      return;
    }
    if (!cart.length) {
      setMessage({ type: 'empty', text: 'Tu carrito está vacío. Agrega al menos un producto antes de continuar.' });
      return;
    }
    const order = { id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`, usuarioEmail: user.email || user.nombre, fecha: new Date().toISOString().split('T')[0], total, estado: 'Entregado', productos: cart.map(({ nombre, precio, cantidad }) => ({ nombre, precio, cantidad })) };
    const history = readStorage('historialCompras', []);
    history.unshift(order);
    writeStorage('historialCompras', history);
    localStorage.removeItem('carrito');
    localStorage.removeItem('direccionDespacho');
    navigate('/compras');
  }

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      <h2 className="text-center mb-4 text-success">¡Pedido Listo para Confirmar!</h2>

      {message && (
        <div
          className={`alert ${message.type === 'login' ? 'alert-warning' : 'alert-info'} shadow-sm d-flex align-items-center gap-3`}
          role="alert"
        >
          <i className={`bi ${message.type === 'login' ? 'bi-person-lock' : 'bi-cart-x'} fs-3`} aria-hidden="true" />
          <div className="flex-grow-1">
            <strong>{message.type === 'login' ? '¡Un último paso!' : 'Tu carrito necesita atención'}</strong>
            <div>{message.text}</div>
          </div>
          {message.type === 'login' && (
            <Link to="/login" className="btn btn-dark fw-bold">
              Iniciar sesión
            </Link>
          )}
          {message.type === 'empty' && (
            <Link to="/tienda" className="btn btn-primary fw-bold">
              Ver tienda
            </Link>
          )}
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar mensaje"
            onClick={() => setMessage(null)}
          />
        </div>
      )}
      <div className="card bg-secondary text-white mb-4 shadow"><div className="card-header bg-black fw-bold">Dirección de Despacho</div><div className="card-body">{address ? <><p className="mb-1"><strong>Nombre:</strong> {address.nombre || 'No especificado'}</p><p className="mb-1"><strong>Dirección:</strong> {address.calle || ''}</p><p className="mb-1"><strong>Comuna/Ciudad:</strong> {address.comuna || ''}</p><p className="mb-0"><strong>Teléfono:</strong> {address.telefono || 'No especificado'}</p></> : <p className="text-warning mb-0">No se ha registrado una dirección de despacho.</p>}</div></div>
      <div className="card bg-secondary text-white mb-4 shadow"><div className="card-header bg-black fw-bold">Detalle del Pedido</div><div className="card-body"><ul className="list-group list-group-flush mb-3">{cart.length ? cart.map((item) => <li className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-secondary" key={item.nombre}><div><h6 className="mb-0 fw-bold">{item.nombre}</h6><small className="text-secondary">Cantidad: {item.cantidad} x {formatCLP(item.precio)}</small></div><span className="text-warning fw-bold">{formatCLP(item.precio * item.cantidad)}</span></li>) : <li className="list-group-item bg-dark text-white text-center">El carrito está vacío.</li>}</ul><hr /><h4 className="text-end">Total a Pagar: <span className="text-warning">{formatCLP(total)}</span></h4></div></div>
      <div className="d-flex justify-content-between"><Link to="/direccion" className="btn btn-outline-light">Editar Dirección</Link><button type="button" onClick={finishPurchase} className="btn btn-success btn-lg fw-bold">Confirmar y Pagar</button></div>
    </div>
  );
}
