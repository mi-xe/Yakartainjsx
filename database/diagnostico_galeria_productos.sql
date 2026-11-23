-- Ejecuta esta consulta después de crear/editar un juego desde el panel.
-- Debe mostrar las URL subidas dentro de imagenes_preview como un arreglo JSON.
-- Selecciona en phpMyAdmin la misma base de datos indicada por DB_URL.
SELECT
    id,
    nombre,
    imagen AS portada_guardada,
    descripcion,
    imagenes_preview AS galeria_guardada,
    plataformas
FROM productos
ORDER BY id DESC
LIMIT 30;
