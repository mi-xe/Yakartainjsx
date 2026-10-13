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
const Tienda = require('../../pages/Tienda.jsx').default;
const Fondos = require('../../pages/Fondos.jsx').default;
const Contacto = require('../../pages/Contacto.jsx').default;
const IniciarSesion = require('../../pages/IniciarSesion.jsx').default;
const Resumen = require('../../pages/Resumen.jsx').default;
const Administracion = require('../../pages/Administracion.jsx').default;
const { getCustomerBalance, setCustomerBalance, ensureCustomerBalance, getProductPrice } = require('../../lib/storage.js');

afterEach(() => cleanup());
beforeEach(() => localStorage.clear());

function renderWithRouter(element, initialEntries = ['/']) {
  return render(React.createElement(MemoryRouter, { initialEntries }, element));
}

describe('Yakarta - pruebas de propiedades, estado y eventos', () => {
  //Props y eventos del botón
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

  //Estado del formulario
  it('03 - actualiza el estado del formulario cuando el usuario escribe', () => {
    render(React.createElement(FormularioPrueba));
    const campo = screen.getByRole('textbox', { name: 'Nombre' });
    fireEvent.change(campo, { target: { value: 'The Legend of Zelda' } });
    expect(campo.value).toBe('The Legend of Zelda');
    expect(screen.getByText('Texto ingresado: The Legend of Zelda')).toBeTruthy();
  });

  //Evento y estado
  it('04 - incrementa el contador y llama a onAccion al hacer clic', () => {
    const onAccion = jasmine.createSpy('onAccion');
    render(React.createElement(BotonContador, { onAccion }));
    fireEvent.click(screen.getByRole('button', { name: 'Incrementar' }));
    expect(screen.getByText('Contador: 1')).toBeTruthy();
    expect(onAccion).toHaveBeenCalledTimes(1);
  });

  //5-11Funciones reales de almacenamiento y formato de Yakarta
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

  //Catálogo real de juegos
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

  //Navegación y sesión
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

  //Tienda y carrito
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

  //Carrito de compras
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


describe('Yakarta - pruebas funcionales de tienda, saldo, contacto y administración', () => {
  it('26 - cada juego predeterminado tiene una categoría', () => {
    expect(defaultProducts.every((product) => typeof product.categoria === 'string' && product.categoria.length > 0)).toBeTrue();
  });

  it('27 - las ofertas tienen un precio menor que el precio normal', () => {
    const offers = defaultProducts.filter((product) => product.enOferta);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((product) => product.precioOferta > 0 && product.precioOferta < product.precio)).toBeTrue();
  });

  it('28 - getProductPrice entrega el precio rebajado en oferta', () => {
    expect(getProductPrice({ precio: 15000, enOferta: true, precioOferta: 12000 })).toBe(12000);
  });

  it('29 - getProductPrice conserva el precio normal si no está en oferta', () => {
    expect(getProductPrice({ precio: 15000, enOferta: false, precioOferta: 12000 })).toBe(15000);
  });

  it('30 - la tienda presenta el filtro de categorías', () => {
    renderWithRouter(React.createElement(Tienda));
    expect(screen.getByRole('combobox', { name: /Filtrar por categoría/i })).toBeTruthy();
  });

  it('31 - el filtro de categoría muestra solo juegos de la categoría elegida', () => {
    renderWithRouter(React.createElement(Tienda));
    fireEvent.change(screen.getByLabelText(/Filtrar por categoría/i), { target: { value: 'Deportes' } });
    expect(screen.getByRole('heading', { name: 'Fifa street 2' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Black' })).toBeNull();
  });

  it('32 - el filtro de ofertas oculta juegos que no están rebajados', () => {
    renderWithRouter(React.createElement(Tienda));
    fireEvent.click(screen.getByLabelText(/Mostrar solo juegos en oferta/i));
    expect(screen.getByRole('heading', { name: 'Midnight club' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Fifa street 2' })).toBeNull();
  });

  it('33 - la tienda destaca las ofertas con una insignia', () => {
    renderWithRouter(React.createElement(Tienda));
    expect(screen.getAllByText('¡OFERTA!').length).toBeGreaterThan(0);
  });

  it('34 - agregar un juego en oferta guarda su precio rebajado en el carrito', () => {
    renderWithRouter(React.createElement(Tienda));
    const card = screen.getByRole('heading', { name: 'Midnight club' }).closest('.card');
    fireEvent.click(card.querySelector('button'));
    expect(JSON.parse(localStorage.getItem('carrito'))[0].precio).toBe(12000);
  });

  it('35 - iniciar sesión como cliente crea saldo inicial de cero', () => {
    localStorage.setItem('usuarios', JSON.stringify([{ nombre: 'Ana', email: 'ana@example.com', password: 'abc123', rol: 'Cliente' }]));
    renderWithRouter(React.createElement(IniciarSesion), ['/login']);
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(0);
  });

  it('36 - iniciar sesión no reinicia el saldo de un cliente existente', () => {
    localStorage.setItem('usuarios', JSON.stringify([{ nombre: 'Ana', email: 'ana@example.com', password: 'abc123', rol: 'Cliente' }]));
    setCustomerBalance('ana@example.com', 5000);
    renderWithRouter(React.createElement(IniciarSesion), ['/login']);
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(5000);
  });

  it('37 - setCustomerBalance persiste el saldo por correo', () => {
    setCustomerBalance('cliente@example.com', 2500);
    expect(getCustomerBalance('cliente@example.com')).toBe(2500);
  });

  it('38 - el administrador puede crear un usuario con contraseña de acceso', () => {
    renderWithRouter(React.createElement(Administracion));
    fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }));
    fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'Cliente Nuevo' } });
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), { target: { value: 'nuevo@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'secreto123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Usuario' }));
    expect(JSON.parse(localStorage.getItem('usuarios')).some((user) => user.email === 'nuevo@example.com' && user.password === 'secreto123')).toBeTrue();
  });

  it('39 - la página de fondos muestra el saldo actual', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    setCustomerBalance('ana@example.com', 3000);
    renderWithRouter(React.createElement(Fondos));
    expect(screen.getByText(formatCLP(3000))).toBeTruthy();
  });

  it('40 - agregar $1.000 aumenta y guarda el saldo', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Fondos));
    fireEvent.click(screen.getByRole('button', { name: /\$\s*1\.000 CLP/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(1000);
  });

  it('41 - agregar $2.000 aumenta y guarda el saldo', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Fondos));
    fireEvent.click(screen.getByRole('button', { name: /\$\s*2\.000 CLP/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(2000);
  });

  it('42 - agregar $5.000 aumenta y guarda el saldo', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Fondos));
    fireEvent.click(screen.getByRole('button', { name: /\$\s*5\.000 CLP/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(5000);
  });

  it('43 - agregar $10.000 aumenta y guarda el saldo', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Fondos));
    fireEvent.click(screen.getByRole('button', { name: /\$\s*10\.000 CLP/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(10000);
  });

  it('44 - el formulario de nuevo usuario exige una contraseña', () => {
    renderWithRouter(React.createElement(Administracion));
    fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }));
    expect(screen.getByLabelText(/Contraseña/).required).toBeTrue();
  });

  it('45 - enviar el formulario de contacto guarda una solicitud', () => {
    renderWithRouter(React.createElement(Contacto));
    fireEvent.change(screen.getByLabelText('Gmail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Telefono'), { target: { value: '912345678' } });
    fireEvent.change(screen.getByLabelText('Comentario'), { target: { value: 'Consulta por un juego' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    const requests = JSON.parse(localStorage.getItem('solicitudesContacto'));
    expect(requests[0]).toEqual(jasmine.objectContaining({ email: 'ana@example.com', nombre: 'Ana', comentario: 'Consulta por un juego' }));
  });

  it('46 - contacto muestra confirmación tras enviar el formulario', () => {
    renderWithRouter(React.createElement(Contacto));
    fireEvent.change(screen.getByLabelText('Gmail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Telefono'), { target: { value: '912345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(screen.getByRole('status').textContent).toContain('Mensaje enviado correctamente');
  });

  it('47 - Navbar muestra el saldo del cliente en el menú de usuario', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    setCustomerBalance('ana@example.com', 7000);
    renderWithRouter(React.createElement(Navbar));
    fireEvent.click(screen.getByRole('button', { name: /Ana/i }));
    expect(screen.getByText(/Saldo:/i).textContent).toContain(formatCLP(7000));
  });

  it('48 - Navbar ofrece un enlace a agregar fondos', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    renderWithRouter(React.createElement(Navbar));
    fireEvent.click(screen.getByRole('button', { name: /Ana/i }));
    expect(screen.getByRole('link', { name: /Agregar fondos/i }).getAttribute('href')).toBe('/fondos');
  });

  it('49 - resumen impide pagar si el saldo del cliente es insuficiente', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    localStorage.setItem('carrito', JSON.stringify([{ nombre: 'Black', precio: 5000, cantidad: 1 }]));
    setCustomerBalance('ana@example.com', 1000);
    renderWithRouter(React.createElement(Resumen));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));
    expect(screen.getByText(/Saldo insuficiente/i)).toBeTruthy();
    expect(getCustomerBalance('ana@example.com')).toBe(1000);
  });

  it('50 - resumen descuenta el total del saldo y registra la compra', () => {
    localStorage.setItem('usuarioLogueado', JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', rol: 'Cliente' }));
    localStorage.setItem('carrito', JSON.stringify([{ nombre: 'Black', precio: 5000, cantidad: 1 }]));
    setCustomerBalance('ana@example.com', 7000);
    renderWithRouter(React.createElement(Resumen));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));
    expect(getCustomerBalance('ana@example.com')).toBe(2000);
    expect(JSON.parse(localStorage.getItem('historialCompras'))[0].total).toBe(5000);
  });





});
