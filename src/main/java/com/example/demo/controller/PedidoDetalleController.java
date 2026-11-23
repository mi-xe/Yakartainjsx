package com.example.demo.controller;

import com.example.demo.model.Pedido;
import com.example.demo.model.PedidoDetalle;
import com.example.demo.model.Producto;
import com.example.demo.repository.PedidoDetalleRepository;
import com.example.demo.repository.PedidoRepository;
import com.example.demo.repository.ProductoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos-detalle")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"})
@Tag(name = "Detalles de pedidos", description = "Administración de las líneas de productos de cada pedido")
public class PedidoDetalleController {
    private final PedidoDetalleRepository detalles;
    private final PedidoRepository pedidos;
    private final ProductoRepository productos;

    public PedidoDetalleController(PedidoDetalleRepository d, PedidoRepository p, ProductoRepository pr) {
        detalles = d; pedidos = p; productos = pr;
    }

    public record DetalleIn(Long pedidoId, Long productoId, String nombreProducto,
                            Integer cantidad, BigDecimal precioUnitario) {}
    public record DetalleOut(Long id, Long pedidoId, Long productoId, String nombreProducto,
                             Integer cantidad, BigDecimal precioUnitario) {}

    private DetalleOut out(PedidoDetalle d) {
        return new DetalleOut(d.getId(), d.getPedido().getId(),
            d.getProducto() == null ? null : d.getProducto().getId(),
            d.getNombreProducto(), d.getCantidad(), d.getPrecioUnitario());
    }

    private boolean invalid(DetalleIn in) {
        return in == null || in.pedidoId() == null || in.nombreProducto() == null
            || in.nombreProducto().isBlank() || in.cantidad() == null || in.cantidad() < 1
            || in.precioUnitario() == null || in.precioUnitario().compareTo(BigDecimal.ZERO) < 0;
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Listar todos los detalles")
    public List<DetalleOut> all() { return detalles.findAll().stream().map(this::out).toList(); }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    @Operation(summary = "Obtener detalle por ID")
    public ResponseEntity<DetalleOut> one(@PathVariable Long id) {
        return detalles.findById(id).map(d -> ResponseEntity.ok(out(d))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Crear detalle de pedido")
    public ResponseEntity<?> create(@RequestBody DetalleIn in) {
        if (invalid(in)) return ResponseEntity.badRequest().body("Datos de detalle inválidos");
        Pedido p = pedidos.findById(in.pedidoId()).orElse(null);
        if (p == null) return ResponseEntity.badRequest().body("Pedido no encontrado");
        PedidoDetalle d = new PedidoDetalle();
        apply(d, p, in);
        return ResponseEntity.status(201).body(out(detalles.save(d)));
    }

    @PutMapping("/{id}")
    @Transactional
    @Operation(summary = "Actualizar detalle de pedido")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DetalleIn in) {
        if (invalid(in)) return ResponseEntity.badRequest().body("Datos de detalle inválidos");
        Pedido p = pedidos.findById(in.pedidoId()).orElse(null);
        if (p == null) return ResponseEntity.badRequest().body("Pedido no encontrado");
        return detalles.findById(id).map(d -> {
            apply(d, p, in);
            return ResponseEntity.ok(out(detalles.save(d)));
        }).orElse(ResponseEntity.notFound().build());
    }

    private void apply(PedidoDetalle d, Pedido p, DetalleIn in) {
        d.setPedido(p);
        Producto product = in.productoId() == null ? null : productos.findById(in.productoId()).orElse(null);
        d.setProducto(product);
        d.setNombreProducto(in.nombreProducto());
        d.setCantidad(in.cantidad());
        d.setPrecioUnitario(in.precioUnitario());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar detalle de pedido")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!detalles.existsById(id)) return ResponseEntity.notFound().build();
        detalles.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
