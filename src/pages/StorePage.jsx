import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultProducts } from '../lib/products';
import { formatCLP, readStorage, writeStorage } from '../lib/storage';

export default function StorePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(() => {
    const saved = readStorage('productosTienda', null);
    return saved?.length ? saved : defaultProducts;
  });

  useEffect(() => writeStorage('productosTienda', products), [products]);

  function addToCart(product) {
    const cart = readStorage('carrito', []);
    const existing = cart.find((item) => item.nombre === product.nombre);
    if (existing) existing.cantidad += 1;
    else cart.push({ ...product, cantidad: 1 });
    writeStorage('carrito', cart);
    alert(`${product.nombre} se agregó exitosamente al carrito`);
  }

  return (
    <div className="container text-center my-4">
      <div className="row align-items-stretch">
        {products.map((product) => (
          <div className="col-md-4 mb-4" key={product.id ?? product.nombre}>
            <div className="card bg-dark text-white h-100">
              <img src={`/${product.imagen}`} className="card-img-top img-juego" alt={product.nombre} />
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <h5 className="card-title">{product.nombre}</h5>
                  <p className="card-text">{formatCLP(product.precio)}</p>
                </div>
                <button type="button" onClick={() => addToCart(product)} className="btn btn-primary w-100 mt-3">Agregar al carrito</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-outline-light mt-2" onClick={() => navigate('/carrito')}>Ver carrito</button>
    </div>
  );
}
