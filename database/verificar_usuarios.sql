-- Consulta de solo lectura para comprobar dónde guarda las cuentas el backend.
USE yakarta;
SELECT DATABASE() AS base_de_datos;
SELECT id, nombre, email, rol, saldo
FROM usuarios
ORDER BY id DESC;
