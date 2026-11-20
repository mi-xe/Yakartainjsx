import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP } from '../lib/storage';
import { api } from '../lib/api';

export default function Carrito() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const total = cart.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0);

  async function refreshCart() {
    const rows = await api.getCart();
    setCart(rows);
  }
  useEffect(() => {
    let active = true;
    api.getCart().then((rows) => { if (active) setCart(rows); })
      .catch((error) => { if (active) setApiError(`No se pudo consultar el carrito en MySQL: ${error.message}`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function removeItem(productId) {
    try { await api.removeCartItem(productId); await refreshCart(); setCheckoutError(''); setApiError(''); }
    catch (error) { setApiError(error.message); }
  }
  async function clearCart() {
    try { await api.clearCart(); setCart([]); setCheckoutError(''); setApiError(''); }
    catch (error) { setApiError(error.message); }
  }
  function goToAddress() {
    if (!cart.length) { setCheckoutError('Tu carrito está vacío. Agrega al menos un producto para proceder al pago.'); return; }
    setCheckoutError(''); navigate('/direccion');
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Tu Carrito de Compras</h2>
      {apiError && <div className="alert alert-warning" role="alert">{apiError}</div>}
      <div className="row">
        <div className="col-md-8">
          <ul className="list-group list-group-flush mb-4">
            {loading ? <li className="list-group-item bg-dark text-white border-secondary">Cargando carrito...</li> : cart.length === 0 ? (
              <li className="list-group-item bg-dark text-white border-secondary">El carrito está vacío.</li>
            ) : cart.map((product) => {
              const subtotal = Number(product.precio) * Number(product.cantidad);
              return (
                <li className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center" key={product.id}>
                  <div className="d-flex align-items-center">
                    <img src={`/${product.imagen}`} style={{ width: '50px', height: '60px', objectFit: 'cover' }} className="me-3 rounded" alt={product.nombre} />
                    <div><h6 className="mb-0">{product.nombre}</h6><small className="text-muted">Cantidad: {product.cantidad} x {formatCLP(product.precio)}</small></div>
                  </div>
                  <div><span className="me-3 fw-bold">{formatCLP(subtotal)}</span><button type="button" onClick={() => removeItem(product.productoId)} className="btn btn-danger btn-sm" aria-label={`Quitar ${product.nombre}`}>X</button></div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="col-md-4">
          <div className="card bg-secondary text-white p-3">
            <h4>Resumen</h4><hr />
            {checkoutError && <div className="alert alert-warning mb-3" role="alert">{checkoutError}</div>}
            <h5>Total: <span>{formatCLP(total)}</span></h5>
            <button type="button" onClick={goToAddress} className="btn btn-success w-100 mt-3" disabled={loading}>Proceder al Pago</button>
            <button type="button" onClick={clearCart} className="btn btn-outline-danger w-100 mt-2" disabled={loading || cart.length === 0}>Vaciar Carrito</button>
            <Link to="/" className="btn btn-link text-white text-center mt-2">Volver a la tienda</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
