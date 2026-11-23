-- Ejecutar una sola vez sobre la base `yakarta` que fue creada con el backend PHP antiguo.
-- Hace compatible el almacenamiento del carrito con el backend Spring Boot.
-- Las tablas originales carritos / carrito_detalles se conservan como respaldo.

USE yakarta;

-- Normaliza tipos de columnas del esquema PHP antiguo sin eliminar usuarios.
-- Los valores Cliente/Administrador y los saldos actuales se conservan.
ALTER TABLE usuarios
    MODIFY COLUMN rol VARCHAR(30) NOT NULL DEFAULT 'Cliente',
    MODIFY COLUMN saldo DECIMAL(12,2) NOT NULL DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS carrito_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_key VARCHAR(100) NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_carrito_items_owner_product (owner_key, producto_id),
    KEY idx_carrito_items_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO carrito_items (owner_key, producto_id, cantidad)
SELECT
    CASE
      WHEN c.usuario_id IS NOT NULL THEN CONCAT('USER:', c.usuario_id)
      WHEN c.session_id IS NOT NULL AND c.session_id <> '' THEN CONCAT('SESSION:', c.session_id)
      ELSE NULL
    END,
    d.producto_id,
    d.cantidad
FROM carritos c
INNER JOIN carrito_detalles d ON d.carrito_id = c.id
WHERE c.usuario_id IS NOT NULL OR (c.session_id IS NOT NULL AND c.session_id <> '');

-- El backend también mapea usuario_nombre / usuario_email y las columnas antiguas
-- nombre / precio de pedido_detalles. No borres esas columnas ni las tablas antiguas.
