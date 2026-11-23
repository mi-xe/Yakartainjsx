// Utilidades de presentación. Los datos persistentes viven en MySQL a través de la API Java.
import { API_URL } from './api';
export function formatCLP(value) {
  return `$ ${Number(value || 0).toLocaleString('es-CL')} CLP`;
}

export function getProductPrice(product) {
  const regularPrice = Number(product?.precio) || 0;
  const offerPrice = Number(product?.precioOferta);
  return product?.enOferta && Number.isFinite(offerPrice) && offerPrice > 0 && offerPrice < regularPrice
    ? offerPrice
    : regularPrice;
}

/**
 * Normaliza rutas que se escriben desde el panel.
 * Las rutas absolutas del disco del administrador (C:\..., file://...) no son
 * accesibles desde otros equipos: deben subirse mediante el selector de archivos.
 */
export function normalizeProductImagePath(image) {
  const raw = String(image ?? '').trim();
  if (!raw) return '';
  if (/^(?:[a-z]:[\\/]|file:\/\/|\\\\)/i.test(raw)) {
    throw new Error('La ruta pertenece al disco de tu computador y no puede verla la tienda. Usa “Subir desde el equipo” para copiar la imagen al servidor.');
  }
  let value = raw.replace(/\\/g, '/');
  value = value.replace(/^\.\//, '');
  if (/^uploads\//i.test(value)) value = `/${value}`;
  if (/^public\//i.test(value)) value = `/${value.slice('public/'.length)}`;
  return value;
}

/** Supports Vite public paths as well as uploaded images served by Spring Boot. */
export function resolveProductImage(image, fallback = '/imgtienda/peak.jpg') {
  let value;
  try { value = normalizeProductImagePath(image); } catch { return fallback; }
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${new URL(API_URL).origin}${value}`;
  if (value.startsWith('/')) return value;
  return `/${value}`;
}
