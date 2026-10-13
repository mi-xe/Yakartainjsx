export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function formatCLP(value) {
  return `$ ${Number(value).toLocaleString('es-CL')} CLP`;
}

export function getCurrentUser() {
  return readStorage('usuarioLogueado', null);
}


export function getCustomerBalance(email) {
  if (!email) return 0;
  const balances = readStorage('saldosClientes', {});
  return Number(balances[email.toLowerCase()] ?? 0);
}

export function setCustomerBalance(email, amount) {
  if (!email) return;
  const balances = readStorage('saldosClientes', {});
  balances[email.toLowerCase()] = Math.max(0, Number(amount) || 0);
  writeStorage('saldosClientes', balances);
}

export function ensureCustomerBalance(email) {
  if (!email) return 0;
  const balances = readStorage('saldosClientes', {});
  const normalizedEmail = email.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(balances, normalizedEmail)) {
    balances[normalizedEmail] = 0;
    writeStorage('saldosClientes', balances);
  }
  return Number(balances[normalizedEmail]) || 0;
}

export function getProductPrice(product) {
  const regularPrice = Number(product?.precio) || 0;
  const offerPrice = Number(product?.precioOferta);
  return product?.enOferta && Number.isFinite(offerPrice) && offerPrice > 0 && offerPrice < regularPrice
    ? offerPrice
    : regularPrice;
}
