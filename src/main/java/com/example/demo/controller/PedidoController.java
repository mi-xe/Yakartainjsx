package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import com.example.demo.service.SessionAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {
    private static final Logger log = LoggerFactory.getLogger(PedidoController.class);
    private final PedidoRepository pedidos;
    private final UsuarioRepository usuarios;
    private final ProductoRepository productos;
    private final CarritoItemRepository carrito;
    private final DireccionRepository direcciones;
    private final SessionAuth auth;

    public PedidoController(PedidoRepository pedidos, UsuarioRepository usuarios, ProductoRepository productos,
                            CarritoItemRepository carrito, DireccionRepository direcciones, SessionAuth auth) {
        this.pedidos = pedidos; this.usuarios = usuarios; this.productos = productos;
        this.carrito = carrito; this.direcciones = direcciones; this.auth = auth;
    }

    public record LineaOut(Long productoId, String nombre, Integer cantidad, BigDecimal precio) {}
    public record DireccionOut(String nombre, String calle, String comuna, String telefono) {}
    public record PedidoOut(Long id, Long usuarioId, String usuarioEmail, LocalDate fecha, BigDecimal total,
                            String estado, List<LineaOut> productos, DireccionOut direccion) {}

    private BigDecimal effectivePrice(Producto product) {
        if (product == null || product.getPrecio() == null || product.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            return null;
        }
        return product.isEnOferta() && product.getPrecioOferta() != null
                && product.getPrecioOferta().compareTo(BigDecimal.ZERO) > 0
                && product.getPrecioOferta().compareTo(product.getPrecio()) < 0
                ? product.getPrecioOferta() : product.getPrecio();
    }

    private PedidoOut out(Pedido order) {
        List<LineaOut> lines = order.getProductos().stream()
                .map(d -> new LineaOut(d.getProducto() == null ? null : d.getProducto().getId(),
                        d.getNombreProducto(), d.getCantidad(), d.getPrecioUnitario())).toList();
        DireccionOut address = new DireccionOut(order.getDireccionNombre(), order.getDireccionCalle(),
                order.getDireccionComuna(), order.getDireccionTelefono());
        Usuario owner = order.getUsuario();
        Long ownerId = owner == null ? null : owner.getId();
        String ownerEmail = owner == null ? order.getUsuarioEmail() : owner.getEmail();
        return new PedidoOut(order.getId(), ownerId, ownerEmail,
                order.getFecha(), order.getTotal(), order.getEstado(), lines, address);
    }

    @GetMapping @Transactional(readOnly = true)
    public ResponseEntity<?> all(HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Inicia sesión para consultar tus compras."));
        List<Pedido> rows = "Administrador".equalsIgnoreCase(user.getRol())
                ? pedidos.findAll() : pedidos.findByUsuarioIdOrderByFechaDesc(user.getId());
        return ResponseEntity.ok(rows.stream().map(this::out).toList());
    }

    @GetMapping("/{id}") @Transactional(readOnly = true)
    public ResponseEntity<?> one(@PathVariable Long id, HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Inicia sesión para consultar el pedido."));
        Pedido order = pedidos.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();
        if (!"Administrador".equalsIgnoreCase(user.getRol())
                && (order.getUsuario() == null || !order.getUsuario().getId().equals(user.getId())))
            return ResponseEntity.status(403).body(Map.of("message", "No tienes permiso para ver este pedido."));
        return ResponseEntity.ok(out(order));
    }

    public record StockOut(Long productoId, Integer stock) {}

    // El servidor calcula el total y descuenta el stock dentro de una única transacción.
    // Los productos se bloquean en orden por ID para evitar sobreventa y reducir deadlocks.
    @PostMapping @Transactional
    public ResponseEntity<?> create(HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Inicia sesión para confirmar tu compra."));

        // Las cuentas antiguas pueden tener saldo NULL si se crearon antes de la normalización
        // del esquema. Una cuenta Google nueva comienza con saldo cero.
        BigDecimal currentBalance = user.getSaldo() == null ? BigDecimal.ZERO : user.getSaldo();
        user.setSaldo(currentBalance);

        Direccion address = direcciones.findByUsuarioId(user.getId()).orElse(null);
        if (address == null) return ResponseEntity.badRequest().body(Map.of("message", "Antes de pagar debes guardar tus datos de despacho."));

        String owner = "USER:" + user.getId();
        List<CarritoItem> cart = new ArrayList<>(carrito.findByOwnerKey(owner));
        if (cart.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Tu carrito está vacío."));

        // Un producto pudo eliminarse después de que el artículo quedó guardado en un carrito antiguo.
        if (cart.stream().anyMatch(item -> item.getProducto() == null || item.getProducto().getId() == null)) {
            return ResponseEntity.status(409).body(Map.of("message", "Tu carrito contiene un juego que ya no está disponible. Quítalo y vuelve a intentar."));
        }
        cart.sort(Comparator.comparing(item -> item.getProducto().getId()));

        Map<Long, Producto> lockedProducts = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (CarritoItem item : cart) {
            Long productId = item.getProducto().getId();
            Producto product = productos.findByIdForUpdate(productId).orElse(null);
            if (product == null) {
                return ResponseEntity.status(409).body(Map.of("message", "Uno de los productos ya no está disponible."));
            }
            int quantity = item.getCantidad() == null ? 0 : item.getCantidad();
            int available = product.getStock() == null ? 0 : product.getStock();
            if (quantity < 1 || available < quantity) {
                return ResponseEntity.status(409).body(Map.of(
                        "message", "Stock insuficiente para " + product.getNombre() + ". Stock disponible: " + available,
                        "productoId", product.getId(), "stockDisponible", available));
            }
            BigDecimal unitPrice = effectivePrice(product);
            if (unitPrice == null) {
                return ResponseEntity.status(409).body(Map.of("message", "El precio de " + product.getNombre() + " no es válido. Contacta con la tienda."));
            }
            lockedProducts.put(productId, product);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
        }

        boolean customer = "Cliente".equalsIgnoreCase(user.getRol());
        if (customer && currentBalance.compareTo(total) < 0) {
            return ResponseEntity.status(402).body(Map.of(
                    "message", "Saldo insuficiente. Tu saldo actual es $ " + currentBalance.toPlainString() + " CLP.",
                    "saldoActual", currentBalance, "totalCompra", total));
        }

        Pedido order = new Pedido();
        order.setUsuario(user); order.setUsuarioNombre(user.getNombre()); order.setUsuarioEmail(user.getEmail());
        order.setFecha(LocalDate.now()); order.setEstado("Entregado"); order.setTotal(total);
        order.setDireccionNombre(address.getNombre()); order.setDireccionCalle(address.getCalle());
        order.setDireccionComuna(address.getComuna()); order.setDireccionTelefono(address.getTelefono());

        List<StockOut> stockUpdated = new ArrayList<>();
        for (CarritoItem item : cart) {
            Producto product = lockedProducts.get(item.getProducto().getId());
            int quantity = item.getCantidad();
            BigDecimal unitPrice = effectivePrice(product);
            PedidoDetalle detail = new PedidoDetalle();
            detail.setPedido(order); detail.setProducto(product); detail.setNombreProducto(product.getNombre());
            detail.setCantidad(quantity); detail.setPrecioUnitario(unitPrice);
            order.getProductos().add(detail);

            int remaining = product.getStock() - quantity;
            product.setStock(remaining);
            stockUpdated.add(new StockOut(product.getId(), remaining));
        }

        if (customer) {
            user.setSaldo(currentBalance.subtract(total));
            usuarios.saveAndFlush(user);
        }

        // Mantiene inventario, saldo, pedido y borrado del carrito en la misma transacción.
        productos.saveAll(lockedProducts.values());
        productos.flush();
        Pedido saved = pedidos.saveAndFlush(order);
        carrito.deleteAll(cart);
        carrito.flush();

        log.info("Pedido {} confirmado para usuario {}. Líneas: {}, total: {} CLP.",
                saved.getId(), user.getId(), cart.size(), total);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", out(saved));
        result.put("saldo", user.getSaldo() == null ? BigDecimal.ZERO : user.getSaldo());
        result.put("stockActualizado", stockUpdated);
        return ResponseEntity.status(201).body(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        if (!pedidos.existsById(id)) return ResponseEntity.notFound().build();
        pedidos.deleteById(id); return ResponseEntity.noContent().build();
    }
}
