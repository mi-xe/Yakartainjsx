# Yakarta Frontend (React + Vite)

Este es el proyecto **frontend independiente** de Yakarta. Contiene únicamente React/Vite, sus componentes, páginas, estilos, imágenes y pruebas. No incluye código Java, Spring Boot ni scripts SQL.

## Requisitos
- Node.js 20 o superior.
- npm.
- El backend REST de Yakarta ejecutándose por separado en `http://localhost:8080`.

## Configurar la URL de la API

En la raíz del proyecto está el archivo `.env`. Por defecto puede dejarse así:

```env
VITE_API_URL=
```

Cuando la variable queda vacía, el frontend usa automáticamente el mismo hostname con que abriste React y el puerto `8080` (por ejemplo `localhost:8080` o `127.0.0.1:8080`). Si tu backend está en otra máquina, escribe su dirección completa, por ejemplo `VITE_API_URL=http://192.168.1.10:8080/api`. Después de modificar `.env`, reinicia Vite.

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

La API debe responder en `http://localhost:8080/api/health` (o el mismo hostname que uses para React). Ahora este endpoint confirma que MySQL está conectado, que existe la tabla `usuarios`, qué base se está utilizando y cuántas cuentas hay guardadas. El formulario de registro comprueba esa respuesta antes de enviar los datos. Desde React, el cliente HTTP está en `src/lib/api.js` y la sesión se gestiona en `src/context/AuthContext.jsx` mediante cookie HttpOnly.
## Acceso oculto a Daytona USA 2

Al final del footer hay un enlace discreto llamado **Daytona**. Abre el juego en una página completa e independiente en `/daytona/index.html`; no se monta dentro de un iframe ni forma parte del backend.

Los archivos del juego están dentro de `public/daytona/`. Al abrir la página, `main.js` inicializa el motor WebGPU/WebAssembly y carga automáticamente `dayto2pe.zip`, incluido en esa carpeta. No es necesario seleccionar la ROM manualmente.

Para jugar, sirve el frontend mediante Vite (`npm run dev`) en `localhost` o mediante HTTPS; no abras el HTML con `file://`. Usa una versión actual de Chrome o Edge con WebGPU habilitado. En la primera visita, el mecanismo de aislamiento de origen cruzado puede provocar una recarga automática.


## Acceso al emulador Daytona

El emulador está incluido en `public/daytona/`. Desde la página de inicio, escribe `daytona` en el teclado para abrirlo. El footer no muestra un enlace al emulador.

## Footer

El pie de página incluye el logo de Yakarta, accesos a Tienda, Novedades y Nosotros, y los datos de contacto registrados en la página Contacto.


## Cuentas, catálogo y boletas

El inicio de sesión, el registro y el catálogo consultan la API REST indicada por `VITE_API_URL`. El panel de administración guarda productos en esa misma API; la tienda obtiene el catálogo actualizado desde `/productos`. Las rutas de imágenes locales deben existir dentro de `public/` (por ejemplo `public/imgtienda/juego.jpg`); también se aceptan URLs HTTPS.

En **Mis Compras**, cada pedido dispone de las opciones **Descargar boleta** (PDF) e **Imprimir boleta**. El frontend genera la representación de la boleta a partir de los datos del pedido devueltos por el backend.
