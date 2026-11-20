// Cliente REST compartido por React. Las sesiones se autentican con cookie HttpOnly del backend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) {
    const error = new Error(result?.message || result?.error || `Error HTTP ${response.status}`);
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}

const json = (method, data) => ({ method, body: JSON.stringify(data ?? {}) });

export const api = {
  health: () => request('/health'),
  products: () => request('/productos'),
  product: (id) => request(`/productos/${id}`),
  createProduct: (product) => request('/productos', json('POST', product)),
  updateProduct: (id, product) => request(`/productos/${id}`, json('PUT', product)),
  deleteProduct: (id) => request(`/productos/${id}`, { method: 'DELETE' }),

  categories: () => request('/categorias'),
  createCategory: (nombre) => request('/categorias', json('POST', { nombre })),
  updateCategory: (id, nombre) => request(`/categorias/${id}`, json('PUT', { nombre })),
  deleteCategory: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),

  register: (data) => request('/auth/registro', json('POST', data)),
  login: (data) => request('/auth/login', json('POST', data)),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', json('POST', {})),
  addFunds: (amount) => request('/auth/fondos', json('POST', { amount })),

  users: () => request('/usuarios'),
  createUser: (data) => request('/usuarios', json('POST', data)),
  updateUser: (id, data) => request(`/usuarios/${id}`, json('PUT', data)),
  deleteUser: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  getCart: () => request('/carrito'),
  addCartItem: (productoId, cantidad = 1) => request('/carrito', json('POST', { productoId, cantidad })),
  updateCartItem: (productoId, cantidad) => request(`/carrito/items/${productoId}`, json('PUT', { productoId, cantidad })),
  removeCartItem: (productoId) => request(`/carrito/items/${productoId}`, { method: 'DELETE' }),
  clearCart: () => request('/carrito', { method: 'DELETE' }),

  getAddress: () => request('/direccion'),
  saveAddress: (data) => request('/direccion', json('PUT', data)),
  sendContact: (data) => request('/contacto', json('POST', data)),

  orders: () => request('/pedidos'),
  order: (id) => request(`/pedidos/${id}`),
  createOrder: () => request('/pedidos', json('POST', {})),
  deleteOrder: (id) => request(`/pedidos/${id}`, { method: 'DELETE' }),
};

export async function apiRequest(action, data = null) {
  if (action === 'products') return { products: await api.products() };
  if (action === 'register') return api.register(data);
  if (action === 'login') return api.login(data);
  throw new Error(`Acción API desconocida: ${action}`);
}
