import { Link } from 'react-router-dom';
import Navbar from './Navbar';

export default function PageLayout({ children }) {
  return (
    <div className="yakarta-site-shell">
      <Navbar />
      {children}
      <footer className="yakarta-site-footer" aria-label="Pie de página">
        <div className="yakarta-footer-main">
          <section className="yakarta-footer-brand" aria-label="Yakarta Gaming Store">
            <Link to="/" className="yakarta-footer-logo-link" aria-label="Volver al inicio de Yakarta">
              <img src="/img/logofeoyakarta.png" alt="Yakarta Gaming Store" className="yakarta-footer-logo" />
            </Link>
            <p>
              Tu tienda de videojuegos. Descubre clásicos inolvidables, nuevas aventuras
              y títulos para todos los gustos.
            </p>
          </section>

          <nav className="yakarta-footer-column" aria-label="Explorar Yakarta">
            <h2>Explorar</h2>
            <Link to="/tienda">Tienda</Link>
            <Link to="/blogs">Novedades</Link>
            <Link to="/somos">Nosotros</Link>
          </nav>

          <section className="yakarta-footer-column" aria-label="Atención al cliente">
            <h2>Atención al cliente</h2>
            <Link to="/contactanos">Contáctanos</Link>
            <a href="mailto:Mcyakartalovin@solab.cl">Mcyakartalovin@solab.cl</a>
            <a href="tel:+56921523700">+56 9 2152 3700</a>
          </section>

          <section className="yakarta-footer-column yakarta-footer-help">
            <h2>¿Necesitas ayuda?</h2>
            <p>Estamos aquí para ayudarte con tus consultas y compras.</p>
            <Link className="yakarta-footer-contact-btn" to="/contactanos">
              Ir a contacto <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </section>
        </div>

        <div className="yakarta-footer-bottom">
          <span>© {new Date().getFullYear()} Yakarta Gaming Store. Todos los derechos reservados.</span>
          <Link to="/">Volver al inicio <i className="bi bi-arrow-up" aria-hidden="true" /></Link>
        </div>
      </footer>
    </div>
  );
}
