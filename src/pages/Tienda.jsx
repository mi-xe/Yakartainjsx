import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCLP, getProductPrice, resolveProductImage } from '../lib/storage';
import { findLegacyDescription, findLegacyPreviewImages, normalizeCatalogName } from '../lib/catalogMetadata';

const normalize = normalizeCatalogName;

export default function Tienda() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [offerOnly, setOfferOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeShot, setActiveShot] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let active = true;
    const loadProducts = () => {
      setLoadingProducts(true);
      api.products().then((rows) => {
        if (!active) return;
        const mapped = rows.map((p) => ({ ...p, stock: Math.max(0, Number(p.stock ?? 0)), enOferta: Boolean(p.enOferta), precioOferta: p.precioOferta == null ? null : Number(p.precioOferta), precio: Number(p.precio) }));
        setProducts(mapped);
        setApiError('');
      }).catch((error) => {
        if (active) setApiError(`No se pudo cargar el catálogo desde MySQL: ${error.message}`);
      }).finally(() => { if (active) setLoadingProducts(false); });
    };
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') loadProducts(); };
    loadProducts();
    window.addEventListener('focus', loadProducts);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener('focus', loadProducts);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    const requested = normalize(searchParams.get('juego') || '');
    if (!requested || !products.length) return;

    // Prioriza la coincidencia exacta para evitar abrir otro producto con un
    // nombre parecido; la coincidencia parcial queda como compatibilidad.
    const found = products.find((product) => normalize(product.nombre) === requested)
      || products.find((product) => normalize(product.nombre).includes(requested));

    if (found) {
      setSelectedProduct(found);
      setActiveShot(0);
    }
  }, [products, searchParams]);

  const categories = useMemo(() => ['Todas', ...new Set(products.map((product) => product.categoria || 'Otros'))], [products]);
  const visibleProducts = products.filter((product) =>
    (categoryFilter === 'Todas' || product.categoria === categoryFilter) && (!offerOnly || product.enOferta) && normalize(product.nombre).includes(normalize(search))
  );

  function getShots(product) {
    const customShots = Array.isArray(product.imagenesPreview)
      ? product.imagenesPreview.map(image => resolveProductImage(image, '')).filter(Boolean)
      : [];
    const shots = customShots.length ? customShots : findLegacyPreviewImages(product.nombre);
    return [resolveProductImage(product.imagen), ...shots]
      .filter((src, index, list) => src && list.indexOf(src) === index);
  }

  function getPlatforms(product) {
    return Array.isArray(product.plataformas) && product.plataformas.length ? product.plataformas : ['PC'];
  }

  function renderPlatformTag(product, compact = false) {
    const platforms = getPlatforms(product);
    const includesPc = platforms.includes('PC');
    const includesConsole = platforms.some(platform => platform !== 'PC');
    return (
      <span className={`store-platform-tag ${compact ? 'compact' : ''}`} title={platforms.join(', ')}>
        {includesPc && <i className="bi bi-pc-display" aria-hidden="true" />}
        {includesConsole && <i className="bi bi-controller" aria-hidden="true" />}
        <span>{compact ? platforms.join(' · ') : platforms.join(' / ')}</span>
      </span>
    );
  }

  function getProductDescription(product, detail = false) {
    const customDescription = String(product.descripcion || '').trim();
    if (customDescription) return customDescription;
    return findLegacyDescription(product.nombre) || (detail
      ? `Explora ${product.nombre}, un título de ${String(product.categoria || 'videojuegos').toLowerCase()} que merece un lugar en tu colección. Revisa sus imágenes y añádelo al carrito cuando estés listo.`
      : `Descubre ${product.nombre}, una experiencia de ${String(product.categoria || 'videojuegos').toLowerCase()} que puedes sumar a tu colección.`);
  }

  function getAvailableStock(product) {
    return Math.max(0, Number(product?.stock ?? 0));
  }

  async function addToCart(product, goToCart = false) {
    if (getAvailableStock(product) < 1) {
      setApiError(`${product.nombre} está fuera de stock en este momento.`);
      setSuccessMessage('');
      return;
    }
    try {
      await api.addCartItem(product.id, 1);
      setApiError('');
      setSuccessMessage(`${product.nombre} se agregó al carrito.`);
      if (goToCart) navigate('/carrito');
    } catch (error) {
      setApiError(error.message || 'No se pudo agregar el producto al carrito.');
      setSuccessMessage('');
    }
  }

  function closePreview() {
    setSelectedProduct(null);
    if (searchParams.has('juego')) setSearchParams({}, { replace: true });
  }

  return (
    <main className="yakarta-store container-fluid px-3 px-lg-5 py-4">
      <header className="store-heading d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div><span className="store-eyebrow">YAKARTA / CATÁLOGO</span><h1>Descubre tu próximo juego</h1><p>Explora, mira capturas y encuentra tu próxima aventura.</p></div>
        <button type="button" className="btn store-cart-btn" onClick={() => navigate('/carrito')}><i className="bi bi-cart3 me-2" />Ver carrito</button>
      </header>
      {apiError && <div className="alert alert-warning" role="alert">{apiError}</div>}
      {successMessage && <div className="store-notice" role="status"><i className="bi bi-check-circle-fill me-2" />{successMessage}<button type="button" aria-label="Cerrar mensaje" onClick={() => setSuccessMessage('')}>×</button></div>}
      <section className="store-toolbar" aria-label="Filtros de juegos">
        <div className="store-search"><i className="bi bi-search" /><input aria-label="Buscar juego" placeholder="Buscar juegos..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select aria-label="Filtrar por categoría" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category === 'Todas' ? 'Todas las categorías' : category}</option>)}</select>
        <label className="store-offer-filter"><input type="checkbox" checked={offerOnly} onChange={(event) => setOfferOnly(event.target.checked)} /> Solo ofertas</label>
        <span className="store-count">{visibleProducts.length} juegos</span>
      </section>
      {loadingProducts && <p className="text-center text-secondary py-4" role="status">Cargando catálogo desde MySQL...</p>}
      <section className="store-grid" aria-label="Catálogo de juegos">
        {visibleProducts.map((product) => {
          const price = getProductPrice(product);
          const shots = getShots(product);
          const onSale = product.enOferta && price < product.precio;
          const stock = getAvailableStock(product);
          const outOfStock = stock === 0;
          return <article className={`store-game-card ${outOfStock ? 'is-out-of-stock' : ''}`} key={product.id ?? product.nombre}>
            <button className="store-cover-button" type="button" onClick={() => { setSelectedProduct(product); setActiveShot(0); }} aria-label={`Ver detalles de ${product.nombre}`}>
              <img className="store-cover" src={resolveProductImage(product.imagen)} alt={`Portada de ${product.nombre}`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = shots.find((shot) => shot !== resolveProductImage(product.imagen)) || '/imgtienda/peak.jpg'; }} />
              {onSale && <span className="store-sale-badge">OFERTA</span>}
              {outOfStock && <span className="store-out-stock-badge"><i className="bi bi-slash-circle me-1" />FUERA DE STOCK</span>}
              <span className="store-quickview"><i className="bi bi-eye me-2" />Vista rápida</span>
            </button>
            <div className="store-game-info">
              <div className="store-game-meta"><span>{product.categoria || 'Otros'}</span>{onSale && <small>Precio especial</small>}</div>
              <button type="button" className="store-game-title" onClick={() => { setSelectedProduct(product); setActiveShot(0); }}>{product.nombre}</button>
              <p className="store-game-description">{getProductDescription(product)}</p>
              <div className="store-card-platforms">{renderPlatformTag(product, true)}</div>
              <div className="store-game-footer"><div className="store-price">{onSale && <del>{formatCLP(product.precio)}</del>}<strong>{formatCLP(price)}</strong></div><button type="button" className="store-add-btn" onClick={() => addToCart(product)} disabled={outOfStock} aria-label={outOfStock ? `${product.nombre} fuera de stock` : `Agregar ${product.nombre} al carrito`}><i className={`bi ${outOfStock ? 'bi-ban' : 'bi-cart-plus'}`} /><span>{outOfStock ? 'Agotado' : 'Agregar'}</span></button></div>
            </div>
          </article>;
        })}
        {!loadingProducts && !visibleProducts.length && <div className="store-empty"><i className="bi bi-controller" /><h2>No encontramos juegos</h2><p>Prueba con otro nombre o cambia los filtros.</p><button className="store-cart-btn" onClick={() => { setSearch(''); setCategoryFilter('Todas'); setOfferOnly(false); }}>Limpiar filtros</button></div>}
      </section>
      {selectedProduct && (() => {
        const shots = getShots(selectedProduct);
        const price = getProductPrice(selectedProduct);
        const onSale = selectedProduct.enOferta && price < selectedProduct.precio;
        const stock = getAvailableStock(selectedProduct);
        const outOfStock = stock === 0;
        return <div className="store-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
          <section className="store-detail-modal" role="dialog" aria-modal="true" aria-labelledby="store-detail-title">
            <button type="button" className="store-modal-close" onClick={closePreview} aria-label="Cerrar vista del juego">×</button>
            <div className="store-detail-layout">
              <div className="store-detail-media"><div className="store-main-shot"><img src={shots[activeShot] || shots[0]} alt={`Captura ${activeShot + 1} de ${selectedProduct.nombre}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = resolveProductImage(selectedProduct.imagen); }} /></div><div className="store-shot-strip">{shots.map((shot, index) => <button key={shot} type="button" className={activeShot === index ? 'is-active' : ''} onClick={() => setActiveShot(index)} aria-label={`Mostrar captura ${index + 1}`}><img src={shot} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = resolveProductImage(selectedProduct.imagen); }} /></button>)}</div></div>
              <div className="store-detail-copy"><span className="store-eyebrow">{selectedProduct.categoria || 'VIDEOJUEGO'} / DETALLES</span><h2 id="store-detail-title">{selectedProduct.nombre}</h2><p>{getProductDescription(selectedProduct, true)}</p><div className="store-detail-tags">{renderPlatformTag(selectedProduct)}<span><i className="bi bi-images me-1" />{shots.length} imágenes</span><span className={`store-stock-badge ${outOfStock ? 'is-empty' : stock <= 3 ? 'is-low' : 'is-available'}`}><i className={`bi ${outOfStock ? 'bi-slash-circle' : 'bi-box-seam'} me-1`} />{outOfStock ? 'Fuera de stock' : `Stock disponible: ${stock} ${stock === 1 ? 'unidad' : 'unidades'}`}</span></div><div className="store-detail-purchase"><div className="store-price">{onSale && <del>{formatCLP(selectedProduct.precio)}</del>}<strong>{formatCLP(price)}</strong></div><button type="button" className="store-buy-btn" onClick={() => addToCart(selectedProduct, true)} disabled={outOfStock}><i className={`bi ${outOfStock ? 'bi-ban' : 'bi-bag-check'} me-2`} />{outOfStock ? 'No disponible' : 'Comprar ahora'}</button><button type="button" className="store-add-wide" onClick={() => addToCart(selectedProduct)} disabled={outOfStock}><i className="bi bi-cart-plus me-2" />Agregar al carrito</button></div><p className="store-detail-note">{outOfStock ? 'Este juego volverá a estar disponible cuando se reponga el inventario.' : 'El stock se actualiza automáticamente al confirmar una compra.'}</p></div>
            </div>
          </section>
        </div>;
      })()}
    </main>
  );
}
