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
