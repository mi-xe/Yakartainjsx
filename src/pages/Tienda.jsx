import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCLP, getProductPrice } from '../lib/utils';

const previewImages = {
  'dead by daylight': ['/imgdbd/856303.webp', '/imgdbd/dead-by-daylight-2v8-mode-teaser-trailer-screenshots_uf26.jpg', '/imgdbd/dead-by-daylight---gameplay---6-1920x1080-0b71c2ea2600.png'],
  'nfs: shift': ['/imgtienda/nfs shift.jpg', '/img/nfsshiftprev2.jpg', '/img/ye3xwidqwlspnngcabyr.jpg'],
  'midnight club': ['/imgmidnight/midnight-club-los-angeles-j-v0-4lh17lr088eh1.jpg', '/imgmidnight/midnight-club-los-angeles-rockstar-games-hd-wallpaper-preview.jpg'],
  'gran turismo 5': ['/imggranturismo/1.jpg', '/imggranturismo/2.jpeg', '/imggranturismo/3.jpg'],
  'transformers: the game': ['/imgtrans/images.jpg', '/imgtrans/barricade high.png', '/imgtrans/bumblebee1 high.png'],
  'fifa street 2': ['/img/fifa2prev.jfif', '/img/fifa2prev2.jpg'],
  'black': ['/img/blackprev.jfif', '/img/blackprev2.webp'],
  'Burnout 3: Takedown': ['/img/burnout3prev.jfif', '/img/burnout3prev2.jfif'],
  'Dragon ball tenkaichi 3': ['/img/dbd3prev.webp', '/img/dbd3prev1.webp'],
  'Peak': ['/img/peakprev.webp', '/img/peakprev1.webp'],
  'Zelda: Ocarina of time': ['/img/zeldaprev.webp', '/img/zeldaprev1.webp'],
  'The outlast trials': ['/img/outlastprev.webp', '/img/outlastprev1.webp'],
  'Undertale': ['/img/undprev.webp', '/img/undprev1.webp'],
  'Warcraft 3: Frozen throne': ['/img/w3prev.webp', '/img/w3prev1.webp'],
  'gran turismo 4': ['/img/gt4prev.webp', '/img/gt4prev1.webp'],
  'Detroit': ['/img/dprev.webp', '/img/dprev1.webp', '/img/dprev2.webp'],
  'Red dead redemption 2': ['/img/rdr2prev.webp', '/img/rdr2prev1.webp'],
  'Papers please': ['/img/ppprev.webp', '/img/ppprev1.webp'],
  'Mortal kombat 1': ['/img/mk1prev.webp', '/img/mk1prev1.webp', '/img/mk1prev2.webp'],
  'Resident evil requiem': ['/img/re9prev.webp', '/img/re9prev1.webp'],   
  'Pink extinct reprieve 2': ['/img/rdr2pinkprev.webp', '/img/rdr2pinkprev1.webp'],  
  'Webfishing': ['/img/webprev.webp', '/img/webprev1.webp'],  
  'Automobilista 2': ['/img/at2prev.webp', '/img/at2prev1.webp'],  
  'Left 4 dead 2': ['/img/l4d2prev.webp', '/img/l4d2prev1.webp'],  
  'Cyberpunk': ['/img/c2077prev.webp', '/img/c2077prev1.webp'],  
  'GTA VI': ['/img/gta6prev.webp', '/img/gta6prev1.webp'],  
  'Blue alive condemnation 2': ['/img/rdr2blueprev3.webp', '/img/rdr2blueprev2.webp'],  
};
const categoryImages = {
  Carreras: ['/imgmidnight/midnight-club-los-angeles-rockstar-games-hd-wallpaper-preview.jpg', '/imggranturismo/1.jpg', '/img/ye3xwidqwlspnngcabyr.jpg'],
  Terror: ['/imgdbd/856303.webp', '/imgdbd/images.jpg', '/imgdbd/RGLqoqnoky7QXAfXnKQLam-1920-80.jpg'],
  Acción: ['/imgtrans/images.jpg', '/imgtrans/barricade high.png', '/imgdbd/images.jpg'],
  Aventura: ['/imgtienda/rdr2.webp', '/imgtienda/peak.jpg', '/imgtienda/zelda.jpg'],
};
const descriptions = {
  'dead by daylight': 'Un juego de terror multijugador asimétrico: cuatro supervivientes intentan escapar de un asesino en una experiencia de tensión, estrategia y persecuciones.',
  'nfs: shift': 'El premiado Need for Speed™ SHIFT es un auténtico juego de carreras que combina la experiencia real del conductor con una física realista, modelos de coches totalmente perfectos y una amplia variedad de pistas de carreras auténticas.',
  'midnight club': 'LA MEJOR MANERA DE VER LOS ÁNGELES ES A 395 KM/H. Corre a toda velocidad por las calles de la ciudad, recreadas con todo detalle. Maneja la mejor gama de muscle cars, coches tuneados, sofisticados y supermotos de hoy en día. Personaliza tu vehículo con las mejores piezas de alto rendimiento y carrocería del mercado. Carreras callejeras ilegales sin pista, sin tiempo, sin reglas: bienvenido a Midnight Club',
  'gran turismo 5': 'Una experiencia de conducción con una amplia selección de coches y circuitos para quienes disfrutan de la competición automovilística.',
  'fifa street 2': 'Con FIFA Street 2 ya no vas a necesitar un estadio de lo más moderno; ahora puedes echarte unos partiditos urbanos en la Westway de Londres, machacar las calles de Ámsterdam, o acabar en las playas de Brasil jugando al fútbol a ritmo de samba. Compitiendo en equipos de 4 contra 4 y gracias a la opción Trick Stick que te permite engañar a tu oponente, podrás hacer jugadas de escándalo que dejarían de piedra a Pelé.',
  'black': 'Black es un videojuego de disparos en primera persona desarrollado por Criterion Games y publicado por Electronic Arts',
  'burnout 3: takedown': 'Burnout 3: Takedown es un videojuego de carreras de estilo arcade desarrollado por Criterion Games y publicado por Electronic Arts (EA) en septiembre de 2004',
  'dragon ball tenkaichi 3': 'Dragon Ball Z: Budokai Tenkaichi 3 (conocido en Japón como Dragon Ball Z: Sparking! Meteor) es un videojuego de acción y lucha en 3D desarrollado por Spike y publicado por Atari y Namco Bandai en 2007',
  'peak': 'PEAK es un juego de escalada cooperativo, donde el más mínimo error puede significar tu perdición. Ya sea en solitario o con un grupo de exploradores perdidos, tu única esperanza de que te rescaten de una misteriosa isla es escalar la montaña central. ¿Tienes lo necesario para llegar a la cima?',
  'zelda: ocarina of time': 'Link se embarca en un periplo de leyenda a través del tiempo para detener a Ganondorf, el rey de los ladrones Gerudo, que busca la Trifuerza: una reliquia sagrada que otorga poder ilimitado a su poseedor.',
  'the outlast trials': 'Red Barrels te invita a experimentar un terror paralizante, esta vez en compañía de amigos. Ya sea que afrontes las pruebas en solitario o en equipo, si logras sobrevivir el tiempo suficiente y completar la terapia, Murkoff te dejará marchar con gusto… pero ¿seguirás siendo la misma persona?',
  'undertale': 'UNDERTALE: El juego de rol en el que no tienes que destruir a nadie.',
  'bordelands 2': 'La mejora «Ultimate Vault Hunter’s Upgrade» te permite sacar el máximo partido a la experiencia de Borderlands 2.',
  'warcraft 3: frozen throne': 'Warcraft: The Frozen Throne es un videojuego de estrategia en tiempo real y expansión de Warcraft III: Reign of Chaos desarrollado por Blizzard Entertainment. La instalación de Warcraft III: Reign of Chaos es necesaria para poder jugar a esta expansión.',
  'gran turismo 4': 'Contiene 721 automóviles de 80 fabricantes, desde el Daimler Motor Carriage, hasta conceptos, pasando por el Nissan 350Z Gran Turismo Edition, una colaboración entre Nissan y Polyphony Digital. También contiene 51 circuitos, muchos son variantes de las originales de Gran Turismo como High-Speed Ring, Trial Mountain, Autumn Ring. Algunos circuitos importantes son Nordschleife, la versión de 20 km de Nürburgring, Suzuka Circuit, el circuito de la Sarthe, circuitos modelados en lugares importantes como el Times Square de Nueva York, Hong Kong, París y Las Vegas.',
  'detroit': 'Detroit: Become Human pone el destino de la humanidad y los androides en tus manos. Cada decisión que tomes afectará al resultado del juego, en una de las tramas narrativas con ramificaciones más intrincadas que jamás se ha visto.',
  'red dead redemption 2': 'Arthur Morgan y la banda de Van der Linde se ven obligados a huir. Con agentes federales y cazarrecompensas pisándoles los talones, la banda deberá atracar, robar y luchar para sobrevivir en su camino por el escabroso territorio.',
  'papers please': '¡Enhorabuena! Su nombre ha salido elegido en la lotería de trabajo.Preséntese inmediatamente ante el Ministerio de Admisiones, en el puesto fronterizo de Grestin.Se le proporcionará una vivienda de clase 8 en Grestin Oriental, en la cual podrá alojarse junto a su familia.Gloria a Arstotzka.',
  'mortal kombat 1': 'Descubre un nuevo universo de Mortal Kombat™creado por Liu Kang, Dios del Fuego. ¡Mortal Kombat™ 1 abre paso a una nueva era de esta icónica saga con un nuevo sistema de kombate, modos de juego y fatalities!',
  'resident evil requiem': 'Réquiem por los muertos, pesadilla para los vivos. Escapa de la muerte en una experiencia de infarto que te estremecerá.',
  'pink extinct reprieve 2': '"NECESITAMOS MAS DINERO" en 1899, donde el salvaje oeste ya estaba terminando por domarse, esta dutch van der linde. Junto con su banda planea sacarla adelante, con sus planes, su moral y su gran capacidad para manipular a la gente.',
  'webfishing': 'WEBFISHING, un juego de pesca multijugador centrado en salas de chat, Relájate y pesca (¡en la web!)',
  'automobilista 2': 'Automobilista 2 reúne en un solo título todo lo que siempre has buscado en un simulador de carreras. Una colección variada de coches y circuitos, con gráficos y sonido espectaculares, condiciones dinámicas de clima y pista, y realidad virtual, para una experiencia de conducción como ninguna otra.',
  'left 4 dead 2': 'Ambientado en un apocalipsis zombi, Left 4 Dead 2 es un juego de disparos en primera persona (FPS) de acción y terror cooperativo que te lleva, junto a tus amigos, a recorrer ciudades, pantanos y cementerios del sur profundo de Estados Unidos —desde Savannah hasta Nueva Orleans— a lo largo de cinco extensas campañas.',
  'cyberpunk': 'Cyberpunk 2077 es un RPG de aventura y acción de mundo abierto ambientado en el futuro sombrío de Night City, una peligrosa megalópolis obsesionada con el poder, el glamur y las incesantes modificaciones corporales.',
  'gta vi': 'Vice City, Estados Unidos. Jason y Lucia siempre han sabido que llevan todas las de perder. Pero cuando un golpe que parecía fácil sale mal, terminan atrapados en el lado más oscuro del lugar más soleado de Estados Unidos, en medio de una conspiración criminal que se extiende por todo el estado de Leonida , y obligados a confiar el uno en el otro más que nunca si quieren salir con vida.',
  'blue alive condemnation 2': 'Tras el aclamado exito de "Red dead redemption 2", Rockstar games presenta: Blue alive condemnation 2. Enfrentate cara a cara con aquellos personajes iconicos y nuevos con este roaster de mas de 20 personajes unicos',

};
const normalize = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export default function Tienda() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [offerOnly, setOfferOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeShot, setActiveShot] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let active = true;
    api.products()
      .then((rows) => {
        if (!active) return;
        setProducts(rows.map((product) => ({
          ...product,
          enOferta: Boolean(Number(product.enOferta)),
          precioOferta: product.precioOferta == null ? null : Number(product.precioOferta),
          precio: Number(product.precio),
          stock: Number(product.stock ?? 0),
        })));
      })
      .catch((error) => {
        if (active) setSuccessMessage(`No se pudo cargar el catálogo: ${error.message}`);
      })
      .finally(() => active && setLoadingProducts(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const requested = searchParams.get('juego');
    if (!requested) return;
    const found = products.find((product) => normalize(product.nombre).includes(normalize(requested)) || normalize(requested).includes(normalize(product.nombre)));
    if (found) { setSelectedProduct(found); setActiveShot(0); }
  }, [products, searchParams]);

  const categories = useMemo(() => ['Todas', ...new Set(products.map((product) => product.categoria || 'Otros'))], [products]);
  const visibleProducts = products.filter((product) =>
    (categoryFilter === 'Todas' || product.categoria === categoryFilter) && (!offerOnly || product.enOferta) && normalize(product.nombre).includes(normalize(search))
  );

  function getShots(product) {
    const key = normalize(product.nombre);
    const exact = Object.entries(previewImages).find(([name]) => key.includes(normalize(name)) || normalize(name).includes(key));
    const generic = categoryImages[product.categoria] || ['/imgtienda/peak.jpg', '/imgtienda/cyberpunk.webp', '/imgtienda/rd9.jpg'];
    return exact?.[1] || [product.imagen ? `/${product.imagen}` : '/imgtienda/peak.jpg', ...generic].filter((src, index, list) => list.indexOf(src) === index).slice(0, 3);
  }

  async function addToCart(product, goToCart = false) {
    try {
      await api.addToCart(product.id, 1);
      setSuccessMessage(`${product.nombre} se agregó al carrito.`);
      if (goToCart) navigate('/carrito');
    } catch (error) {
      setSuccessMessage(error.message || 'No se pudo agregar el producto al carrito.');
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
      {successMessage && <div className="store-notice" role="status"><i className="bi bi-check-circle-fill me-2" />{successMessage}<button type="button" aria-label="Cerrar mensaje" onClick={() => setSuccessMessage('')}>×</button></div>}
      <section className="store-toolbar" aria-label="Filtros de juegos">
        <div className="store-search"><i className="bi bi-search" /><input aria-label="Buscar juego" placeholder="Buscar juegos..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select aria-label="Filtrar por categoría" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category === 'Todas' ? 'Todas las categorías' : category}</option>)}</select>
        <label className="store-offer-filter"><input type="checkbox" checked={offerOnly} onChange={(event) => setOfferOnly(event.target.checked)} /> Solo ofertas</label>
        <span className="store-count">{visibleProducts.length} juegos</span>
      </section>
      <section className="store-grid" aria-label="Catálogo de juegos">
        {loadingProducts && <p className="text-white">Cargando catálogo desde MySQL...</p>}
        {!loadingProducts && visibleProducts.length === 0 && <p className="text-white">No hay juegos que coincidan con tu búsqueda.</p>}
        {visibleProducts.map((product) => {
          const price = getProductPrice(product);
          const shots = getShots(product);
          const onSale = product.enOferta && price < product.precio;
          return <article className="store-game-card" key={product.id ?? product.nombre}>
            <button className="store-cover-button" type="button" onClick={() => { setSelectedProduct(product); setActiveShot(0); }} aria-label={`Ver detalles de ${product.nombre}`}>
              <img className="store-cover" src={`/${product.imagen}`} alt={`Portada de ${product.nombre}`} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = shots[0]; }} />
              {onSale && <span className="store-sale-badge">OFERTA</span>}
              <span className="store-quickview"><i className="bi bi-eye me-2" />Vista rápida</span>
            </button>
            <div className="store-game-info">
              <div className="store-game-meta"><span>{product.categoria || 'Otros'}</span>{onSale && <small>Precio especial</small>}</div>
              <button type="button" className="store-game-title" onClick={() => { setSelectedProduct(product); setActiveShot(0); }}>{product.nombre}</button>
              <p className="store-game-description">{descriptions[normalize(product.nombre)] || `Descubre ${product.nombre}, una experiencia de ${String(product.categoria || 'videojuegos').toLowerCase()} que puedes sumar a tu colección.`}</p>
              <div className="store-game-footer"><div className="store-price">{onSale && <del>{formatCLP(product.precio)}</del>}<strong>{formatCLP(price)}</strong></div><button type="button" className="store-add-btn" onClick={() => addToCart(product)} aria-label={`Agregar ${product.nombre} al carrito`}><i className="bi bi-cart-plus" /><span>Agregar</span></button></div>
            </div>
          </article>;
        })}
        {!visibleProducts.length && <div className="store-empty"><i className="bi bi-controller" /><h2>No encontramos juegos</h2><p>Prueba con otro nombre o cambia los filtros.</p><button className="store-cart-btn" onClick={() => { setSearch(''); setCategoryFilter('Todas'); setOfferOnly(false); }}>Limpiar filtros</button></div>}
      </section>
      {selectedProduct && (() => {
        const shots = getShots(selectedProduct);
        const price = getProductPrice(selectedProduct);
        const onSale = selectedProduct.enOferta && price < selectedProduct.precio;
        return <div className="store-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
          <section className="store-detail-modal" role="dialog" aria-modal="true" aria-labelledby="store-detail-title">
            <button type="button" className="store-modal-close" onClick={closePreview} aria-label="Cerrar vista del juego">×</button>
            <div className="store-detail-layout">
              <div className="store-detail-media"><div className="store-main-shot"><img src={shots[activeShot] || shots[0]} alt={`Captura ${activeShot + 1} de ${selectedProduct.nombre}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = `/${selectedProduct.imagen}`; }} /></div><div className="store-shot-strip">{shots.map((shot, index) => <button key={shot} type="button" className={activeShot === index ? 'is-active' : ''} onClick={() => setActiveShot(index)} aria-label={`Mostrar captura ${index + 1}`}><img src={shot} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = `/${selectedProduct.imagen}`; }} /></button>)}</div></div>
              <div className="store-detail-copy"><span className="store-eyebrow">{selectedProduct.categoria || 'VIDEOJUEGO'} / DETALLES</span><h2 id="store-detail-title">{selectedProduct.nombre}</h2><p>{descriptions[normalize(selectedProduct.nombre)] || `Explora ${selectedProduct.nombre}, un título de ${String(selectedProduct.categoria || 'videojuegos').toLowerCase()} que merece un lugar en tu colección. Revisa sus imágenes y añádelo al carrito cuando estés listo.`}</p><div className="store-detail-tags"><span><i className="bi bi-controller me-1" />PC / Colección Yakarta</span><span><i className="bi bi-images me-1" />{shots.length} imágenes</span></div><div className="store-detail-purchase"><div className="store-price">{onSale && <del>{formatCLP(selectedProduct.precio)}</del>}<strong>{formatCLP(price)}</strong></div><button type="button" className="store-buy-btn" onClick={() => addToCart(selectedProduct, true)}><i className="bi bi-bag-check me-2" />Comprar ahora</button><button type="button" className="store-add-wide" onClick={() => addToCart(selectedProduct)}><i className="bi bi-cart-plus me-2" />Agregar al carrito</button></div><p className="store-detail-note"><i className="bi bi-shield-check me-1" />Se añadirá a tu carrito de Yakarta.</p></div>
            </div>
          </section>
        </div>;
      })()}
    </main>
  );
}
