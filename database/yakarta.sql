-- Base de datos de Yakarta para el backend Spring Boot.
-- Es seguro ejecutar este archivo más de una vez: no elimina ni reinicia datos existentes.
CREATE DATABASE IF NOT EXISTS yakarta
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE yakarta;

-- Tabla necesaria para el registro y el inicio de sesión.
-- Las demás tablas del sistema son creadas/actualizadas por JPA al iniciar Spring Boot.
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password VARCHAR(255) NOT NULL,
    google_sub VARCHAR(255) NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'Cliente',
    saldo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email),
    UNIQUE KEY uk_usuarios_google_sub (google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Confirmación rápida de la base seleccionada.
SELECT DATABASE() AS base_de_datos;
