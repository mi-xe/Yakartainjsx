const React = require('react');
const { render, screen, fireEvent, cleanup } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const Boton = require('../Boton.jsx').default;
const FormularioPrueba = require('../FormularioPrueba.jsx').default;
const BotonContador = require('../BotonContador.jsx').default;
const Navbar = require('../Navbar.jsx').default;
const { formatCLP, getProductPrice } = require('../../lib/storage.js');
const { defaultProducts } = require('../../lib/products.js');

afterEach(() => cleanup());

function renderWithRouter(element) {
  return render(React.createElement(MemoryRouter, null, element));
}

describe('Yakarta - pruebas de propiedades, estado y eventos', () => {
  it('01 - muestra la etiqueta recibida por el botón', () => {
    render(React.createElement(Boton, { etiqueta: 'Guardar juego', onClick: () => {} }));
    expect(screen.getByRole('button', { name: 'Guardar juego' })).toBeTruthy();
  });

  it('02 - ejecuta una vez la función onClick recibida como prop', () => {
    const manejarClick = jasmine.createSpy('manejarClick');
    render(React.createElement(Boton, { etiqueta: 'Guardar', onClick: manejarClick }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(manejarClick).toHaveBeenCalledTimes(1);
  });

  it('03 - actualiza el estado del formulario cuando el usuario escribe', () => {
    render(React.createElement(FormularioPrueba));
    const campo = screen.getByRole('textbox', { name: 'Nombre' });
    fireEvent.change(campo, { target: { value: 'The Legend of Zelda' } });
    expect(campo.value).toBe('The Legend of Zelda');
    expect(screen.getByText('Texto ingresado: The Legend of Zelda')).toBeTruthy();
  });

  it('04 - incrementa el contador y llama a onAccion al hacer clic', () => {
    const onAccion = jasmine.createSpy('onAccion');
    render(React.createElement(BotonContador, { onAccion }));
    fireEvent.click(screen.getByRole('button', { name: 'Incrementar' }));
    expect(screen.getByText('Contador: 1')).toBeTruthy();
    expect(onAccion).toHaveBeenCalledTimes(1);
  });
});

describe('Yakarta - catálogo y utilidades', () => {
  it('05 - formatCLP muestra símbolo monetario y CLP', () => {
    expect(formatCLP(15000).startsWith('$')).toBeTrue();
    expect(formatCLP(15000).includes('CLP')).toBeTrue();
  });

  it('06 - formatCLP acepta precios numéricos expresados como texto', () => {
    expect(formatCLP('10000')).toBe(formatCLP(10000));
  });

  it('07 - el catálogo predeterminado contiene 28 videojuegos', () => {
    expect(defaultProducts.length).toBe(28);
  });

  it('08 - todos los productos tienen identificadores únicos', () => {
    const ids = defaultProducts.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('09 - todos los productos tienen nombre, precio, imagen y categoría', () => {
    expect(defaultProducts.every((p) => p.nombre && p.precio > 0 && p.imagen && p.categoria)).toBeTrue();
  });

  it('10 - los productos en oferta tienen un precio inferior al normal', () => {
    const offers = defaultProducts.filter((p) => p.enOferta);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((p) => p.precioOferta > 0 && p.precioOferta < p.precio)).toBeTrue();
  });

  it('11 - getProductPrice aplica el precio rebajado cuando corresponde', () => {
    expect(getProductPrice({ precio: 15000, enOferta: true, precioOferta: 12000 })).toBe(12000);
  });

  it('12 - getProductPrice conserva el precio normal cuando no hay oferta', () => {
    expect(getProductPrice({ precio: 15000, enOferta: false, precioOferta: 12000 })).toBe(15000);
  });
});

describe('Yakarta - navegación', () => {
  it('13 - Navbar muestra los enlaces principales', () => {
    renderWithRouter(React.createElement(Navbar));
    expect(screen.getByRole('link', { name: /Tienda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Novedades/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Carrito/i })).toBeTruthy();
  });

  it('14 - Navbar ofrece iniciar sesión cuando la sesión no existe', () => {
    renderWithRouter(React.createElement(Navbar));
    expect(screen.getByRole('link', { name: /Iniciar Sesión/i }).getAttribute('href')).toBe('/login');
  });
});
