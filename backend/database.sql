CREATE DATABASE IF NOT EXISTS yakarta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yakarta;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('Cliente','Administrador') NOT NULL DEFAULT 'Cliente',
  saldo INT UNSIGNED NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  precio INT UNSIGNED NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  en_oferta TINYINT(1) NOT NULL DEFAULT 0,
  precio_oferta INT UNSIGNED NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 10,
  INDEX idx_productos_categoria (categoria)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carritos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL UNIQUE,
  session_id VARCHAR(128) NULL UNIQUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carrito_detalles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  carrito_id BIGINT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_carrito_producto (carrito_id, producto_id),
  CONSTRAINT fk_carrito_detalles_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
  CONSTRAINT fk_carrito_detalles_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS direcciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL UNIQUE,
  session_id VARCHAR(128) NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  calle VARCHAR(190) NOT NULL,
  comuna VARCHAR(120) NOT NULL,
  telefono VARCHAR(40) NOT NULL,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_direcciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  usuario_nombre VARCHAR(120) NOT NULL,
  usuario_email VARCHAR(190) NOT NULL,
  fecha DATETIME NOT NULL,
  total INT UNSIGNED NOT NULL,
  estado VARCHAR(40) NOT NULL DEFAULT 'Entregado',
  direccion_nombre VARCHAR(120) NOT NULL,
  direccion_calle VARCHAR(190) NOT NULL,
  direccion_comuna VARCHAR(120) NOT NULL,
  direccion_telefono VARCHAR(40) NOT NULL,
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_pedidos_usuario_fecha (usuario_id, fecha)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_detalles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id BIGINT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NULL,
  nombre VARCHAR(160) NOT NULL,
  precio INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  CONSTRAINT fk_pedido_detalles_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_detalles_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movimientos_saldo (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  tipo ENUM('abono','cargo') NOT NULL,
  monto INT UNSIGNED NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_movimientos_usuario_fecha (usuario_id, creado_en)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telefono VARCHAR(40) NOT NULL,
  comentario TEXT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Cuenta administradora inicial. Cambia su contraseña después del primer acceso.
INSERT INTO usuarios (nombre, email, password, rol, saldo)
VALUES 
('Cristian Orlando', 'admin@yakarta.com', 'trescuatro', 'Administrador', 0),
('Mixin 123', 'mixin@yakarta.com', 'mixin2', 'Administrador', 0)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = 'Administrador';

INSERT IGNORE INTO categorias (nombre) VALUES
('Acción'), ('Aventura'), ('RPG'), ('Estrategia'), ('Deportes'),
('Carreras'), ('Terror'), ('Lucha'), ('Simulación');

-- Catálogo original Yakarta, conservando identificadores, precios, ofertas e imágenes.
INSERT INTO productos (id,nombre,precio,imagen,categoria,en_oferta,precio_oferta,stock) VALUES
(1,'Midnight club',15000,'imgtienda/Midnight_Club-Los_Angeles.jpg','Carreras',1,12000,3),
(2,'Fifa street 2',10000,'imgtienda/fifastreet.jpg','Deportes',0,NULL,0),
(3,'Black',5000,'imgtienda/black.jpg','Acción',1,4000,2),
(4,'Burnout 3: takedown',18000,'imgtienda/burnout 3.jpg','Carreras',0,NULL,6),
(5,'Dragon ball tenkaichi 3',13000,'imgtienda/dragonball.webp','Lucha',0,NULL,4),
(6,'Peak',5500,'imgtienda/peak.jpg','Aventura',0,NULL,10),
(7,'Zelda: Ocarina of time',60000,'imgtienda/zelda.jpg','Aventura',0,NULL,5),
(8,'The outlast trials',34000,'imgtienda/the oullasttrials.jpg','Terror',1,29000,7),
(9,'Undertale',8000,'imgtienda/undertae.webp','RPG',0,NULL,30),
(10,'NFS: shift',25000,'imgtienda/nfs shift.jpg','Carreras',0,NULL,2),
(11,'Bordelands 2',6500,'imgtienda/bordelands 2.jpg','Acción',0,NULL,15),
(12,'Warcraft 3: Frozen throne',15000,'imgtienda/warcraft 3.webp','Estrategia',0,NULL,3),
(13,'Gran turismo 5',20000,'imgtienda/gran turismo 5.jpg','Carreras',0,NULL,3),
(14,'Dead by daylight',10000,'imgtienda/dbd.jpg','Terror',1,7500,10),
(15,'Transformers: the game',15500,'imgtienda/transformersgame.jpg','Acción',0,NULL,1),
(16,'Gran turismo 4',17000,'imgtienda/granturismo4.jpg','Carreras',0,NULL,1),
(17,'Detroit',15000,'imgtienda/detroit.jpg','Aventura',0,NULL,3),
(18,'Red dead redemption 2',20000,'imgtienda/rdr2.webp','Aventura',0,NULL,30),
(19,'Papers please',8000,'imgtienda/papersplease.webp','Estrategia',0,NULL,8),
(20,'Mortal kombat 1',67000,'imgtienda/incompleto1.jpg','Lucha',1,59000,2),
(21,'Resident evil requiem',40000,'imgtienda/rd9.jpg','Terror',0,NULL,10),
(22,'Pink extinct reprieve 2',22000,'imgtienda/pink extinct reprieve 2.jpg','Aventura',0,NULL,4),
(23,'Webfishing',3000,'imgtienda/webfishing.jpg','Simulación',0,NULL,1),
(24,'Automobilista 2',9000,'imgtienda/at2.jpg','Simulación',0,NULL,8),
(25,'Left 4 dead 2',5500,'imgtienda/left 4 dead 2.jpg','Acción',1,4500,7),
(26,'Cyberpunk',25500,'imgtienda/cyberpunk.webp','RPG',0,NULL,25),
(27,'GTA VI',100000,'imgtienda/gta6.webp','Aventura',0,NULL,4),
(28,'Blue alive condemnation 2',21000,'imgtienda/blue alive condemnation 2.png','Acción',0,NULL,3)
ON DUPLICATE KEY UPDATE
  nombre=VALUES(nombre), precio=VALUES(precio), imagen=VALUES(imagen), categoria=VALUES(categoria),
  en_oferta=VALUES(en_oferta), precio_oferta=VALUES(precio_oferta);
