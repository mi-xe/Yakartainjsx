# Yakarta Frontend — proyecto independiente

Este directorio contiene **únicamente el frontend React + Vite** de Yakarta. El backend Spring Boot se entrega como un segundo proyecto separado. Ambos se ejecutan en terminales independientes y se comunican a través de la API REST; el frontend no contiene código Java, PHP ni scripts de base de datos.

## Requisitos

- Node.js 20 o superior.
- npm.
- El backend independiente YakartaBackend ejecutándose y accesible por HTTP.

## Configurar la URL del backend

Crea o edita `.env` en la raíz de este proyecto:

```env
VITE_API_URL=http://localhost:8080/api
```

Si frontend y backend se ejecutan en el mismo equipo y utilizas `localhost` o `127.0.0.1` para abrir React, también puedes dejar `VITE_API_URL=` vacío. El cliente React usará automáticamente el mismo hostname con el puerto `8080`. Si el backend está en otra máquina, escribe su URL completa, por ejemplo `http://192.168.1.10:8080/api`.

Después de modificar `.env`, reinicia Vite para que tome el nuevo valor.

## Ejecutar únicamente el frontend

Abre una terminal en esta carpeta (la que contiene `package.json`) y ejecuta:

```bash
npm install
npm run dev
```

Vite mostrará la dirección local, normalmente `http://localhost:5173`.

Para comprobar la compilación de producción y las pruebas:

```bash
npm run build
npm test
```

## Comunicación entre proyectos

React consume la API REST del backend a través de `src/lib/api.js`. El navegador no se conecta directamente a MySQL. El backend independiente se encarga de la base de datos, autenticación y persistencia.

La tienda, el carrito, las cuentas, las categorías, las compras y el panel de administración necesitan que el backend esté iniciado. Para conocer los pasos de instalación de MySQL y el comando de inicio de Spring Boot, consulta el README del proyecto **YakartaBackend**.

## Administrar juegos y plataformas

En **Administración → Juegos y productos**, al crear o editar un juego puedes definir una descripción personalizada, subir su portada y agregar hasta 12 imágenes de previsualización. Las imágenes se pueden seleccionar desde tu computador o indicar mediante URL/ruta pública. También puedes seleccionar varias plataformas, limitadas a **PC, PlayStation 3, PlayStation 4, PlayStation 5, Xbox Series S/X, Nintendo Switch y Nintendo Switch 2**.

Las etiquetas aparecen en las tarjetas de la tienda y en la ficha de detalle. Los iconos representan PC, consolas o ambas plataformas. Los productos antiguos conservan información de respaldo para sus descripciones y galerías cuando todavía no tienen datos personalizados guardados.

Las imágenes seleccionadas desde el panel se envían al endpoint `POST /api/archivos/imagenes` del backend. La respuesta de ese endpoint devuelve una ruta como `/uploads/productos/<archivo>.webp`; esa ruta se agrega al arreglo `imagenesPreview` y se guarda al enviar `POST` o `PUT /api/productos`. Los archivos se almacenan físicamente en `uploads/productos/` dentro del backend, mientras MySQL guarda la ruta en `productos.imagenes_preview`. Conserva esa carpeta junto con la base de datos.

**No pegues una ruta local de tu PC** como `C:\Users\...`: el navegador de la tienda ni el servidor pueden leer directamente el disco del administrador. Para ese caso usa **Subir desde el equipo**. En el campo de texto puedes pegar una URL pública (`https://...`) o una ruta ya servida por el backend (`/uploads/productos/...`) o por Vite (`/imgtienda/...`).

## Footer y boletas

El pie de página incluye el logo de Yakarta, accesos de navegación y datos de contacto. En **Mis Compras** cada pedido dispone de las opciones para descargar e imprimir la boleta.

## Importante: separación de los proyectos

Este ZIP no incluye backend, MySQL, Java, PHP, `node_modules` ni una copia del proyecto Spring Boot. Ejecuta el frontend desde esta carpeta y el backend desde su propia carpeta. No muevas los archivos de uno dentro del otro.

## Ajustes del formulario de productos

El formulario de crear/editar juegos mantiene ahora la cabecera y los botones de acción visibles mientras se desplaza el contenido del formulario. El botón muestra **Crear juego** al registrar y **Guardar cambios** al editar. La galería ofrece acciones para agregar capturas tanto antes como después de la lista, con un máximo de 12, y bloquea temporalmente cambios de filas mientras una imagen está subiendo.

La descripción es un campo controlado por React y se envía explícitamente en el JSON de `POST /api/productos` o `PUT /api/productos/{id}`. Tras guardar, el frontend vuelve a consultar el producto mediante `GET /api/productos/{id}` para comprobar que el valor quedó disponible desde el backend. La tienda utiliza `producto.descripcion` al cargar su catálogo.

Asegúrate de que `VITE_API_URL` apunte al backend Spring Boot actualizado, normalmente `http://localhost:8080/api`.

### Guardado y verificación de capturas

El formulario espera que todas las cargas terminen antes de permitir guardar. Después de guardar el producto, consulta `GET /api/productos/{id}` para comparar la galería persistida con las URLs enviadas. Si el GET falla después de que el backend haya devuelto un ID, el formulario conserva el ID y los cambios para reintentar una actualización sin crear un producto duplicado.


## Inventario visible en tienda y carrito

- La tienda utiliza el campo `stock` que devuelve `GET /api/productos`.
- Los productos con stock cero se muestran atenuados con la etiqueta **FUERA DE STOCK** y no permiten agregarse al carrito.
- La ficha de previsualización muestra las unidades disponibles.
- El carrito permite ajustar cantidades sin superar el stock informado por el backend; si el inventario cambia mientras el producto está en el carrito, bloquea el checkout y permite corregir o quitar la línea.
- El panel de administración vuelve a consultar productos cuando recupera el foco para mostrar los cambios de inventario posteriores a una compra.

La compra descuenta stock en el backend al confirmar el pedido; el navegador no modifica el inventario por su cuenta.


## Inicio de sesión con Google

El botón **Continuar con Google** redirige al backend independiente en `http://localhost:8080/oauth2/authorization/google`. El Client Secret no se configura en React: solo debe existir en las variables de entorno de Spring Boot.

Configura `VITE_API_URL=http://localhost:8080/api` si necesitas fijar la dirección del backend. El callback de autenticación vuelve a la ruta `/oauth/callback` del frontend.

## Pago con cuenta Google

El checkout utiliza la misma sesión de servidor que genera Google OAuth. El cliente REST envía la cookie HttpOnly con `credentials: include`. Abre el frontend y el backend siempre con el mismo hostname (`localhost` en ambos, no mezcles `localhost` con `127.0.0.1`).

Las compras de cuentas Cliente se pagan con el saldo Yakarta. Las cuentas nuevas creadas con Google parten con saldo cero; utiliza la sección Fondos antes de confirmar un pedido. La pantalla Resumen muestra el saldo y el total, ofrece el acceso a Fondos y desactiva el botón de pago mientras el saldo sea insuficiente.

## Boletas con logo y miniaturas

La vista de detalle de compra, la impresión y el PDF muestran el logo de Yakarta centrado al principio y miniaturas de los juegos. El API de pedidos entrega `productos[].imagen`, que corresponde a la imagen guardada como instantánea al confirmar el pedido. Para pedidos antiguos, el backend recupera la imagen actual del producto cuando la relación sigue disponible.

El botón **Enviar boleta por correo** se muestra solo cuando `GET /api/auth/me` indica `authProvider: "GOOGLE"`. El PDF se genera en el navegador y se envía como adjunto al endpoint `POST /api/pedidos/{id}/boleta/email`; el backend valida de nuevo que la sesión actual sea Google y que el pedido pertenezca al usuario. El destinatario nunca se elige en el frontend: se utiliza el correo Google verificado asociado a la cuenta Yakarta.


### Envío de boletas por correo

La interfaz solo muestra una confirmación informativa cuando el backend devuelve `acceptedBySmtp: true`. El mensaje identifica el destinatario, el remitente y el `Message-ID`. La aceptación SMTP no garantiza que el proveedor coloque el mensaje en Recibidos: revisar Spam, Promociones, Todos los correos y la carpeta Enviados de la cuenta emisora.


## Plataformas del catálogo

El formulario de administración permite asignar varias plataformas por producto. Las opciones incluyen `PlayStation 2` y `PSP`, además de las plataformas ya existentes. La API valida las mismas opciones antes de guardar.
