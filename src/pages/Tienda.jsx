import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultProducts } from '../lib/products';
import { apiRequest } from '../lib/api';
import { formatCLP, getProductPrice, readStorage, writeStorage } from '../lib/storage';

export default function Tienda() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [offerOnly, setOfferOnly] = useState(false);
  const [products, setProducts] = useState(() => {
    const saved = readStorage('productosTienda', null);
    return (saved?.length ? saved : defaultProducts).map((product) => {
      const original = defaultProducts.find((item) => item.id === product.id || item.nombre === product.nombre);
      return { ...original, ...product, categoria: product.categoria || original?.categoria || 'Otros' };
    });
  });

  useEffect(() => {
    let active = true;
    apiRequest('products').then(({ products: dbProducts }) => {
      if (!active || !dbProducts.length) return;
      const mapped = dbProducts.map((p) => ({ ...p, enOferta: Boolean(Number(p.enOferta)), precioOferta: p.precioOferta == null ? null : Number(p.precioOferta), precio: Number(p.precio) }));
      setProducts(mapped);
      writeStorage('productosTienda', mapped);
    }).catch(() => { /* Si la API no está disponible, se mantiene el catálogo local. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => writeStorage('productosTienda', products), [products]);

  const categories = useMemo(() => ['Todas', ...new Set(products.map((product) => product.categoria || 'Otros'))], [products]);
  const visibleProducts = products.filter((product) =>
    (categoryFilter === 'Todas' || product.categoria === categoryFilter) && (!offerOnly || product.enOferta)
  );

  function addToCart(product) {
    const cart = readStorage('carrito', []);
    const existing = cart.find((item) => item.nombre === product.nombre);
    if (existing) existing.cantidad += 1;
    else cart.push({ ...product, precio: getProductPrice(product), cantidad: 1 });
    writeStorage('carrito', cart);
    setSuccessMessage(`${product.nombre} se agregó exitosamente al carrito.`);
  }

  return (
    <div className="container my-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div><h2 className="text-white mb-1">Tienda de juegos</h2><p className="text-secondary mb-0">Encuentra tu próximo juego favorito.</p></div>
        <button type="button" className="btn btn-outline-light" onClick={() => navigate('/carrito')}> <i className="bi bi-cart3 me-2" />Ver carrito</button>
      </div>
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show text-start" role="alert">
          <i className="bi bi-check-circle me-2" aria-hidden="true" />{successMessage}
          <button type="button" className="btn-close" aria-label="Cerrar mensaje" onClick={() => setSuccessMessage('')} />
        </div>
      )}
      <div className="row g-3 align-items-end mb-4 p-3 rounded bg-dark">
        <div className="col-sm-6 col-md-4">
          <label htmlFor="filtroCategoria" className="form-label text-white">Filtrar por categoría</label>
          <select id="filtroCategoria" className="form-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="col-sm-6 col-md-4">
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="soloOfertas" checked={offerOnly} onChange={(event) => setOfferOnly(event.target.checked)} />
            <label className="form-check-label text-white" htmlFor="soloOfertas">Mostrar solo juegos en oferta</label>
          </div>
        </div>
        <div className="col-md-4 text-md-end"><span className="text-secondary" aria-live="polite">{visibleProducts.length} juego(s)</span></div>
      </div>
      <div className="row align-items-stretch">
        {visibleProducts.map((product) => {
          const price = getProductPrice(product);
          return (
            <div className="col-md-4 col-lg-3 mb-4" key={product.id ?? product.nombre}>
              <div className="card bg-dark text-white h-100 position-relative">
                {product.enOferta && price < product.precio && <span className="badge bg-danger position-absolute top-0 start-0 m-2 fs-6">¡OFERTA!</span>}
                <img src={`/${product.imagen}`} className="card-img-top img-juego" alt={product.nombre} />
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <span className="badge bg-secondary mb-2">{product.categoria || 'Otros'}</span>
                    <h5 className="card-title">{product.nombre}</h5>
                    {product.enOferta && price < product.precio ? (
                      <p className="card-text"><span className="text-decoration-line-through text-secondary me-2">{formatCLP(product.precio)}</span><strong className="text-warning">{formatCLP(price)}</strong></p>
                    ) : <p className="card-text">{formatCLP(price)}</p>}
                  </div>
                  <button type="button" onClick={() => addToCart(product)} className="btn btn-primary w-100 mt-3">Agregar al carrito</button>
                </div>
              </div>
            </div>
          );
        })}
        {!visibleProducts.length && <div className="col-12"><p className="alert alert-info">No hay juegos que coincidan con estos filtros.</p></div>}
      </div>
    </div>
  );
}
