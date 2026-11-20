// Cliente de la API PHP + MySQL. Todas las peticiones envían la cookie de sesión PHP.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/backend/api.php';

async function request(action, { method = 'GET', data, id } = {}) {
  const url = new URL(API_URL, window.location.origin);
  url.searchParams.set('action', action);
  if (id !== undefined && id !== null) url.searchParams.set('id', String(id));

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      credentials: 'include',
      headers: data !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new Error(`No se pudo contactar con el backend PHP (${API_URL}). Comprueba que el servidor PHP esté iniciado.`);
  }

  const raw = await response.text();
  let result;
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('El backend no devolvió JSON válido. Revisa la URL de la API y los errores de PHP.');
  }

  if (!response.ok || result.ok === false) {
    const error = new Error(result.message || `Error HTTP ${response.status}`);
    error.status = response.status;
    error.code = result.code;
    error.details = result;
    throw error;
  }
  return result;
}

const get = (action) => request(action);
const post = (action, data = {}) => request(action, { method: 'POST', data });
const put = (action, id, data) => request(action, { method: 'PUT', id, data });
const remove = (action, id) => request(action, { method: 'DELETE', id });

export const api = {
  health: () => get('health'),

  register: async (data) => (await post('register', data)),
  login: async (data) => (await post('login', data)),
  logout: () => post('logout'),
  me: async () => (await get('me')).user,

  products: async () => (await get('products')).products,
  createProduct: async (product) => (await post('products', product)).product,
  updateProduct: async (id, product) => (await put('products', id, product)).product,
  deleteProduct: (id) => remove('products', id),

  categories: async () => (await get('categories')).categories,
  createCategory: (nombre) => post('categories', { nombre }),
  updateCategory: (id, nombre) => put('categories', id, { nombre }),
  deleteCategory: (id) => remove('categories', id),

  users: async () => (await get('users')).users,
  createUser: (data) => post('users', data),
  updateUser: (id, data) => put('users', id, data),
  deleteUser: (id) => remove('users', id),

  cart: () => get('cart'),
  addToCart: (productoId, cantidad = 1) => post('cart-add', { productoId, cantidad }),
  removeFromCart: (productoId) => post('cart-remove', { productoId }),
  clearCart: () => post('cart-clear'),

  address: async () => (await get('address')).address,
  saveAddress: (address) => post('address', address),

  balance: async () => (await get('balance')).saldo,
  addFunds: async (monto) => (await post('funds-add', { monto })).saldo,

  submitContact: (data) => post('contact', data),
  orders: async () => (await get('orders')).orders,
  checkout: async () => (await post('checkout')).order,
};

// Compatibilidad para las dos pantallas que anteriormente usaban apiRequest.
export async function apiRequest(action, data = null) {
  if (action === 'products') return { products: await api.products() };
  if (action === 'register') return api.register(data);
  if (action === 'login') return api.login(data);
  throw new Error(`Acción API desconocida: ${action}`);
}
