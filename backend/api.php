<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Uso local de desarrollo; restringir al publicar.
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
function respond($data, $status = 200) { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

try {
    if ($action === 'health') {
        $pdo->query('SELECT 1');
        respond(['ok' => true, 'message' => 'API conectada a MySQL']);
    }
    if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $nombre = trim($input['nombre'] ?? '');
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 4) {
            respond(['ok' => false, 'message' => 'Completa los datos y usa una contraseña de al menos 4 caracteres.'], 422);
        }
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) respond(['ok' => false, 'message' => 'Este correo ya está registrado.'], 409);
        $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
        $stmt->execute([$nombre, $email, password_hash($password, PASSWORD_DEFAULT), 'Cliente']);
        respond(['ok' => true, 'message' => 'Cuenta creada correctamente.']);
    }
    if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        // Cuenta de administrador local: admin@tienda.com / 123
        if ($email === 'admin@tienda.com' && $password === '123') {
            respond(['ok' => true, 'user' => ['nombre' => 'Cristian Orlando', 'email' => $email, 'rol' => 'Administrador']]);
        }
        $stmt = $pdo->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password'])) respond(['ok' => false, 'message' => 'Correo o contraseña incorrectos.'], 401);
        unset($user['password']);
        respond(['ok' => true, 'user' => $user]);
    }
    if ($action === 'products' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $rows = $pdo->query('SELECT id, nombre, precio, imagen, categoria, en_oferta AS enOferta, precio_oferta AS precioOferta FROM productos ORDER BY id')->fetchAll();
        respond(['ok' => true, 'products' => $rows]);
    }
    respond(['ok' => false, 'message' => 'Acción no válida.'], 404);
} catch (PDOException $e) {
    respond(['ok' => false, 'message' => 'Error de base de datos. Revisa que hayas importado database.sql.'], 500);
}
