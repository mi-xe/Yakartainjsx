# Yakarta

Tienda web de juegos físicos creada con React, Vite y Bootstrap.

## Iniciar el proyecto

```bash
npm install
npm run dev
```

## Pruebas automatizadas

```bash
npm test
```

El proyecto incluye 50 pruebas automatizadas (25 pruebas base y 25 nuevas pruebas funcionales). Están en `src/components/__tests__/componentes.spec.cjs` y se ejecutan con Jasmine y jsdom. La configuración se encuentra en `jasmine.json`; el archivo `test/setup.cjs` prepara el entorno de pruebas.

## Funcionalidades añadidas

- Filtro de juegos por categoría y opción para mostrar solo ofertas.
- Distintivo **¡OFERTA!** y precio rebajado para productos en promoción.
- Saldo de cliente inicial de $0 CLP, persistente por correo durante la navegación.
- Página `/fondos` para añadir $1.000, $2.000, $5.000 o $10.000 CLP.
- Descuento del saldo al confirmar una compra y bloqueo de compra por saldo insuficiente.
- Formulario de contacto que guarda solicitudes en `localStorage` (`solicitudesContacto`).
- Alta de usuarios desde el panel administrador con contraseña que también permite iniciar sesión.

## Cuenta de acceso predeterminada

En `src/pages/IniciarSesion.jsx`, dentro de la función `submit`, existe una cuenta de administrador de demostración:

- Correo: `admin@tienda.com`
- Contraseña: `123`
- Rol: Administrador

El panel `src/pages/Administracion.jsx` también muestra registros iniciales de ejemplo (`cristian@admin.com`, `juan@gmail.com`, `mixin@admin.com`), definidos en `defaultUsers`. Esos registros de demostración no traen contraseña definida y, por sí solos, no son credenciales de inicio de sesión. Para que un usuario creado desde el panel pueda entrar, asigna una contraseña en el formulario **Nuevo Usuario**.

> Esta aplicación es una demostración front-end: las cuentas, contraseñas, saldos y solicitudes se guardan en `localStorage` del navegador. No es un sistema de autenticación o pagos seguro para producción; en una aplicación real, las contraseñas y los saldos deben gestionarse en un servidor.
