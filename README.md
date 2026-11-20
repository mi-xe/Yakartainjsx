# Yakarta Frontend (React + Vite)

Este es el proyecto **frontend independiente** de Yakarta. Contiene únicamente React/Vite, sus componentes, páginas, estilos, imágenes y pruebas. No incluye código Java, Spring Boot ni scripts SQL.

## Requisitos
- Node.js 20 o superior.
- npm.
- El backend REST de Yakarta ejecutándose por separado en `http://localhost:8080`.

## Configurar la URL de la API

En la raíz del proyecto está el archivo `.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

El frontend usa esa URL para hacer solicitudes HTTP al backend. Puedes cambiarla por la URL de otro servidor sin modificar las páginas React.

## Ejecutar solo el frontend

Desde esta carpeta (donde está `package.json`):

```powershell
npm install
npm run dev
```

Vite mostrará una URL, normalmente `http://localhost:5173`.

## Comunicación con el backend

React no se conecta directamente a MySQL. React realiza solicitudes HTTP a la API REST de Spring Boot (`VITE_API_URL`); Spring Boot es el único que se conecta a MySQL.

Para que el catálogo, las cuentas, el carrito, el saldo, las direcciones y las compras funcionen, el backend debe estar iniciado por separado. Consulta el README del proyecto backend para configurarlo.

## Comprobación

La API debe responder en `http://localhost:8080/api/health`. Desde React, el cliente HTTP está en `src/lib/api.js` y la sesión de usuario se gestiona en `src/context/AuthContext.jsx` mediante cookie HttpOnly, no mediante almacenamiento local del navegador.
