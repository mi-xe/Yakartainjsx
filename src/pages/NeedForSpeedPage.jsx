import { Link } from 'react-router-dom';

export default function NeedForSpeedPage() {
  return (
    <>
<main className="container my-5">
<div className="row g-4 align-items-start">
<div className="col-lg-7">
<article className="card card-login p-4 w-100" style={{maxWidth: "100%"}}>
<span className="badge bg-primary mb-2 align-self-start">Guías y Simulación</span>
<h2 className="card-title h3 mb-3">5 Claves para Dominar la Pista en NFS: Shift</h2>
<p className="text-secondary">
          Need for Speed: Shift dio un giro drástico hacia la conducción en circuitos profesionales. Para dominar el manejo desde la perspectiva interior y exprimir cada vehículo al máximo, considera estas recomendaciones:
        </p>
<img src="/img/need-for-speed-shift-pc-juego-ea-app-cover.jpg" className="img-fluid rounded img-juego w-100 mb-3" alt="Need for Speed Shift" />
<div className="d-flex flex-column gap-2">
<div className="p-2 border border-secondary rounded">
<p className="mb-0"><strong>1. Domina la trazada ideal y los puntos de frenado:</strong> Presta atención a la línea de carrera dinámica en pantalla (o a las marcas de goma y pianos del circuito). En la simulación de Shift, frenar fuerte antes de la entrada en curva con las ruedas rectas te permite mantener el control del auto y acelerar mucho antes en el ápex de salida.</p>
</div>
<div className="p-2 border border-secondary rounded">
<p className="mb-0"><strong>2. Aprovecha la vista interior:</strong> Aunque la vista exterior es popular en juegos arcade, la cámara de cabina en Shift transmite directamente las fuerzas G, la inclinación de la chasis al frenar y los impactos. Esto ayuda a percibir mejor la pérdida de adherencia y corregir el sobreviraje a tiempo.</p>
</div>
<div className="p-2 border border-secondary rounded">
<p className="mb-0"><strong>3. Ajusta la configuración y telemetría de tu auto:</strong> Adapta la presión de los neumáticos, la dureza de la suspensión y el escalonamiento de marchas según el tipo de circuito. Para pistas ratoneras o técnicas prioriza la aceleración y la carga aerodinámica; en circuitos de alta velocidad reduce el alerón para maximizar la velocidad punta.</p>
</div>
<div className="p-2 border border-secondary rounded">
<p className="mb-0"><strong>4.Aprende a controlar la transferencia de peso:</strong>La física de Shift enfatiza cómo se desplaza la masa del vehículo al acelerar, frenar o girar. Evita hacer giros bruscos o soltar el acelerador de golpe a alta velocidad para no desestabilizar la parte trasera y provocar un trompo involuntario.</p>
</div>
<div className="p-2 border border-secondary rounded">
<p className="mb-0"><strong>5. Adapta el perfil de las asistencias:</strong> Desactiva paulatinamente las asistencias de frenado y dirección para ganar control total del coche. Si utilizas volante o gamepad, ajusta la sensibilidad y la zona muerta de la dirección para lograr una respuesta más fina y progresiva en las curvas continuas.</p>
</div>
</div>
</article>
</div>
<div className="col-lg-5">
<div className="card card-login p-4 w-100 mb-4" style={{maxWidth: "100%"}}>
<h2 className="card-title h4 mb-3">Preguntas Frecuentes del Juego</h2>
<div className="accordion accordionfondo" id="accordionShift">
<div className="accordion-item">
<h3 className="accordion-header">
<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#shiftFaq1">
                ¿Qué diferencia a Shift de otros Need for Speed?
              </button>
</h3>
<div id="shiftFaq1" className="accordion-collapse collapse" data-bs-parent="#accordionShift">
<div className="accordion-body">
                NFS: Shift deja de lado las carreras callejeras e ilegales para enfocarse en el automovilismo de circuito, con física de respuesta realista y un modelo de conducción más técnico.
              </div>
</div>
</div>
<div className="accordion-item">
<h3 className="accordion-header">
<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#shiftFaq2">
                ¿Es compatible y recomendado para jugar con volante?
              </button>
</h3>
<div id="shiftFaq2" className="accordion-collapse collapse" data-bs-parent="#accordionShift">
<div className="accordion-body">
                Sí, la respuesta de giro y la sensibilidad al acelerar están diseñadas para sacarle el máximo rendimiento utilizando un periférico de volante y pedales con Force Feedback.
              </div>
</div>
</div>
</div>
</div>
<div className="card card-login p-4 w-100 text-center" style={{maxWidth: "100%"}}>
<h1 className="display-5 fw-bold text-white mb-3">NEED FOR SPEED: SHIFT</h1>
<p className="text-secondary mb-4">
          La entrega que cambió el rumbo de la franquicia apostando por las pistas profesionales y la simulación al volante.
        </p>
<Link to="/tienda">
<button className="btn btn-primary btn-lg w-100">Comprar Juego en Yakarta</button>
</Link>
</div>
</div>
</div>
</main>
    </>
  );
}
