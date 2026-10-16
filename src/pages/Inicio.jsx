import { useState } from 'react';
import { Link } from 'react-router-dom';

const featuredGames = [
  { title: 'Midnight Club: Los Angeles', category: 'Carreras', image: '/imgtienda/Midnight_Club-Los_Angeles.jpg', description: 'Corre por la ciudad y construye tu reputación.', to: '/midnight-club' },
  { title: 'FIFA Street', category: 'Deportes', image: '/imgtienda/fifastreet.jpg', description: 'El fútbol callejero, sin reglas y con estilo.', to: '/tienda' },
  { title: 'Dead by Daylight', category: 'Terror', image: '/imgtienda/dbd.jpg', description: 'Sobrevive a la noche o conviértete en la pesadilla.', to: '/blogs/dead-by-daylight' },
  { title: 'Need for Speed', category: 'Carreras', image: '/imgtienda/rd9.jpg', description: 'Velocidad, persecuciones y adrenalina.', to: '/blogs/need-for-speed-shift' },
  { title: 'Grand Theft Auto', category: 'Acción', image: '/imgtienda/gta6.webp', description: 'Explora mundos abiertos llenos de posibilidades.', to: '/tienda' },
  { title: 'Red Dead Redemption 2', category: 'Aventura', image: '/imgtienda/rdr2.webp', description: 'Una aventura épica en el salvaje oeste.', to: '/tienda' },
];

export default function Inicio() {
  const [active, setActive] = useState(1);
  const move = (direction) => setActive((current) => (current + direction + featuredGames.length) % featuredGames.length);
  const ordered = [...featuredGames.slice(active), ...featuredGames.slice(0, active)];

  return (
    <main className="home-page">
      <section className="home-intro container-fluid">
        <div className="home-intro-copy">
          <span className="eyebrow"><i className="bi bi-controller me-2" />TU PRÓXIMA AVENTURA COMIENZA AQUÍ</span>
          <h1>Juega a tu manera.</h1>
          <p>Descubre clásicos inolvidables, grandes aventuras y ofertas para tu próxima partida.</p>
          <Link className="btn home-primary-btn" to="/tienda">Explorar la tienda <i className="bi bi-arrow-up-right ms-2" /></Link>
        </div>
        <div className="home-intro-mark" aria-hidden="true"><img src="/img/logofeoyakarta.png" alt="" /></div>
      </section>

      <section className="featured-section" aria-label="Juegos destacados">
        <div className="featured-heading">
          <div><span className="eyebrow">DESCUBRE ALGO NUEVO</span><h2>Destacados</h2></div>
          <div className="featured-controls">
            <button type="button" aria-label="Juego anterior" onClick={() => move(-1)}><i className="bi bi-arrow-left" /></button>
            <button type="button" aria-label="Juego siguiente" onClick={() => move(1)}><i className="bi bi-arrow-right" /></button>
          </div>
        </div>
        <div className="featured-carousel" key={active}>
          {ordered.slice(0, 4).map((game, index) => (
            <article className={`featured-card ${index === 1 ? 'featured-card-prominent' : ''}`} key={game.title}>
              <img src={game.image} alt={game.title} onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
              <div className="featured-card-shade" />
              <div className="featured-card-content">
                <span className="featured-category">{game.category}</span>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <Link to={game.to} className="featured-link">Descubrir <i className="bi bi-arrow-up-right ms-1" /></Link>
              </div>
            </article>
          ))}
        </div>
        <div className="featured-pagination" aria-label={`Grupo de destacados ${active + 1} de ${featuredGames.length}`}>
          {featuredGames.map((game, index) => <button type="button" key={game.title} aria-label={`Mostrar desde ${game.title}`} className={index === active ? 'is-active' : ''} onClick={() => setActive(index)} />)}
        </div>
      </section>

      <section className="home-discover container-fluid">
        <div><span className="eyebrow">LA COLECCIÓN TE ESPERA</span><h2>Grandes juegos. Buenos recuerdos.</h2><p>Encuentra tu siguiente favorito y vuelve a disfrutar de los títulos que hicieron historia.</p></div>
        <Link to="/tienda" className="btn home-outline-btn">Ver todos los juegos <i className="bi bi-arrow-right ms-2" /></Link>
      </section>
    </main>
  );
}
