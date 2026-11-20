const React = require('react');
const { render, screen, fireEvent, cleanup } = require('@testing-library/react');
const Boton = require('../Boton.jsx').default;
const FormularioPrueba = require('../FormularioPrueba.jsx').default;
const BotonContador = require('../BotonContador.jsx').default;
const { defaultProducts } = require('../../lib/products.js');
const { formatCLP, getProductPrice } = require('../../lib/utils.js');

afterEach(() => cleanup());

describe('Yakarta - componentes y utilidades', () => {
  it('muestra la etiqueta recibida por el botón', () => {
    render(React.createElement(Boton, { etiqueta: 'Guardar juego', onClick: () => {} }));
    expect(screen.getByRole('button', { name: 'Guardar juego' })).toBeTruthy();
  });

  it('ejecuta la función onClick una vez', () => {
    const handler = jasmine.createSpy('handler');
    render(React.createElement(Boton, { etiqueta: 'Guardar', onClick: handler }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('actualiza el estado del formulario cuando el usuario escribe', () => {
    render(React.createElement(FormularioPrueba));
    const field = screen.getByRole('textbox', { name: 'Nombre' });
    fireEvent.change(field, { target: { value: 'The Legend of Zelda' } });
    expect(field.value).toBe('The Legend of Zelda');
    expect(screen.getByText('Texto ingresado: The Legend of Zelda')).toBeTruthy();
  });

  it('incrementa el contador y llama a onAccion al hacer clic', () => {
    const handler = jasmine.createSpy('onAccion');
    render(React.createElement(BotonContador, { onAccion: handler }));
    fireEvent.click(screen.getByRole('button', { name: 'Incrementar' }));
    expect(screen.getByText('Contador: 1')).toBeTruthy();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('mantiene los 28 productos del catálogo inicial', () => {
    expect(defaultProducts.length).toBe(28);
  });

  it('el catálogo contiene identificadores únicos', () => {
    const ids = defaultProducts.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los juegos tienen nombre, precio e imagen', () => {
    expect(defaultProducts.every((product) => product.nombre.trim() && product.precio > 0 && product.imagen)).toBeTrue();
  });

  it('formatea precios en pesos chilenos', () => {
    expect(formatCLP(15000).startsWith('$')).toBeTrue();
    expect(formatCLP(15000).includes('CLP')).toBeTrue();
    expect(formatCLP('10000')).toBe(formatCLP(10000));
  });

  it('obtiene el precio de oferta cuando la oferta es válida', () => {
    expect(getProductPrice({ precio: 15000, enOferta: true, precioOferta: 12000 })).toBe(12000);
  });

  it('mantiene el precio normal cuando no existe una oferta válida', () => {
    expect(getProductPrice({ precio: 15000, enOferta: false, precioOferta: 12000 })).toBe(15000);
    expect(getProductPrice({ precio: 15000, enOferta: true, precioOferta: 18000 })).toBe(15000);
  });
});
