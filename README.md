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
## Acceso oculto a Daytona USA 2

Al final del footer hay un enlace discreto llamado **Daytona**. Abre el juego en una página completa e independiente en `/daytona/index.html`; no se monta dentro de un iframe ni forma parte del backend.

Los archivos del juego están dentro de `public/daytona/`. Al abrir la página, `main.js` inicializa el motor WebGPU/WebAssembly y carga automáticamente `dayto2pe.zip`, incluido en esa carpeta. No es necesario seleccionar la ROM manualmente.

Para jugar, sirve el frontend mediante Vite (`npm run dev`) en `localhost` o mediante HTTPS; no abras el HTML con `file://`. Usa una versión actual de Chrome o Edge con WebGPU habilitado. En la primera visita, el mecanismo de aislamiento de origen cruzado puede provocar una recarga automática.


## Acceso al emulador Daytona

El emulador está incluido en `public/daytona/`. Desde la página de inicio, escribe `daytona` en el teclado para abrirlo. El footer no muestra un enlace al emulador.

## Footer

El pie de página incluye el logo de Yakarta, accesos a Tienda, Novedades y Nosotros, y los datos de contacto registrados en la página Contacto.
