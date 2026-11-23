import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP, resolveProductImage } from '../lib/storage';
import { api } from '../lib/api';

export default function Carrito() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [updating, setUpdating] = useState({});
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0), [cart]);
  const invalidStock = cart.some((item) => Number(item.stock ?? 0) < 1 || Number(item.cantidad) > Number(item.stock ?? 0));
  const itemCount = cart.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

  async function refreshCart() {
    const rows = await api.getCart();
    setCart(rows);
  }

  useEffect(() => {
    let active = true;
    api.getCart().then((rows) => { if (active) setCart(rows); })
      .catch((error) => { if (active) setApiError(`No se pudo consultar el carrito: ${error.message}`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function removeItem(productId) {
    try {
      await api.removeCartItem(productId);
      await refreshCart();
      setCheckoutError(''); setApiError('');
    } catch (error) { setApiError(error.message); }
  }

  async function changeQuantity(product, nextQuantity) {
    if (nextQuantity < 1) return;
    const stock = Math.max(0, Number(product.stock ?? 0));
    if (nextQuantity > stock) {
      setCheckoutError(`Solo quedan ${stock} unidades de ${product.nombre}.`);
      return;
    }
    setUpdating((current) => ({ ...current, [product.productoId]: true }));
    try {
      await api.updateCartItem(product.productoId, nextQuantity);
      await refreshCart();
      setCheckoutError(''); setApiError('');
    } catch (error) {
      setApiError(error.message || 'No se pudo actualizar la cantidad.');
      if (error.status === 409) await refreshCart().catch(() => {});
    } finally {
      setUpdating((current) => ({ ...current, [product.productoId]: false }));
    }
  }

  async function clearCart() {
    try { await api.clearCart(); setCart([]); setCheckoutError(''); setApiError(''); }
    catch (error) { setApiError(error.message); }
  }

  function goToAddress() {
    if (!cart.length) { setCheckoutError('Tu carrito está vacío. Agrega al menos un producto para proceder al pago.'); return; }
    if (invalidStock) { setCheckoutError('Hay productos sin stock suficiente. Ajusta las cantidades o quítalos del carrito antes de continuar.'); return; }
    setCheckoutError(''); navigate('/direccion');
  }

  return (
    <main className="yakarta-cart container py-5">
      <header className="cart-heading">
        <div><span className="cart-eyebrow">YAKARTA / TU SELECCIÓN</span><h1>Tu carrito</h1><p>Revisa tus juegos y las unidades que quieres llevar.</p></div>
        <Link to="/tienda" className="cart-continue-link"><i className="bi bi-arrow-left me-2" />Seguir comprando</Link>
      </header>

      {apiError && <div className="alert alert-danger" role="alert">{apiError}</div>}
      {checkoutError && <div className="cart-alert" role="alert"><i className="bi bi-exclamation-triangle-fill" />{checkoutError}</div>}

      <div className="cart-layout">
        <section className="cart-items-panel" aria-label="Productos del carrito">
          <div className="cart-panel-heading"><h2>Productos</h2><span>{itemCount} {itemCount === 1 ? 'unidad' : 'unidades'}</span></div>
          {loading ? <div className="cart-empty-state">Cargando tu carrito...</div> : cart.length === 0 ? (
            <div className="cart-empty-state"><i className="bi bi-cart-x" /><h3>Tu carrito está vacío</h3><p>Explora la tienda y agrega los juegos que quieras.</p><Link to="/tienda" className="cart-primary-link">Explorar juegos</Link></div>
          ) : cart.map((product) => {
            const quantity = Number(product.cantidad || 0);
            const stock = Math.max(0, Number(product.stock ?? 0));
            const insufficient = stock < 1 || quantity > stock;
            const subtotal = Number(product.precio) * quantity;
            const busy = Boolean(updating[product.productoId]);
            return (
              <article className={`cart-item ${insufficient ? 'has-stock-warning' : ''}`} key={product.productoId}>
                <img className="cart-item-image" src={resolveProductImage(product.imagen)} alt={`Portada de ${product.nombre}`} />
                <div className="cart-item-main">
                  <div className="cart-item-title-row"><h3>{product.nombre}</h3><span className="cart-unit-price">{formatCLP(product.precio)} <small>/ unidad</small></span></div>
                  <div className="cart-stock-line"><i className={`bi ${insufficient ? 'bi-exclamation-circle' : 'bi-box-seam'}`} />{insufficient ? (stock < 1 ? 'Sin stock disponible' : `Solo quedan ${stock} unidades; ajusta tu cantidad`) : `Stock disponible: ${stock} ${stock === 1 ? 'unidad' : 'unidades'}`}</div>
                  <div className="cart-item-controls">
                    <div className="cart-quantity-control" aria-label={`Cantidad de ${product.nombre}`}>
                      <button type="button" onClick={() => changeQuantity(product, quantity - 1)} disabled={busy || quantity <= 1} aria-label={`Disminuir cantidad de ${product.nombre}`}><i className="bi bi-dash-lg" /></button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => changeQuantity(product, quantity + 1)} disabled={busy || quantity >= stock} aria-label={`Aumentar cantidad de ${product.nombre}`}><i className="bi bi-plus-lg" /></button>
                    </div>
                    <button type="button" className="cart-remove-button" onClick={() => removeItem(product.productoId)} disabled={busy}><i className="bi bi-trash3 me-1" />Quitar</button>
                  </div>
                </div>
                <div className="cart-item-subtotal"><small>Subtotal</small><strong>{formatCLP(subtotal)}</strong></div>
              </article>
            );
          })}
          {cart.length > 0 && <button type="button" className="cart-clear-button" onClick={clearCart} disabled={loading}><i className="bi bi-trash3 me-2" />Vaciar carrito</button>}
        </section>

        <aside className="cart-summary-panel">
          <span className="cart-eyebrow">RESUMEN</span><h2>Tu compra</h2>
          <div className="cart-summary-row"><span>Unidades</span><strong>{itemCount}</strong></div>
          <div className="cart-summary-row"><span>Productos distintos</span><strong>{cart.length}</strong></div>
          <div className="cart-summary-total"><span>Total</span><strong>{formatCLP(total)}</strong></div>
          <p className="cart-summary-note"><i className="bi bi-shield-check me-2" />El inventario se descuenta al confirmar y pagar el pedido.</p>
          <button type="button" onClick={goToAddress} className="cart-checkout-button" disabled={loading || !cart.length || invalidStock}>Continuar al despacho <i className="bi bi-arrow-right ms-2" /></button>
          {invalidStock && <p className="cart-summary-warning">Corrige las cantidades de los productos sin stock para continuar.</p>}
          <Link to="/tienda" className="cart-back-link">Volver a la tienda</Link>
        </aside>
      </div>
    </main>
  );
}
