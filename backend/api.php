<?php
declare(strict_types=1);

// API REST sencilla para React + PHP + MySQL. Las sesiones PHP identifican al usuario
// y permiten mantener carritos de invitados sin usar localStorage.
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
}
header('Vary: Origin');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
session_start();
require __DIR__ . '/config.php';

function respond(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function currentUser(PDO $pdo): ?array {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) return null;
    $statement = $pdo->prepare('SELECT id, nombre, email, rol, saldo FROM usuarios WHERE id = ? LIMIT 1');
    $statement->execute([(int)$userId]);
    $user = $statement->fetch();
    if (!$user) {
        unset($_SESSION['user_id']);
        return null;
    }
    $user['id'] = (int)$user['id'];
    $user['saldo'] = (int)$user['saldo'];
    return $user;
}

function requireLogin(PDO $pdo): array {
    $user = currentUser($pdo);
    if (!$user) respond(['ok' => false, 'message' => 'Debes iniciar sesión para realizar esta acción.'], 401);
    return $user;
}

function requireAdmin(PDO $pdo): array {
    $user = requireLogin($pdo);
    if ($user['rol'] !== 'Administrador') {
        respond(['ok' => false, 'message' => 'No tienes permisos para realizar esta acción.'], 403);
    }
    return $user;
}

function productRow(array $row): array {
    return [
        'id' => (int)$row['id'],
        'nombre' => $row['nombre'],
        'precio' => (int)$row['precio'],
        'imagen' => $row['imagen'],
        'categoria' => $row['categoria'],
        'enOferta' => (bool)$row['en_oferta'],
        'precioOferta' => $row['precio_oferta'] === null ? null : (int)$row['precio_oferta'],
        'stock' => (int)$row['stock'],
    ];
}

function getCartId(PDO $pdo): int {
    $user = currentUser($pdo);
    if ($user) {
        $find = $pdo->prepare('SELECT id FROM carritos WHERE usuario_id = ? LIMIT 1');
        $find->execute([$user['id']]);
        $cartId = $find->fetchColumn();

        // Si inició sesión con un carrito de invitado, lo vinculamos o fusionamos.
        $guestSession = $_SESSION['guest_cart_session'] ?? null;
        if ($guestSession) {
            $guest = $pdo->prepare('SELECT id FROM carritos WHERE session_id = ? AND usuario_id IS NULL LIMIT 1');
            $guest->execute([$guestSession]);
            $guestCartId = $guest->fetchColumn();
            if ($guestCartId) {
                if (!$cartId) {
                    $attach = $pdo->prepare('UPDATE carritos SET usuario_id = ?, session_id = NULL WHERE id = ?');
                    $attach->execute([$user['id'], $guestCartId]);
                    unset($_SESSION['guest_cart_session']);
                    return (int)$guestCartId;
                }
                $guestItems = $pdo->prepare('SELECT producto_id, cantidad FROM carrito_detalles WHERE carrito_id = ?');
                $guestItems->execute([$guestCartId]);
                $merge = $pdo->prepare('INSERT INTO carrito_detalles (carrito_id, producto_id, cantidad) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)');
                foreach ($guestItems->fetchAll() as $guestItem) {
                    $merge->execute([(int)$cartId, (int)$guestItem['producto_id'], (int)$guestItem['cantidad']]);
                }
                $deleteGuest = $pdo->prepare('DELETE FROM carritos WHERE id = ?');
                $deleteGuest->execute([(int)$guestCartId]);
            }
            unset($_SESSION['guest_cart_session']);
        }
        if ($cartId) return (int)$cartId;
        $insert = $pdo->prepare('INSERT INTO carritos (usuario_id) VALUES (?)');
        $insert->execute([$user['id']]);
        return (int)$pdo->lastInsertId();
    }

    $sessionId = session_id();
    $find = $pdo->prepare('SELECT id FROM carritos WHERE session_id = ? LIMIT 1');
    $find->execute([$sessionId]);
    $cartId = $find->fetchColumn();
    if ($cartId) return (int)$cartId;
    $insert = $pdo->prepare('INSERT INTO carritos (session_id) VALUES (?)');
    $insert->execute([$sessionId]);
    return (int)$pdo->lastInsertId();
}

function cartData(PDO $pdo): array {
    $cartId = getCartId($pdo);
    $statement = $pdo->prepare(
        'SELECT p.id, p.nombre, p.precio, p.imagen, p.categoria, p.en_oferta,
                p.precio_oferta, p.stock, cd.cantidad
         FROM carrito_detalles cd
         INNER JOIN productos p ON p.id = cd.producto_id
         WHERE cd.carrito_id = ? ORDER BY cd.id'
    );
    $statement->execute([$cartId]);
    $items = [];
    $total = 0;
    foreach ($statement->fetchAll() as $row) {
        $product = productRow($row);
        $price = $product['enOferta'] && $product['precioOferta'] !== null
            && $product['precioOferta'] > 0 && $product['precioOferta'] < $product['precio']
            ? $product['precioOferta'] : $product['precio'];
        $quantity = (int)$row['cantidad'];
        $items[] = [
            ...$product,
            'precioOriginal' => $product['precio'],
            'precio' => $price,
            'cantidad' => $quantity,
            'subtotal' => $price * $quantity,
        ];
        $total += $price * $quantity;
    }
    return ['items' => $items, 'total' => $total];
}

function addressData(PDO $pdo): ?array {
    $user = currentUser($pdo);
    if ($user) {
        $statement = $pdo->prepare('SELECT nombre, calle, comuna, telefono FROM direcciones WHERE usuario_id = ? LIMIT 1');
        $statement->execute([$user['id']]);
    } else {
        $statement = $pdo->prepare('SELECT nombre, calle, comuna, telefono FROM direcciones WHERE session_id = ? LIMIT 1');
        $statement->execute([session_id()]);
    }
    return $statement->fetch() ?: null;
}

function orderRows(PDO $pdo, ?int $userId = null): array {
    $sql = 'SELECT p.id, p.usuario_id, p.usuario_nombre, p.usuario_email, p.fecha, p.total, p.estado
            FROM pedidos p';
    $params = [];
    if ($userId !== null) {
        $sql .= ' WHERE p.usuario_id = ?';
        $params[] = $userId;
    }
    $sql .= ' ORDER BY p.fecha DESC, p.id DESC';
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    $orders = $statement->fetchAll();
    $details = $pdo->prepare('SELECT nombre, precio, cantidad FROM pedido_detalles WHERE pedido_id = ? ORDER BY id');
    foreach ($orders as &$order) {
        $details->execute([(int)$order['id']]);
        $order['id'] = (int)$order['id'];
        $order['usuarioId'] = $order['usuario_id'] === null ? null : (int)$order['usuario_id'];
        $order['usuarioEmail'] = $order['usuario_email'];
        $order['fecha'] = date('Y-m-d H:i:s', strtotime($order['fecha']));
        $order['total'] = (int)$order['total'];
        $order['productos'] = array_map(static fn($item) => [
            'nombre' => $item['nombre'],
            'precio' => (int)$item['precio'],
            'cantidad' => (int)$item['cantidad'],
        ], $details->fetchAll());
        unset($order['usuario_id'], $order['usuario_email']);
    }
    unset($order);
    return $orders;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = body();

try {
    // Comprobación de conexión.
    if ($action === 'health' && $method === 'GET') {
        $pdo->query('SELECT 1');
        respond(['ok' => true, 'message' => 'API Yakarta conectada a MySQL.']);
    }

    // Autenticación y registro.
    if ($action === 'register' && $method === 'POST') {
        $name = trim((string)($input['nombre'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 4) {
            respond(['ok' => false, 'message' => 'Completa los datos y usa una contraseña de al menos 4 caracteres.'], 422);
        }
        $statement = $pdo->prepare('INSERT INTO usuarios (nombre, email, password, rol, saldo) VALUES (?, ?, ?, \'Cliente\', 0)');
        try {
            $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') respond(['ok' => false, 'message' => 'Este correo ya está registrado.'], 409);
            throw $exception;
        }
        respond(['ok' => true, 'message' => 'Cuenta creada correctamente.']);
    }

    if ($action === 'login' && $method === 'POST') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        $statement = $pdo->prepare('SELECT id, password FROM usuarios WHERE email = ? LIMIT 1');
        $statement->execute([$email]);
        $row = $statement->fetch();
        if (!$row || !password_verify($password, $row['password'])) {
            respond(['ok' => false, 'message' => 'Correo o contraseña incorrectos.'], 401);
        }
        $oldSessionId = session_id();
        session_regenerate_id(true);
        $_SESSION['guest_cart_session'] = $oldSessionId;
        $_SESSION['user_id'] = (int)$row['id'];
        $user = currentUser($pdo);

        // Si existe una dirección de invitado, se vincula a la cuenta si aún no tiene una.
        $hasAddress = $pdo->prepare('SELECT id FROM direcciones WHERE usuario_id = ? LIMIT 1');
        $hasAddress->execute([$user['id']]);
        if (!$hasAddress->fetchColumn()) {
            $moveAddress = $pdo->prepare('UPDATE direcciones SET usuario_id = ?, session_id = NULL WHERE session_id = ?');
            $moveAddress->execute([$user['id'], $oldSessionId]);
        }
        // Vincular el carrito ahora también fusiona el carrito invitado en caso de existir uno.
        getCartId($pdo);
        respond(['ok' => true, 'user' => $user]);
    }

    if ($action === 'me' && $method === 'GET') {
        respond(['ok' => true, 'user' => currentUser($pdo)]);
    }

    if ($action === 'logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        respond(['ok' => true, 'message' => 'Sesión cerrada.']);
    }

    // Catálogo público y mantenimiento de productos (solo administrador).
    if ($action === 'products' && $method === 'GET') {
        $rows = $pdo->query('SELECT id, nombre, precio, imagen, categoria, en_oferta, precio_oferta, stock FROM productos ORDER BY id')->fetchAll();
        respond(['ok' => true, 'products' => array_map('productRow', $rows)]);
    }

    if ($action === 'products' && $method === 'POST') {
        requireAdmin($pdo);
        $name = trim((string)($input['nombre'] ?? ''));
        $price = (int)($input['precio'] ?? 0);
        $image = trim((string)($input['imagen'] ?? ''));
        $category = trim((string)($input['categoria'] ?? 'Otros'));
        $sale = !empty($input['enOferta']);
        $salePrice = isset($input['precioOferta']) && $input['precioOferta'] !== '' ? (int)$input['precioOferta'] : null;
        $stock = max(0, (int)($input['stock'] ?? 0));
        if ($name === '' || $price <= 0 || $image === '' || $category === '') respond(['ok' => false, 'message' => 'Completa nombre, precio, imagen y categoría del producto.'], 422);
        if ($sale && ($salePrice === null || $salePrice <= 0 || $salePrice >= $price)) respond(['ok' => false, 'message' => 'El precio de oferta debe ser positivo y menor al precio normal.'], 422);
        $statement = $pdo->prepare('INSERT INTO productos (nombre, precio, imagen, categoria, en_oferta, precio_oferta, stock) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $statement->execute([$name, $price, $image, $category, $sale ? 1 : 0, $sale ? $salePrice : null, $stock]);
        $id = (int)$pdo->lastInsertId();
        $get = $pdo->prepare('SELECT id, nombre, precio, imagen, categoria, en_oferta, precio_oferta, stock FROM productos WHERE id = ?');
        $get->execute([$id]);
        respond(['ok' => true, 'product' => productRow($get->fetch())], 201);
    }

    if ($action === 'products' && $method === 'PUT') {
        requireAdmin($pdo);
        $id = (int)($_GET['id'] ?? 0);
        $name = trim((string)($input['nombre'] ?? ''));
        $price = (int)($input['precio'] ?? 0);
        $image = trim((string)($input['imagen'] ?? ''));
        $category = trim((string)($input['categoria'] ?? 'Otros'));
        $sale = !empty($input['enOferta']);
        $salePrice = isset($input['precioOferta']) && $input['precioOferta'] !== '' ? (int)$input['precioOferta'] : null;
        $stock = max(0, (int)($input['stock'] ?? 0));
        if ($id < 1 || $name === '' || $price <= 0 || $image === '' || $category === '') respond(['ok' => false, 'message' => 'Datos de producto no válidos.'], 422);
        if ($sale && ($salePrice === null || $salePrice <= 0 || $salePrice >= $price)) respond(['ok' => false, 'message' => 'El precio de oferta debe ser positivo y menor al precio normal.'], 422);
        $statement = $pdo->prepare('UPDATE productos SET nombre=?, precio=?, imagen=?, categoria=?, en_oferta=?, precio_oferta=?, stock=? WHERE id=?');
        $statement->execute([$name, $price, $image, $category, $sale ? 1 : 0, $sale ? $salePrice : null, $stock, $id]);
        if (!$statement->rowCount() && !$pdo->query("SELECT id FROM productos WHERE id = {$id}")->fetchColumn()) respond(['ok' => false, 'message' => 'Producto no encontrado.'], 404);
        $get = $pdo->prepare('SELECT id, nombre, precio, imagen, categoria, en_oferta, precio_oferta, stock FROM productos WHERE id = ?');
        $get->execute([$id]);
        respond(['ok' => true, 'product' => productRow($get->fetch())]);
    }

    if ($action === 'products' && $method === 'DELETE') {
        requireAdmin($pdo);
        $id = (int)($_GET['id'] ?? 0);
        $statement = $pdo->prepare('DELETE FROM productos WHERE id = ?');
        $statement->execute([$id]);
        if (!$statement->rowCount()) respond(['ok' => false, 'message' => 'Producto no encontrado.'], 404);
        respond(['ok' => true]);
    }

    // Categorías.
    if ($action === 'categories' && $method === 'GET') {
        $rows = $pdo->query('SELECT id, nombre FROM categorias ORDER BY nombre')->fetchAll();
        respond(['ok' => true, 'categories' => $rows]);
    }
    if ($action === 'categories' && $method === 'POST') {
        requireAdmin($pdo);
        $name = trim((string)($input['nombre'] ?? ''));
        if ($name === '') respond(['ok' => false, 'message' => 'El nombre de categoría es obligatorio.'], 422);
        try {
            $statement = $pdo->prepare('INSERT INTO categorias (nombre) VALUES (?)');
            $statement->execute([$name]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') respond(['ok' => false, 'message' => 'Esa categoría ya existe.'], 409);
            throw $exception;
        }
        respond(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
    }
    if ($action === 'categories' && $method === 'PUT') {
        requireAdmin($pdo);
        $id = (int)($_GET['id'] ?? 0);
        $name = trim((string)($input['nombre'] ?? ''));
        if ($id < 1 || $name === '') respond(['ok' => false, 'message' => 'Datos de categoría no válidos.'], 422);
        $pdo->beginTransaction();
        $find = $pdo->prepare('SELECT nombre FROM categorias WHERE id = ?');
        $find->execute([$id]);
        $oldName = $find->fetchColumn();
        if (!$oldName) { $pdo->rollBack(); respond(['ok' => false, 'message' => 'Categoría no encontrada.'], 404); }
        $update = $pdo->prepare('UPDATE categorias SET nombre = ? WHERE id = ?');
        $update->execute([$name, $id]);
        $products = $pdo->prepare('UPDATE productos SET categoria = ? WHERE categoria = ?');
        $products->execute([$name, $oldName]);
        $pdo->commit();
        respond(['ok' => true]);
    }
    if ($action === 'categories' && $method === 'DELETE') {
        requireAdmin($pdo);
        $id = (int)($_GET['id'] ?? 0);
        $pdo->beginTransaction();
        $find = $pdo->prepare('SELECT nombre FROM categorias WHERE id = ?');
        $find->execute([$id]);
        $name = $find->fetchColumn();
        if (!$name) { $pdo->rollBack(); respond(['ok' => false, 'message' => 'Categoría no encontrada.'], 404); }
        $pdo->prepare("UPDATE productos SET categoria = 'Otros' WHERE categoria = ?")->execute([$name]);
        $pdo->prepare('DELETE FROM categorias WHERE id = ?')->execute([$id]);
        $pdo->commit();
        respond(['ok' => true]);
    }

    // Usuarios: lectura y administración restringidas al rol Administrador.
    if ($action === 'users' && $method === 'GET') {
        requireAdmin($pdo);
        $rows = $pdo->query('SELECT id, nombre, email, rol, saldo FROM usuarios ORDER BY id')->fetchAll();
        foreach ($rows as &$row) { $row['id'] = (int)$row['id']; $row['saldo'] = (int)$row['saldo']; }
        unset($row);
        respond(['ok' => true, 'users' => $rows]);
    }
    if ($action === 'users' && $method === 'POST') {
        requireAdmin($pdo);
        $name = trim((string)($input['nombre'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        $role = (string)($input['rol'] ?? 'Cliente');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 4 || !in_array($role, ['Cliente', 'Administrador'], true)) {
            respond(['ok' => false, 'message' => 'Revisa los datos. La contraseña debe tener al menos 4 caracteres.'], 422);
        }
        try {
            $statement = $pdo->prepare('INSERT INTO usuarios (nombre, email, password, rol, saldo) VALUES (?, ?, ?, ?, 0)');
            $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') respond(['ok' => false, 'message' => 'Ese correo ya está registrado.'], 409);
            throw $exception;
        }
        respond(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
    }
    if ($action === 'users' && $method === 'PUT') {
        $admin = requireAdmin($pdo);
        $id = (int)($_GET['id'] ?? 0);
        $name = trim((string)($input['nombre'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        $role = (string)($input['rol'] ?? 'Cliente');
        if ($id < 1 || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, ['Cliente', 'Administrador'], true)) respond(['ok' => false, 'message' => 'Datos de usuario no válidos.'], 422);
        $statement = $password !== ''
            ? $pdo->prepare('UPDATE usuarios SET nombre=?, email=?, rol=?, password=? WHERE id=?')
            : $pdo->prepare('UPDATE usuarios SET nombre=?, email=?, rol=? WHERE id=?');
        $values = $password !== ''
            ? [$name, $email, $role, password_hash($password, PASSWORD_DEFAULT), $id]
            : [$name, $email, $role, $id];
        try { $statement->execute($values); }
        catch (PDOException $exception) {
            if ($exception->getCode() === '23000') respond(['ok' => false, 'message' => 'Ese correo ya está siendo utilizado.'], 409);
            throw $exception;
        }
        if ($statement->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT id FROM usuarios WHERE id=?'); $exists->execute([$id]);
            if (!$exists->fetchColumn()) respond(['ok' => false, 'message' => 'Usuario no encontrado.'], 404);
        }
        if ($id === $admin['id']) {
            $_SESSION['user_id'] = $id;
        }
        respond(['ok' => true]);
    }
    if ($action === 'users' && $method === 'DELETE') {
        $admin = requireAdmin($pdo);
        $id = (int)($_GET['id'] ?? 0);
        if ($id === $admin['id']) respond(['ok' => false, 'message' => 'No puedes eliminar tu propia cuenta mientras está activa.'], 422);
        $statement = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
        $statement->execute([$id]);
        if (!$statement->rowCount()) respond(['ok' => false, 'message' => 'Usuario no encontrado.'], 404);
        respond(['ok' => true]);
    }

    // Carrito persistido en MySQL, también disponible para invitados mediante sesión PHP.
    if ($action === 'cart' && $method === 'GET') {
        respond(['ok' => true, ...cartData($pdo)]);
    }
    if ($action === 'cart-add' && $method === 'POST') {
        $productId = (int)($input['productoId'] ?? 0);
        $quantity = max(1, (int)($input['cantidad'] ?? 1));
        $product = $pdo->prepare('SELECT id, stock FROM productos WHERE id = ?');
        $product->execute([$productId]);
        $row = $product->fetch();
        if (!$row) respond(['ok' => false, 'message' => 'El producto ya no está disponible.'], 404);
        $cartId = getCartId($pdo);
        $existing = $pdo->prepare('SELECT cantidad FROM carrito_detalles WHERE carrito_id=? AND producto_id=?');
        $existing->execute([$cartId, $productId]);
        $currentQuantity = (int)($existing->fetchColumn() ?: 0);
        if ($currentQuantity + $quantity > (int)$row['stock']) respond(['ok' => false, 'message' => 'No hay suficiente stock para esa cantidad.'], 409);
        if ($currentQuantity > 0) {
            $update = $pdo->prepare('UPDATE carrito_detalles SET cantidad = cantidad + ? WHERE carrito_id=? AND producto_id=?');
            $update->execute([$quantity, $cartId, $productId]);
        } else {
            $insert = $pdo->prepare('INSERT INTO carrito_detalles (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)');
            $insert->execute([$cartId, $productId, $quantity]);
        }
        respond(['ok' => true, ...cartData($pdo)]);
    }
    if ($action === 'cart-remove' && $method === 'POST') {
        $cartId = getCartId($pdo);
        $productId = (int)($input['productoId'] ?? 0);
        $statement = $pdo->prepare('DELETE FROM carrito_detalles WHERE carrito_id=? AND producto_id=?');
        $statement->execute([$cartId, $productId]);
        respond(['ok' => true, ...cartData($pdo)]);
    }
    if ($action === 'cart-clear' && $method === 'POST') {
        $cartId = getCartId($pdo);
        $pdo->prepare('DELETE FROM carrito_detalles WHERE carrito_id=?')->execute([$cartId]);
        respond(['ok' => true, ...cartData($pdo)]);
    }

    // Dirección de despacho del usuario o de la sesión invitada.
    if ($action === 'address' && $method === 'GET') {
        respond(['ok' => true, 'address' => addressData($pdo)]);
    }
    if ($action === 'address' && $method === 'POST') {
        $name = trim((string)($input['nombre'] ?? ''));
        $street = trim((string)($input['calle'] ?? ''));
        $city = trim((string)($input['comuna'] ?? ''));
        $phone = trim((string)($input['telefono'] ?? ''));
        if ($name === '' || $street === '' || $city === '' || $phone === '') respond(['ok' => false, 'message' => 'Completa todos los datos de despacho.'], 422);
        $user = currentUser($pdo);
        if ($user) {
            $statement = $pdo->prepare('INSERT INTO direcciones (usuario_id, session_id, nombre, calle, comuna, telefono) VALUES (?, NULL, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), calle=VALUES(calle), comuna=VALUES(comuna), telefono=VALUES(telefono)');
            $statement->execute([$user['id'], $name, $street, $city, $phone]);
        } else {
            $statement = $pdo->prepare('INSERT INTO direcciones (usuario_id, session_id, nombre, calle, comuna, telefono) VALUES (NULL, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), calle=VALUES(calle), comuna=VALUES(comuna), telefono=VALUES(telefono)');
            $statement->execute([session_id(), $name, $street, $city, $phone]);
        }
        respond(['ok' => true, 'address' => addressData($pdo)]);
    }

    // Saldo: se mantiene en la fila del usuario, no en el navegador.
    if ($action === 'balance' && $method === 'GET') {
        $user = requireLogin($pdo);
        respond(['ok' => true, 'saldo' => (int)$user['saldo']]);
    }
    if ($action === 'funds-add' && $method === 'POST') {
        $user = requireLogin($pdo);
        if ($user['rol'] !== 'Cliente') respond(['ok' => false, 'message' => 'Solo las cuentas Cliente pueden agregar fondos.'], 403);
        $amount = (int)($input['monto'] ?? 0);
        if (!in_array($amount, [1000, 2000, 5000, 10000], true)) respond(['ok' => false, 'message' => 'El monto seleccionado no está permitido.'], 422);
        $pdo->prepare('UPDATE usuarios SET saldo = saldo + ? WHERE id = ?')->execute([$amount, $user['id']]);
        $pdo->prepare('INSERT INTO movimientos_saldo (usuario_id, tipo, monto, descripcion) VALUES (?, \'abono\', ?, ?)')->execute([$user['id'], $amount, 'Fondos agregados desde Yakarta']);
        $fresh = currentUser($pdo);
        respond(['ok' => true, 'saldo' => (int)$fresh['saldo']]);
    }

    // Mensajes del formulario de contacto.
    if ($action === 'contact' && $method === 'POST') {
        $name = trim((string)($input['nombre'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $phone = trim((string)($input['telefono'] ?? ''));
        $comment = trim((string)($input['comentario'] ?? ''));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '') respond(['ok' => false, 'message' => 'Completa nombre, correo y teléfono válidos.'], 422);
        $statement = $pdo->prepare('INSERT INTO mensajes_contacto (nombre, email, telefono, comentario) VALUES (?, ?, ?, ?)');
        $statement->execute([$name, $email, $phone, $comment]);
        respond(['ok' => true, 'message' => 'Mensaje enviado correctamente.'], 201);
    }

    // Pedidos e historial. El servidor calcula precios, verifica stock y descuenta saldo
    // dentro de una única transacción para evitar manipulaciones desde el navegador.
    if ($action === 'orders' && $method === 'GET') {
        $user = requireLogin($pdo);
        $orders = $user['rol'] === 'Administrador' ? orderRows($pdo) : orderRows($pdo, $user['id']);
        respond(['ok' => true, 'orders' => $orders]);
    }

    if ($action === 'checkout' && $method === 'POST') {
        $user = requireLogin($pdo);
        $address = addressData($pdo);
        if (!$address) respond(['ok' => false, 'message' => 'Antes de confirmar la compra debes registrar una dirección de despacho.'], 422);
        $cartId = getCartId($pdo);
        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            'SELECT p.id, p.nombre, p.precio, p.en_oferta, p.precio_oferta, p.stock, cd.cantidad
             FROM carrito_detalles cd INNER JOIN productos p ON p.id=cd.producto_id
             WHERE cd.carrito_id=? FOR UPDATE'
        );
        $statement->execute([$cartId]);
        $items = $statement->fetchAll();
        if (!$items) { $pdo->rollBack(); respond(['ok' => false, 'message' => 'Tu carrito está vacío.'], 422); }
        $total = 0;
        $preparedItems = [];
        foreach ($items as $item) {
            $quantity = (int)$item['cantidad'];
            $stock = (int)$item['stock'];
            if ($quantity > $stock) {
                $pdo->rollBack();
                respond(['ok' => false, 'message' => "Stock insuficiente para {$item['nombre']}. Disponible: {$stock}.", 'code' => 'STOCK_INSUFFICIENT'], 409);
            }
            $regular = (int)$item['precio'];
            $offer = $item['precio_oferta'] === null ? null : (int)$item['precio_oferta'];
            $price = ((bool)$item['en_oferta'] && $offer !== null && $offer > 0 && $offer < $regular) ? $offer : $regular;
            $total += $price * $quantity;
            $preparedItems[] = ['id' => (int)$item['id'], 'nombre' => $item['nombre'], 'precio' => $price, 'cantidad' => $quantity];
        }
        $lockUser = $pdo->prepare('SELECT saldo FROM usuarios WHERE id=? FOR UPDATE');
        $lockUser->execute([$user['id']]);
        $balance = (int)$lockUser->fetchColumn();
        if ($user['rol'] === 'Cliente' && $balance < $total) {
            $pdo->rollBack();
            respond(['ok' => false, 'message' => 'Saldo insuficiente. Tu saldo actual es ' . $balance . ' y el total de la compra es ' . $total . '.', 'code' => 'INSUFFICIENT_BALANCE', 'saldo' => $balance, 'total' => $total], 422);
        }
        $insertOrder = $pdo->prepare('INSERT INTO pedidos (usuario_id, usuario_nombre, usuario_email, fecha, total, estado, direccion_nombre, direccion_calle, direccion_comuna, direccion_telefono) VALUES (?, ?, ?, NOW(), ?, \'Entregado\', ?, ?, ?, ?)');
        $insertOrder->execute([$user['id'], $user['nombre'], $user['email'], $total, $address['nombre'], $address['calle'], $address['comuna'], $address['telefono']]);
        $orderId = (int)$pdo->lastInsertId();
        $insertDetail = $pdo->prepare('INSERT INTO pedido_detalles (pedido_id, producto_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?)');
        $updateStock = $pdo->prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
        foreach ($preparedItems as $item) {
            $insertDetail->execute([$orderId, $item['id'], $item['nombre'], $item['precio'], $item['cantidad']]);
            $updateStock->execute([$item['cantidad'], $item['id']]);
        }
        if ($user['rol'] === 'Cliente') {
            $pdo->prepare('UPDATE usuarios SET saldo = saldo - ? WHERE id = ?')->execute([$total, $user['id']]);
            $pdo->prepare('INSERT INTO movimientos_saldo (usuario_id, tipo, monto, descripcion) VALUES (?, \'cargo\', ?, ?)')->execute([$user['id'], $total, 'Pago de pedido #' . $orderId]);
        }
        $pdo->prepare('DELETE FROM carrito_detalles WHERE carrito_id=?')->execute([$cartId]);
        $pdo->commit();
        respond(['ok' => true, 'order' => [
            'id' => $orderId,
            'usuarioId' => $user['id'],
            'usuarioEmail' => $user['email'],
            'fecha' => date('Y-m-d H:i:s'),
            'total' => $total,
            'estado' => 'Entregado',
            'productos' => array_map(static fn($item) => ['nombre' => $item['nombre'], 'precio' => $item['precio'], 'cantidad' => $item['cantidad']], $preparedItems),
        ]], 201);
    }

    respond(['ok' => false, 'message' => 'Acción o método no válido.'], 404);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Yakarta API error [' . $action . ']: ' . $exception->getMessage());
    respond(['ok' => false, 'message' => 'Ocurrió un error en el servidor. Revisa la configuración de la base de datos y los datos enviados.'], 500);
}
