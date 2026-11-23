import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP } from '../lib/storage';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Resumen() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [address, setAddress] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState(null);
  const total = cart.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0);
  const invalidStock = cart.some((item) => Number(item.stock ?? 0) < 1 || Number(item.cantidad) > Number(item.stock ?? 0));
  const availableBalance = Number(user?.saldo ?? 0);
  const insufficientFunds = user?.rol === 'Cliente' && availableBalance < total;

  useEffect(() => {
    let active = true;
    Promise.all([api.getAddress(), api.getCart()])
      .then(([savedAddress, rows]) => { if (active) { setAddress(savedAddress); setCart(rows); } })
      .catch((error) => { if (active) setMessage({ type: 'error', text: error.message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function finishPurchase() {
    if (!user) { setMessage({ type: 'login', text: 'Para confirmar tu compra necesitas iniciar sesión.' }); return; }
    if (!cart.length) { setMessage({ type: 'empty', text: 'Tu carrito está vacío. Agrega al menos un producto antes de continuar.' }); return; }
    if (!address) { setMessage({ type: 'address', text: 'Debes guardar una dirección de despacho antes de pagar.' }); return; }
    if (invalidStock) { setMessage({ type: 'stock', text: 'El stock de uno o más juegos cambió. Vuelve al carrito y ajusta las cantidades antes de pagar.' }); return; }
    if (insufficientFunds) { setMessage({ type: 'funds', text: `Tu cuenta tiene ${formatCLP(availableBalance)} y el pedido cuesta ${formatCLP(total)}. Agrega fondos para continuar.` }); return; }
    setPaying(true); setMessage(null);
    try {
      await api.createOrder();
      // La compra ya quedó confirmada en el backend. Un fallo al refrescar el perfil
      // no debe mostrarse como si el pedido hubiera fallado o pudiera duplicarse.
      await refreshUser().catch(() => {});
      navigate('/compras', { state: { purchaseSuccess: true } });
    } catch (error) {
      const isFunds = error.status === 402 || /saldo insuficiente/i.test(error.message);
      const isStock = error.status === 409 || /stock insuficiente|stock disponible/i.test(error.message);
      const isSession = error.status === 401;
      const backendReference = error.data?.reference ? ` (referencia: ${error.data.reference})` : '';
      const fallback = error.status === 500
        ? `El backend no pudo completar la compra. No vuelvas a presionar varias veces; revisa el registro del servidor${backendReference}.`
        : 'No se pudo registrar el pedido.';
      setMessage({ type: isFunds ? 'funds' : isStock ? 'stock' : isSession ? 'login' : 'error', text: error.message || fallback });
      if (isFunds || isSession) await refreshUser().catch(() => {});
    } finally { setPaying(false); }
  }

  if (loading) return <div className="container py-5 text-white">Cargando resumen de compra...</div>;

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      <h2 className="text-center mb-4 text-success">¡Pedido Listo para Confirmar!</h2>
      {message && <div className={`alert ${message.type === 'login' || message.type === 'funds' || message.type === 'address' ? 'alert-warning' : 'alert-danger'} shadow-sm d-flex align-items-center gap-3`} role="alert"><i className="bi bi-exclamation-circle fs-3" aria-hidden="true" /><div className="flex-grow-1"><strong>{message.type === 'login' ? '¡Un último paso!' : message.type === 'funds' ? 'Saldo insuficiente' : message.type === 'address' ? 'Falta la dirección' : message.type === 'stock' ? 'Stock insuficiente' : 'No se pudo completar la compra'}</strong><div>{message.text}</div></div>{message.type === 'login' && <Link to="/login" className="btn btn-dark fw-bold">Iniciar sesión</Link>}{message.type === 'funds' && <Link to="/fondos" className="btn btn-dark fw-bold">Agregar fondos</Link>}{message.type === 'address' && <Link to="/direccion" className="btn btn-dark fw-bold">Agregar dirección</Link>}{message.type === 'stock' && <Link to="/carrito" className="btn btn-dark fw-bold">Revisar carrito</Link>}<button type="button" className="btn-close" aria-label="Cerrar mensaje" onClick={() => setMessage(null)} /></div>}
      {user?.rol === 'Cliente' && cart.length > 0 && insufficientFunds && !invalidStock && <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-3" role="status"><div><strong>Necesitas agregar fondos antes de pagar.</strong><div>Saldo disponible: {formatCLP(availableBalance)} · Total del pedido: {formatCLP(total)}</div></div><Link to="/fondos" className="btn btn-dark fw-bold">Agregar fondos</Link></div>}
      <div className="card bg-secondary text-white mb-4 shadow"><div className="card-header bg-black fw-bold">Dirección de Despacho</div><div className="card-body">{address ? <><p className="mb-1"><strong>Nombre:</strong> {address.nombre}</p><p className="mb-1"><strong>Dirección:</strong> {address.calle}</p><p className="mb-1"><strong>Comuna/Ciudad:</strong> {address.comuna}</p><p className="mb-0"><strong>Teléfono:</strong> {address.telefono}</p></> : <p className="text-warning mb-0">No se ha registrado una dirección de despacho.</p>}</div></div>
      <div className="card bg-secondary text-white mb-4 shadow"><div className="card-header bg-black fw-bold">Detalle del Pedido</div><div className="card-body">{invalidStock && <div className="alert alert-warning">Hay productos sin stock suficiente. <Link to="/carrito" className="alert-link">Revisa tu carrito</Link>.</div>}<ul className="list-group list-group-flush mb-3">{cart.length ? cart.map((item) => <li className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-secondary" key={item.id}><div><h6 className="mb-1 fw-bold">{item.nombre}</h6><span className="summary-item-quantity">{item.cantidad} × {formatCLP(item.precio)} c/u</span><div className="summary-item-stock">Stock disponible: {Number(item.stock ?? 0)}</div></div><strong className="summary-item-subtotal">{formatCLP(item.precio * item.cantidad)}</strong></li>) : <li className="list-group-item bg-dark text-white text-center">El carrito está vacío.</li>}</ul><hr /><h4 className="text-end">Total a Pagar: <span className="text-warning">{formatCLP(total)}</span></h4>{user?.rol === 'Cliente' && <p className="text-end mb-0">Saldo disponible: {formatCLP(user.saldo)}</p>}</div></div>
      <div className="d-flex justify-content-between"><Link to="/direccion" className="btn btn-outline-light">Editar Dirección</Link><button type="button" onClick={finishPurchase} className="btn btn-success btn-lg fw-bold" disabled={paying || !cart.length || invalidStock || insufficientFunds}>{paying ? 'Procesando...' : insufficientFunds ? 'Saldo insuficiente' : 'Confirmar y Pagar'}</button></div>
    </div>
  );
}
