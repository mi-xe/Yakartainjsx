// Funciones puras de presentación. Los datos persistentes se consultan y guardan en MySQL mediante api.js.
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
