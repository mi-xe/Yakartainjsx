// Utilidades de presentación. Los datos persistentes viven en MySQL a través de la API Java.
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

/** Supports Vite public paths as well as absolute image URLs stored through the admin/API. */
export function resolveProductImage(image, fallback = '/imgtienda/peak.jpg') {
  const value = String(image ?? '').trim();
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value.replace(/^\.\//, '')}`;
}
