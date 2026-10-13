// XAMPP Apache debe estar encendido. Si cambias el nombre de la carpeta en htdocs, cambia esta URL.
export const API_URL = 'http://localhost/Yakartainjsx/backend/api.php';

export async function apiRequest(action, data = null) {
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.message || 'No se pudo conectar con el servidor.');
  return result;
}
