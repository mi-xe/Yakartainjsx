# Configurar Yakarta con XAMPP (MySQL + phpMyAdmin)

Este proyecto es React + Vite. React no se conecta directamente a MySQL: el PHP de `backend/` actúa como API y phpMyAdmin sirve para administrar/ver la base de datos.

## 1. Preparar XAMPP
1. Descomprime la carpeta del proyecto.
2. Copia la carpeta `backend` a `C:\xampp\htdocs\Yakartainjsx\backend` (debe quedar `C:\xampp\htdocs\Yakartainjsx\backend\api.php`).
3. Abre el panel de XAMPP e inicia **Apache** y **MySQL**.
4. Abre `http://localhost/phpmyadmin`.
5. Entra en **Importar**, selecciona `backend/database.sql` y pulsa **Importar**. Esto crea la base `yakarta` y las tablas `usuarios`, `productos` y `mensajes_contacto`.

## 2. Comprobar conexión
Abre `http://localhost/Yakartainjsx/backend/api.php?action=health`. Debe responder `{"ok":true,"message":"API conectada a MySQL"}`.

Si muestra error de conexión, revisa usuario/contraseña en `C:\xampp\htdocs\Yakartainjsx\backend\config.php`. En una instalación local típica de XAMPP, el usuario es `root` y la contraseña está vacía.

## 3. Ejecutar React
Desde la carpeta del proyecto (donde está `package.json`), abre CMD/Terminal y ejecuta:

```bash
npm install
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`. Apache/MySQL deben seguir encendidos. La URL de la API está en `src/lib/api.js`; si renombraste la carpeta en `htdocs`, cambia `http://localhost/Yakartainjsx/backend/api.php` por la ruta correcta.

## 4. Verificar
- Registra una cuenta desde `/registro` y revisa phpMyAdmin → `yakarta` → `usuarios`.
- Inicia sesión con esa cuenta.
- El catálogo de `/tienda` carga los productos desde la tabla `productos`.
- Administrador local de demostración: `admin@tienda.com` / `123`.

**Importante:** en esta versión, registro, inicio de sesión y lectura del catálogo ya usan MySQL mediante PHP. Otras funciones del sitio (carrito, compras, saldos y parte de la administración) aún guardan datos en `localStorage`; no se deben considerar persistidas en MySQL todavía. La cuenta de administrador indicada es solo para demostración local.
