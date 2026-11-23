-- Yakarta: descripción, galería de capturas y plataformas.
-- Ejecutar en la misma base de datos indicada por DB_URL en application.properties.
-- Las listas se guardan como JSON de texto en columnas TEXT.
-- Selecciona en phpMyAdmin la misma base de datos indicada por DB_URL antes de ejecutar.
SET @schema_name = DATABASE();

-- Descripción personalizada.
SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'productos' AND column_name = 'descripcion') = 0,
  'ALTER TABLE productos ADD COLUMN descripcion TEXT NULL',
  'SELECT ''La columna descripcion ya existe'' AS migracion'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Galería. Si existía como JSON nativo, convertir a TEXT conserva el JSON almacenado.
SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'productos' AND column_name = 'imagenes_preview') = 0,
  'ALTER TABLE productos ADD COLUMN imagenes_preview TEXT NULL',
  IF(
    (SELECT DATA_TYPE FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'productos' AND column_name = 'imagenes_preview' LIMIT 1) = 'json',
    'ALTER TABLE productos MODIFY COLUMN imagenes_preview TEXT NULL',
    'SELECT ''La columna imagenes_preview ya es compatible'' AS migracion'
  )
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Plataformas. También preserva los valores JSON de una instalación anterior.
SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'productos' AND column_name = 'plataformas') = 0,
  'ALTER TABLE productos ADD COLUMN plataformas TEXT NULL',
  IF(
    (SELECT DATA_TYPE FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'productos' AND column_name = 'plataformas' LIMIT 1) = 'json',
    'ALTER TABLE productos MODIFY COLUMN plataformas TEXT NULL',
    'SELECT ''La columna plataformas ya es compatible'' AS migracion'
  )
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Completar valores vacíos o inválidos de productos anteriores sin reemplazar
-- galerías que ya contienen arrays JSON. Se separa JSON_LENGTH de la validación
-- para no intentar medir valores que no sean JSON válido.
UPDATE productos
SET imagenes_preview = '[]'
WHERE imagenes_preview IS NULL OR TRIM(imagenes_preview) = '' OR JSON_VALID(imagenes_preview) = 0;

UPDATE productos
SET plataformas = '["PC"]'
WHERE plataformas IS NULL OR TRIM(plataformas) = '' OR JSON_VALID(plataformas) = 0;

UPDATE productos
SET plataformas = '["PC"]'
WHERE JSON_VALID(plataformas) = 1 AND JSON_LENGTH(plataformas) = 0;

SELECT 'Migración de metadatos de productos finalizada' AS resultado;
