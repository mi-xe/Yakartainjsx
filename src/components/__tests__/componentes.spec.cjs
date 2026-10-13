const React = require('react');
const { render, screen, fireEvent, cleanup } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const Boton = require('../Boton.jsx').default;
const FormularioPrueba = require('../FormularioPrueba.jsx').default;
const BotonContador = require('../BotonContador.jsx').default;
const Navbar = require('../Navbar.jsx').default;
const StorePage = require('../../pages/StorePage.jsx').default;
const CartPage = require('../../pages/CartPage.jsx').default;
const { readStorage, writeStorage, formatCLP, getCurrentUser } = require('../../lib/storage.js');
const { defaultProducts } = require('../../lib/products.js');

afterEach(() => cleanup());
beforeEach(() => localStorage.clear());

function renderWithRouter(element, initialEntries = ['/']) {
  return render(React.createElement(MemoryRouter, { initialEntries }, element));
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


  it('05 - readStorage devuelve el valor alternativo si la clave no existe', () => {
    expect(readStorage('clave-inexistente', [])).toEqual([]);
  });

  it('06 - readStorage convierte JSON guardado en un objeto', () => {
    localStorage.setItem('perfil', JSON.stringify({ nombre: 'Ana' }));
    expect(readStorage('perfil', null)).toEqual({ nombre: 'Ana' });
  });

  it('07 - readStorage devuelve el valor alternativo si el JSON es inválido', () => {
    localStorage.setItem('perfil', '{json incorrecto');
    expect(readStorage('perfil', null)).toBeNull();
  });

  it('08 - writeStorage guarda arreglos como JSON', () => {
    writeStorage('carrito', [{ nombre: 'Black', cantidad: 2 }]);
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([{ nombre: 'Black', cantidad: 2 }]);
  });

  it('09 - formatCLP muestra el símbolo monetario y CLP', () => {
    const resultado = formatCLP(15000);
    expect(resultado.startsWith('$')).toBeTrue();
    expect(resultado.includes('CLP')).toBeTrue();
  });

  it('10 - formatCLP acepta un precio numérico representado como texto', () => {
    expect(formatCLP('10000')).toBe(formatCLP(10000));
  });

  it('11 - getCurrentUser devuelve null cuando no hay sesión', () => {
    expect(getCurrentUser()).toBeNull();
  });


  it('12 - el catálogo predeterminado contiene juegos', () => {
    expect(defaultProducts.length).toBeGreaterThan(0);
  });

  it('13 - el catálogo contiene 28 productos predeterminados', () => {
    expect(defaultProducts.length).toBe(28);
  });

  it('14 - todos los productos tienen identificadores únicos', () => {
    const ids = defaultProducts.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('15 - todos los juegos tienen nombre no vacío', () => {
    expect(defaultProducts.every((product) => typeof product.nombre === 'string' && product.nombre.trim().length > 0)).toBeTrue();
  });

  it('16 - todos los juegos tienen precio positivo e imagen definida', () => {
    expect(defaultProducts.every((product) => product.precio > 0 && typeof product.imagen === 'string' && product.imagen.length > 0)).toBeTrue();
  });


  it('17 - Navbar muestra los enlaces principales de la tienda', () => {
    renderWithRouter(React.createElement(Navbar));
    expect(screen.getByRole('link', { name: /Tienda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Blogs/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Carrito/i })).toBeTruthy();
  });

  it('18 - Navbar ofrece iniciar sesión cuando no hay usuario conectado', () => {
    renderWithRouter(React.createElement(Navbar));
    expect(screen.getByRole('link', { name: /Iniciar Sesión/i }).getAttribute('href')).toBe('/login');
  });

  it('19 - Navbar muestra el nombre del usuario conectado', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Navbar));
    expect(screen.getByRole('button', { name: /Ana/i })).toBeTruthy();
  });

  it('20 - Navbar permite cerrar sesión y elimina el usuario guardado', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Navbar));
    fireEvent.click(screen.getByRole('button', { name: /Ana/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(localStorage.getItem('usuarioLogueado')).toBeNull();
    expect(screen.getByRole('link', { name: /Iniciar Sesión/i })).toBeTruthy();
  });


  it('21 - StorePage muestra productos del catálogo', () => {
    renderWithRouter(React.createElement(StorePage));
    expect(screen.getByRole('heading', { name: 'Midnight club' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Black' })).toBeTruthy();
  });

  it('22 - agregar un juego guarda el producto en el carrito', () => {
    renderWithRouter(React.createElement(StorePage));
    const botones = screen.getAllByRole('button', { name: 'Agregar al carrito' });
    fireEvent.click(botones[0]);
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([
      jasmine.objectContaining({ nombre: 'Midnight club', cantidad: 1 }),
    ]);
  });

  it('23 - agregar un juego muestra mensaje de confirmación', () => {
    renderWithRouter(React.createElement(StorePage));
    fireEvent.click(screen.getAllByRole('button', { name: 'Agregar al carrito' })[0]);
    expect(screen.getByRole('alert').textContent).toContain('se agregó exitosamente al carrito');
  });


  it('24 - CartPage informa cuando el carrito está vacío', () => {
    renderWithRouter(React.createElement(CartPage));
    expect(screen.getByText('El carrito está vacío.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tu Carrito de Compras' })).toBeTruthy();
  });

  it('25 - CartPage muestra el producto guardado y permite quitarlo', () => {
    localStorage.setItem('carrito', JSON.stringify([
      { id: 1, nombre: 'Black', precio: 5000, cantidad: 1, imagen: 'imgtienda/black.jpg' },
    ]));
    renderWithRouter(React.createElement(CartPage));
    expect(screen.getByText('Black')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(screen.getByText('El carrito está vacío.')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([]);
  });
});
