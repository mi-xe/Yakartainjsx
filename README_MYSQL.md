# Yakarta: conexión React + PHP + MySQL

La aplicación utiliza React para la interfaz, PHP para la API y MySQL para guardar todos los datos persistentes. La aplicación ya no utiliza `localStorage` para usuarios, carrito, saldo, direcciones, catálogo, pedidos ni formularios.

## 1. Requisitos

- Node.js 20 o superior y npm.
- PHP 8.1 o superior con las extensiones `pdo` y `pdo_mysql` habilitadas.
- MySQL 8.0 o MariaDB compatible. Puedes usar MySQL desde XAMPP.

## 2. Crear la base de datos

1. Abre XAMPP e inicia **MySQL**.
2. Entra a phpMyAdmin: `http://localhost/phpmyadmin`.
3. Abre la pestaña **Importar**.
4. Selecciona `backend/database.sql` y ejecuta la importación.
5. El script crea la base `yakarta`, las tablas, las nueve categorías y los 28 productos iniciales.

Si ya habías importado el SQL antiguo de Yakarta, haz una copia de seguridad antes de reemplazar la base. La nueva estructura añade tablas y columnas para stock, saldo, carrito, direcciones y pedidos. Para una instalación limpia puedes eliminar la base de datos `yakarta` anterior y volver a importar el archivo actualizado.

## 3. Configurar la conexión MySQL

Abre `backend/config.php`. Los valores predeterminados son:

```php
$host = '127.0.0.1';
$db = 'yakarta';
$user = 'root';
$pass = '';
```

En XAMPP normalmente `root` no tiene contraseña. Si tu MySQL usa otra contraseña, cambia `$pass`. También se pueden utilizar las variables de entorno `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.

## 4. Configurar y levantar el backend PHP

Desde la carpeta raíz del proyecto ejecuta:

```powershell
C:\xampp\php\php.exe -S localhost:8080 -t .
```

Si PHP ya está agregado al PATH, también sirve:

```bash
php -S localhost:8080 -t .
```

Mantén esa terminal abierta. Comprueba la API abriendo `http://localhost:8080/backend/api.php?action=health`. Debe responder con `API Yakarta conectada a MySQL`.

Si prefieres usar Apache de XAMPP, copia el proyecto dentro de `C:\xampp\htdocs\Yakartainjsx-main` y configura en `.env` esta ruta:

```env
VITE_API_URL=http://localhost/Yakartainjsx-main/backend/api.php
```

La API permite solicitudes con credenciales desde Vite en `localhost:5173` y `localhost:5174`. Si usas otro puerto, agrega el origen permitido en `backend/api.php`.

## 5. Levantar React

Abre otra terminal en la carpeta del proyecto:

```bash
npm install
```

Crea un archivo `.env` copiando `.env.example` y verifica que `VITE_API_URL` apunte al PHP que acabas de iniciar. Luego ejecuta:

```bash
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`.

## 6. Cuenta de administrador inicial

El SQL crea esta cuenta para la primera configuración:

- Correo: `admin@tienda.com`
- Contraseña: `123`
- Rol: `Administrador`

Cambia la contraseña después del primer acceso y no uses estas credenciales en un sitio publicado.

Las cuentas creadas desde Registro tendrán rol `Cliente` y saldo inicial de `$ 0 CLP`. Los administradores pueden crear, editar y eliminar usuarios desde el panel. Los abonos desde Fondos son una simulación académica: no procesan pagos bancarios reales. El acceso con Google, Facebook, X y PlayStation requiere una integración OAuth independiente y queda sin activar en esta versión PHP.

## 7. Qué información queda en MySQL

- `usuarios`: datos de cuenta, rol y saldo. La contraseña se almacena como hash seguro.
- `productos`: catálogo, precios, ofertas y stock.
- `categorias`: categorías administrables.
- `carritos` y `carrito_detalles`: carrito del usuario o del visitante.
- `direcciones`: dirección de despacho del usuario o visitante.
- `pedidos` y `pedido_detalles`: historial y detalle de compras.
- `movimientos_saldo`: abonos y cargos de saldo.
- `mensajes_contacto`: formularios enviados desde Contacto.

El navegador solo mantiene la cookie de sesión PHP para que el backend reconozca la sesión; no guarda los datos funcionales de la tienda en `localStorage`. Los datos que estuvieran guardados previamente solo en el `localStorage` del navegador no se importan automáticamente: las cuentas de cliente deberán registrarse nuevamente o crearse desde el panel administrador. El catálogo inicial sí queda sembrado en MySQL.

## 8. Flujo de compra

El usuario puede llenar un carrito como visitante. Al iniciar sesión, el backend vincula el carrito a su cuenta. Para comprar necesita iniciar sesión, guardar la dirección de despacho y tener saldo suficiente. El servidor calcula los precios vigentes, valida el stock, descuenta el saldo y guarda el pedido en una única transacción MySQL.

## 9. Solución de problemas

- **Error de conexión con backend:** confirma que la terminal de PHP siga ejecutándose y que `VITE_API_URL` tenga la ruta correcta.
- **No se pudo conectar con MySQL:** inicia MySQL en XAMPP y revisa `backend/config.php`.
- **La API no acepta la cookie de sesión:** usa `localhost` en frontend y backend (no mezcles `localhost` con `127.0.0.1`), y comprueba que el puerto del frontend esté permitido en `backend/api.php`.
- **Error de tabla o columna inexistente:** importa el `backend/database.sql` actualizado en una base nueva o migra tu base antigua antes de ejecutar la aplicación.
- **Error `could not find driver`:** activa `pdo_mysql` en el `php.ini` utilizado por PHP y reinicia el servidor PHP/Apache.

Para compilar el frontend y ejecutar las pruebas incluidas:

```bash
npm run build
npm test
```
