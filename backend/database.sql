CREATE DATABASE IF NOT EXISTS yakarta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yakarta;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('Cliente','Administrador') NOT NULL DEFAULT 'Cliente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  precio INT UNSIGNED NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  en_oferta TINYINT(1) NOT NULL DEFAULT 0,
  precio_oferta INT UNSIGNED NULL
);

CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telefono VARCHAR(40) NOT NULL,
  comentario TEXT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO productos (id,nombre,precio,imagen,categoria,en_oferta,precio_oferta) VALUES
(1,'Midnight club',15000,'imgtienda/Midnight_Club-Los_Angeles.jpg','Carreras',1,12000),
(2,'Fifa street 2',10000,'imgtienda/fifastreet.jpg','Deportes',0,NULL),
(3,'Black',5000,'imgtienda/black.jpg','Acción',1,4000),
(4,'Burnout 3: takedown',18000,'imgtienda/burnout 3.jpg','Carreras',0,NULL),
(5,'Dragon ball tenkaichi 3',13000,'imgtienda/dragonball.webp','Lucha',0,NULL),
(6,'Peak',5500,'imgtienda/peak.jpg','Aventura',0,NULL),
(7,'Zelda: Ocarina of time',60000,'imgtienda/zelda.jpg','Aventura',0,NULL),
(8,'The outlast trials',34000,'imgtienda/the oullasttrials.jpg','Terror',1,29000),
(9,'Undertale',8000,'imgtienda/undertae.webp','RPG',0,NULL),
(10,'NFS: shift',25000,'imgtienda/nfs shift.jpg','Carreras',0,NULL),
(11,'Bordelands 2',6500,'imgtienda/bordelands 2.jpg','Acción',0,NULL),
(12,'Warcraft 3: Frozen throne',15000,'imgtienda/warcraft 3.webp','Estrategia',0,NULL),
(13,'Gran turismo 5',20000,'imgtienda/gran turismo 5.jpg','Carreras',0,NULL),
(14,'Dead by daylight',10000,'imgtienda/dbd.jpg','Terror',1,7500),
(15,'Transformers: the game',15500,'imgtienda/transformersgame.jpg','Acción',0,NULL),
(16,'Gran turismo 4',17000,'imgtienda/granturismo4.jpg','Carreras',0,NULL),
(17,'Detroit',15000,'imgtienda/detroit.jpg','Aventura',0,NULL),
(18,'Red dead redemption 2',20000,'imgtienda/rdr2.webp','Aventura',0,NULL),
(19,'Papers please',8000,'imgtienda/papersplease.webp','Estrategia',0,NULL),
(20,'Mortal kombat 1',67000,'imgtienda/incompleto1.jpg','Lucha',1,59000),
(21,'Resident evil requiem',40000,'imgtienda/rd9.jpg','Terror',0,NULL),
(22,'Pink extinct reprieve 2',22000,'imgtienda/pink extinct reprieve 2.jpg','Aventura',0,NULL),
(23,'Webfishing',3000,'imgtienda/webfishing.jpg','Simulación',0,NULL),
(24,'Automobilista 2',9000,'imgtienda/at2.jpg','Simulación',0,NULL),
(25,'Left 4 dead 2',5500,'imgtienda/left 4 dead 2.jpg','Acción',1,4500),
(26,'Cyberpunk',25500,'imgtienda/cyberpunk.webp','RPG',0,NULL),
(27,'GTA VI',100000,'imgtienda/gta6.webp','Aventura',0,NULL),
(28,'Blue alive condemnation 2',21000,'imgtienda/blue alive condemnation 2.png','Acción',0,NULL);
