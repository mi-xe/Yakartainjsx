// Cliente REST compartido por React. Las sesiones se autentican con cookie HttpOnly del backend.
// Si VITE_API_URL está vacío, conserva el mismo hostname usado para abrir React.
// Así localhost y 127.0.0.1 no generan cookies/orígenes mezclados.
const frontendHost = typeof window !== 'undefined' && window.location.hostname
  ? window.location.hostname
  : 'localhost';
const frontendProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:'
  ? 'https:'
  : 'http:';
export const API_URL = (import.meta.env.VITE_API_URL || `${frontendProtocol}//${frontendHost}:8080/api`).replace(/\/+$/, '');
export const BACKEND_URL = API_URL.replace(/\/api$/i, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (cause) {
    const error = new Error(`No se pudo conectar con el backend (${API_URL}). Inicia YakartaBackend con Spring Boot y revisa la URL de VITE_API_URL.`);
    error.cause = cause;
    error.status = 0;
    throw error;
  }
  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) {
    const serverMessage = result?.message || result?.error;
    const error = new Error(serverMessage || `El backend respondió HTTP ${response.status}. Comprueba que estás ejecutando el backend Spring Boot de Yakarta.`);
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}

const json = (method, data) => ({ method, body: JSON.stringify(data ?? {}) });

async function uploadForm(path, formData) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch (cause) {
    const error = new Error(`No se pudo conectar con el backend (${API_URL}).`);
    error.cause = cause;
    error.status = 0;
    throw error;
  }
  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) {
    const error = new Error(result?.message || `El backend respondió HTTP ${response.status}.`);
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}

async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append('file', file);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch (cause) {
    const error = new Error(`No se pudo conectar con el backend (${API_URL}).`);
    error.cause = cause;
    error.status = 0;
    throw error;
  }
  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) {
    const error = new Error(result?.message || `El backend respondió HTTP ${response.status}.`);
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}

export const api = {
  health: () => request('/health'),
  products: () => request('/productos'),
  product: (id) => request(`/productos/${id}`),
  createProduct: (product) => request('/productos', json('POST', product)),
  updateProduct: (id, product) => request(`/productos/${id}`, json('PUT', product)),
  uploadProductImage: (file) => uploadFile('/archivos/imagenes', file),
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
  sendReceiptEmail: (id, pdfBlob) => {
    const formData = new FormData();
    formData.append('receipt', pdfBlob, `boleta-yakarta-${id}.pdf`);
    return uploadForm(`/pedidos/${id}/boleta/email`, formData);
  },
  deleteOrder: (id) => request(`/pedidos/${id}`, { method: 'DELETE' }),
};

export async function apiRequest(action, data = null) {
  if (action === 'products') return { products: await api.products() };
  if (action === 'register') return api.register(data);
  if (action === 'login') return api.login(data);
  throw new Error(`Acción API desconocida: ${action}`);
}
