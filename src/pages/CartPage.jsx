import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP, readStorage, writeStorage } from '../lib/storage';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => readStorage('carrito', []));
  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  function removeItem(index) {
    const next = cart.filter((_, itemIndex) => itemIndex !== index);
    setCart(next);
    writeStorage('carrito', next);
  }

  function clearCart() {
    localStorage.removeItem('carrito');
    setCart([]);
  }

  function goToAddress() {
    if (!cart.length) {
      alert('Tu carrito está vacío. Agrega al menos un producto para proceder al pago.');
      return;
    }
    navigate('/direccion');
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Tu Carrito de Compras</h2>
      <div className="row">
        <div className="col-md-8">
          <ul className="list-group list-group-flush mb-4">
            {cart.length === 0 ? (
              <li className="list-group-item bg-dark text-white border-secondary">El carrito está vacío.</li>
            ) : cart.map((product, index) => {
              const subtotal = product.precio * product.cantidad;
              return (
                <li className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center" key={`${product.nombre}-${index}`}>
                  <div className="d-flex align-items-center">
                    <img src={`/${product.imagen}`} style={{ width: '50px', height: '60px', objectFit: 'cover' }} className="me-3 rounded" alt={product.nombre} />
                    <div><h6 className="mb-0">{product.nombre}</h6><small className="text-muted">Cantidad: {product.cantidad} x {formatCLP(product.precio)}</small></div>
                  </div>
                  <div><span className="me-3 fw-bold">{formatCLP(subtotal)}</span><button type="button" onClick={() => removeItem(index)} className="btn btn-danger btn-sm">X</button></div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="col-md-4">
          <div className="card bg-secondary text-white p-3">
            <h4>Resumen</h4><hr />
            <h5>Total: <span>{formatCLP(total)}</span></h5>
            <button type="button" onClick={goToAddress} className="btn btn-success w-100 mt-3">Proceder al Pago</button>
            <button type="button" onClick={clearCart} className="btn btn-outline-danger w-100 mt-2">Vaciar Carrito</button>
            <Link to="/" className="btn btn-link text-white text-center mt-2">Volver a la tienda</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
