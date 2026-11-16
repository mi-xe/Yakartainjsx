// API REST de Spring Boot. Ejecuta el backend en http://localhost:8080.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  const text = await response.text();
  let result = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  if (!response.ok) throw new Error(result?.message || result?.error || `Error HTTP ${response.status}`);
  return result;
}
const json = (method, data) => ({ method, body: JSON.stringify(data) });
export const api = {
  products: () => request('/productos'), product: (id) => request(`/productos/${id}`),
  createProduct: (p) => request('/productos', json('POST', p)), updateProduct: (id,p) => request(`/productos/${id}`, json('PUT',p)), deleteProduct: (id) => request(`/productos/${id}`, {method:'DELETE'}),
  categories: () => request('/categorias'), createCategory: (nombre) => request('/categorias',json('POST',{nombre})), updateCategory: (id,nombre) => request(`/categorias/${id}`,json('PUT',{nombre})), deleteCategory: (id) => request(`/categorias/${id}`,{method:'DELETE'}),
  register: (data) => request('/auth/registro',json('POST',data)), login: (data) => request('/auth/login',json('POST',data)),
  orders: () => request('/pedidos'), order: (id) => request(`/pedidos/${id}`),
  createOrder: (data) => request('/pedidos',json('POST',data)),
  updateOrder: (id,data) => request(`/pedidos/${id}`,json('PUT',data)),
  deleteOrder: (id) => request(`/pedidos/${id}`,{method:'DELETE'}),
  orderDetails: () => request('/pedidos-detalle'),
  orderDetail: (id) => request(`/pedidos-detalle/${id}`),
  createOrderDetail: (data) => request('/pedidos-detalle',json('POST',data)),
  updateOrderDetail: (id,data) => request(`/pedidos-detalle/${id}`,json('PUT',data)),
  deleteOrderDetail: (id) => request(`/pedidos-detalle/${id}`,{method:'DELETE'}),
};
// Compatibilidad temporal con los componentes que ya usan apiRequest(action).
export async function apiRequest(action, data = null) {
  if (action === 'products') return { products: await api.products() };
  if (action === 'register') return api.register(data);
  if (action === 'login') return api.login(data);
  throw new Error(`Acción API desconocida: ${action}`);
}
