-- Diagnóstico de checkout para una cuenta que inició sesión con Google.
-- No modifica datos. Reemplaza el correo del ejemplo por el correo Google usado en Yakarta.
USE yakarta;

SET @correo_google = 'CORREO_GOOGLE_AQUI';

-- 1) Identidad Yakarta, rol y saldo de la cuenta Google.
SELECT id, nombre, email, rol, saldo,
       CASE WHEN google_sub IS NULL OR google_sub = '' THEN 'NO' ELSE 'SI' END AS google_vinculado
FROM usuarios
WHERE LOWER(email) = LOWER(@correo_google);

-- 2) Dirección de despacho asociada a la cuenta.
SELECT d.id, d.usuario_id, d.nombre, d.calle, d.comuna, d.telefono
FROM direcciones d
INNER JOIN usuarios u ON u.id = d.usuario_id
WHERE LOWER(u.email) = LOWER(@correo_google);

-- 3) Carrito asociado a la cuenta. Permite ver que OAuth migró las líneas a USER:<id>.
SELECT ci.id, ci.owner_key, ci.producto_id, p.nombre, ci.cantidad, p.stock, p.precio
FROM carrito_items ci
LEFT JOIN productos p ON p.id = ci.producto_id
WHERE ci.owner_key = CONCAT('USER:', (SELECT id FROM usuarios WHERE LOWER(email) = LOWER(@correo_google) LIMIT 1));

-- 4) Comprueba columnas de las tablas que intervienen al registrar un pedido.
SELECT table_name, column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('usuarios', 'direcciones', 'carrito_items', 'productos', 'pedidos', 'pedido_detalles')
ORDER BY table_name, ordinal_position;
