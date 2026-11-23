-- Ejecuta en la misma base de datos configurada en DB_URL.
-- Muestra el stock actual registrado por MySQL para cada juego.
SELECT id, nombre, stock
FROM productos
ORDER BY nombre, id;

-- Muestra las últimas líneas de pedidos junto con el stock actual del producto.
SELECT pd.pedido_id, pd.producto_id, pd.nombre_producto, pd.cantidad AS unidades_compradas,
       p.stock AS stock_actual
FROM pedido_detalles pd
LEFT JOIN productos p ON p.id = pd.producto_id
ORDER BY pd.pedido_id DESC, pd.id DESC
LIMIT 100;
