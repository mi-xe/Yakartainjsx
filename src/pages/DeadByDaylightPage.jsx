import { Link } from 'react-router-dom';

export default function DeadByDaylightPage() {
  return (
    <>
<header className="container my-5 text-center">
<h1 className="display-4 fw-bold">Dead by Daylight: Guía y Noticias</h1>
<p className="lead">Estrategias, mecánicas de supervivencia y novedades sobre la Niebla.</p>
</header>
<main className="container mb-5">
<div className="row g-4">
<div className="col-lg-7 d-flex flex-column align-items-end">
<article className="card card-login mb-4 p-4" style={{maxWidth: "100%"}}>
<img src="/imgdbd/giphy.gif" className="card-img-top img-juego mb-3" alt="Supervivientes Dead by Daylight" />
<div className="card-body p-0">
<h2 className="card-title h3">5 Reglas Básicas para Sobrevivir en la Niebla</h2>
<p className="text-secondary small"></p>
<p>
            Comenzar en Dead by Daylight puede ser abrumador. Entre el radio de terror del Asesino y la presión de reparar generadores, dominar lo básico es fundamental para escapar:
          </p>
<ul>
<li><p className="mb-1"><strong>Controla la cámara:</strong> Mantén la visión 360° mientras reparas para reaccionar a tiempo.</p></li>
<li><p className="mb-1"><strong>Gestiona tus marcas de arañazos:</strong> Correr deja marcas de arañazos visibles únicamente para el Asesino. Camina o agáchate cuando no estés en persecución directa o al intentar romper la línea de visión en estructuras cerradas.</p></li>
<li><p className="mb-1"><strong>Gana tiempo en los pallets:</strong> No tires las maderas antes de tiempo; aprovéchalas para romper la línea de visión.</p></li>
<li><p className="mb-1"><strong>Monitorea los estados de tus compañeros:</strong> Mantén un ojo en la interfaz lateral. Si un compañero entra en persecución, aprovecha ese tiempo seguro para reparar generadores de forma agresiva.</p></li>
<li><p className="mb-1"><strong>Prioriza la reparación de generadores centrales:</strong> Reparar primero los generadores situados en el medio del mapa evita que el asesino pueda patrullar fácilmente los últimos tres generadores (3-gen) al final de la partida.</p></li>
</ul>
</div>
</article>
</div>
<div className="col-lg-5">
<div className="card card-login w-100 p-4 mb-4 text-center">
<h3 className="card-title h5">Consigue el Juego</h3>
<p className="text-secondary">Aprovecha nuestras ofertas y súmate a las partidas.</p>
<Link to="/tienda">
<button className="btn btn-primary mt-2 w-100">Comprar en Yakarta</button>
</Link>
</div>
<div className="card card-login w-100 p-4">
<h2 className="card-title h4 mb-3">Preguntas Frecuentes del Meta Actual</h2>
<div className="accordion accordionfondo" id="accordionBlog">
<div className="accordion-item">
<h3 className="accordion-header" id="headingOne">
<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                ¿Cuáles son las mejores Perks para Supervivientes?
              </button>
</h3>
<div id="collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionBlog">
<div className="accordion-body">
                Habilidades como <strong>Fajador (Dead Hard)</strong>, <strong>Demuestra lo que vales</strong> y <strong>Tiempo Prestado</strong> siguen siendo altamente efectivas para coordinar escapes en equipo.
              </div>
</div>
</div>
<div className="accordion-item">
<h3 className="accordion-header" id="headingTwo">
<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                ¿Cómo contrarrestar a los Asesinos con sigilo?
              </button>
</h3>
<div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionBlog">
<div className="accordion-body">
                Utiliza auriculares para prestar atención a las pisadas y la respiración profunda. Mantenerte en estructuras abiertas te dará tiempo de respuesta ante emboscadas.
              </div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
    </>
  );
}
