import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCLP } from '../lib/utils';

export default function Resumen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [address, setAddress] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.address(), api.cart()])
      .then(([savedAddress, savedCart]) => {
        if (!active) return;
        setAddress(savedAddress);
        setCart(savedCart.items || []);
      })
      .catch((error) => active && setMessage({ type: 'error', text: error.message }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const total = cart.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0);

  async function finishPurchase() {
    if (!user) {
      setMessage({ type: 'login', text: 'Para confirmar tu compra necesitas iniciar sesión.' });
      return;
    }
    if (!cart.length) {
      setMessage({ type: 'empty', text: 'Tu carrito está vacío. Agrega al menos un producto antes de continuar.' });
      return;
    }
    if (!address) {
      setMessage({ type: 'address', text: 'Registra una dirección de despacho antes de pagar.' });
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      await api.checkout();
      navigate('/compras', { state: { purchaseCompleted: true } });
    } catch (error) {
      if (error.code === 'INSUFFICIENT_BALANCE') {
        setMessage({ type: 'funds', text: error.message });
      } else {
        setMessage({ type: 'error', text: error.message || 'No se pudo registrar el pedido.' });
      }
    } finally {
      setProcessing(false);
    }
  }

  const messageTitle = message?.type === 'login' ? '¡Un último paso!' : message?.type === 'funds' ? 'Saldo insuficiente' : 'Tu compra necesita atención';

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      <h2 className="text-center mb-4 text-success">¡Pedido Listo para Confirmar!</h2>
      {loading && <div className="alert alert-info">Cargando información desde MySQL...</div>}
      {message && (
        <div className="alert alert-warning shadow-sm d-flex align-items-center gap-3" role="alert">
          <i className="bi bi-exclamation-circle fs-3" aria-hidden="true" />
          <div className="flex-grow-1"><strong>{messageTitle}</strong><div>{message.text}</div></div>
          {message.type === 'login' && <Link to="/login" className="btn btn-dark fw-bold">Iniciar sesión</Link>}
          {message.type === 'funds' && <Link to="/fondos" className="btn btn-dark fw-bold">Agregar fondos</Link>}
          {message.type === 'address' && <Link to="/direccion" className="btn btn-dark fw-bold">Ingresar dirección</Link>}
          {message.type === 'empty' && <Link to="/tienda" className="btn btn-primary fw-bold">Ver tienda</Link>}
          <button type="button" className="btn-close" aria-label="Cerrar mensaje" onClick={() => setMessage(null)} />
        </div>
      )}
      <div className="card bg-secondary text-white mb-4 shadow"><div className="card-header bg-black fw-bold">Dirección de Despacho</div><div className="card-body">{address ? <><p className="mb-1"><strong>Nombre:</strong> {address.nombre || 'No especificado'}</p><p className="mb-1"><strong>Dirección:</strong> {address.calle || ''}</p><p className="mb-1"><strong>Comuna/Ciudad:</strong> {address.comuna || ''}</p><p className="mb-0"><strong>Teléfono:</strong> {address.telefono || 'No especificado'}</p></> : <p className="text-warning mb-0">No se ha registrado una dirección de despacho.</p>}</div></div>
      <div className="card bg-secondary text-white mb-4 shadow"><div className="card-header bg-black fw-bold">Detalle del Pedido</div><div className="card-body"><ul className="list-group list-group-flush mb-3">{cart.length ? cart.map((item) => <li className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-secondary" key={item.id}><div><h6 className="mb-0 fw-bold">{item.nombre}</h6><small className="text-secondary">Cantidad: {item.cantidad} x {formatCLP(item.precio)}</small></div><span className="text-warning fw-bold">{formatCLP(item.precio * item.cantidad)}</span></li>) : <li className="list-group-item bg-dark text-white text-center">El carrito está vacío.</li>}</ul><hr /><h4 className="text-end">Total a Pagar: <span className="text-warning">{formatCLP(total)}</span></h4></div></div>
      <div className="d-flex justify-content-between"><Link to="/direccion" className="btn btn-outline-light">Editar Dirección</Link><button type="button" onClick={finishPurchase} className="btn btn-success btn-lg fw-bold" disabled={loading || processing}>{processing ? 'Procesando...' : 'Confirmar y Pagar'}</button></div>
    </div>
  );
}
