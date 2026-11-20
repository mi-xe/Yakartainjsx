import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src="/img/logofeoyakarta.png" alt="Yakarta" />
          <p>Tu próxima aventura comienza aquí.</p>
        </div>
        <div className="site-footer-column">
          <h2>Explora</h2>
          <a href="/tienda">Tienda</a>
          <a href="/blogs">Novedades</a>
          <a href="/somos">Nosotros</a>
        </div>
        <div className="site-footer-column">
          <h2>Contacto</h2>
          <a href="mailto:Mcyakartalovin@solab.cl">Mcyakartalovin@solab.cl</a>
          <a href="tel:+56921523700">+56 9 2152 3700</a>
          <a href="/contactanos">Formulario de contacto</a>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Yakarta. Todos los derechos reservados.</span>
        <a className="footer-easter-egg" href="/daytona/" aria-label="Experiencia arcade">·</a>
      </div>
    </footer>
  );
}

export default function PageLayout({ children }) {
  const { pathname } = useLocation();
  const isCheckout = ['/carrito', '/direccion', '/resumen'].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  return (
    <>
      <Navbar />
      {children}
      {!isCheckout && <SiteFooter />}
    </>
  );
}
