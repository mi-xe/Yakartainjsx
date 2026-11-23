-- Vincula de forma segura una cuenta Yakarta con el identificador estable (sub) de Google.
-- Ejecutar en la base configurada por DB_URL (normalmente yakarta). Es idempotente en MySQL 8+.

SET @db_name = DATABASE();

SET @has_google_sub = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name AND table_name = 'usuarios' AND column_name = 'google_sub'
);
SET @ddl = IF(@has_google_sub = 0,
  'ALTER TABLE usuarios ADD COLUMN google_sub VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_google_sub_index = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @db_name AND table_name = 'usuarios' AND index_name = 'uk_usuarios_google_sub'
);
SET @ddl = IF(@has_google_sub_index = 0,
  'CREATE UNIQUE INDEX uk_usuarios_google_sub ON usuarios (google_sub)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Las cuentas antiguas mantienen NULL en google_sub y siguen ingresando con contraseña.
-- Las cuentas Google nuevas se crearán con rol Cliente por defecto.
