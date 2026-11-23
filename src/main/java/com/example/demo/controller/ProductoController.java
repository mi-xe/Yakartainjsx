package com.example.demo.controller;

import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.repository.CarritoItemRepository;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {
    private static final Set<String> PLATAFORMAS_PERMITIDAS = Set.of(
            "PC", "PlayStation 3", "PlayStation 4", "PlayStation 5",
            "Xbox Series S/X", "Nintendo Switch", "Nintendo Switch 2"
    );

    private final ProductoRepository repo;
    private final SessionAuth auth;
    private final CarritoItemRepository carrito;

    public ProductoController(ProductoRepository repo, SessionAuth auth, CarritoItemRepository carrito) {
        this.repo = repo;
        this.auth = auth;
        this.carrito = carrito;
    }

    /** Catálogo público: devuelve los registros persistidos que utiliza el panel de administración. */
    @GetMapping
    public List<Producto> all() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> one(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Producto product, HttpSession session) {
        if (!auth.isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        }
        String validation = validate(product);
        if (validation != null) return ResponseEntity.badRequest().body(Map.of("message", validation));

        product.setId(null);
        normalize(product);
        Producto saved = repo.saveAndFlush(product);
        // La respuesta contiene la representación ya escrita en la base de datos.
        Producto persisted = repo.findById(saved.getId()).orElse(saved);
        return ResponseEntity.status(201).body(persisted);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Producto product, HttpSession session) {
        if (!auth.isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        }
        // También bloqueamos la fila al editar el inventario desde administración,
        // para que una edición manual no pise el descuento de una compra simultánea.
        if (repo.findByIdForUpdate(id).isEmpty()) return ResponseEntity.notFound().build();
        String validation = validate(product);
        if (validation != null) return ResponseEntity.badRequest().body(Map.of("message", validation));

        product.setId(id);
        normalize(product);
        Producto saved = repo.saveAndFlush(product);
        // Forzamos el flush para que un problema de columna/tipo de dato no quede
        // oculto hasta después de haber respondido al navegador.
        Producto persisted = repo.findById(saved.getId()).orElse(saved);
        return ResponseEntity.ok(persisted);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        if (!auth.isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        }
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        // Sin FK física para mantener compatibilidad con el ID INT UNSIGNED heredado.
        carrito.deleteByProducto_Id(id);
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String validate(Producto product) {
        if (product == null || product.getNombre() == null || product.getNombre().isBlank()) {
            return "El nombre del producto es obligatorio.";
        }
        if (product.getPrecio() == null || product.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            return "El precio debe ser un número mayor o igual a cero.";
        }
        if (product.getStock() == null || product.getStock() < 0) {
            return "El stock debe ser un número mayor o igual a cero.";
        }
        if (product.getCategoria() == null || product.getCategoria().isBlank()) {
            return "Selecciona una categoría para el producto.";
        }
        if (product.getDescripcion() != null && product.getDescripcion().length() > 3000) {
            return "La descripción no puede superar los 3000 caracteres.";
        }
        if (product.getImagenesPreview() != null && product.getImagenesPreview().size() > 12) {
            return "Puedes agregar un máximo de 12 imágenes de previsualización.";
        }
        if (product.getImagenesPreview() != null && product.getImagenesPreview().stream()
                .anyMatch(image -> image == null || image.isBlank() || image.length() > 1000)) {
            return "Cada imagen de previsualización debe tener una ruta o URL válida de hasta 1000 caracteres.";
        }
        if (product.getPlataformas() == null || product.getPlataformas().isEmpty()) {
            return "Selecciona al menos una plataforma para el juego.";
        }
        if (product.getPlataformas().stream()
                .anyMatch(platform -> platform == null || !PLATAFORMAS_PERMITIDAS.contains(platform))) {
            return "Una o más plataformas no están permitidas.";
        }
        if (product.getImagen() != null && product.getImagen().length() > 255) {
            return "La ruta o URL de imagen no puede superar 255 caracteres.";
        }
        return null;
    }

    private void normalize(Producto product) {
        product.setNombre(product.getNombre().trim());
        product.setCategoria(product.getCategoria().trim());
        product.setImagen(product.getImagen() == null || product.getImagen().isBlank()
                ? "imgtienda/peak.jpg" : product.getImagen().trim());
        product.setDescripcion(product.getDescripcion() == null ? "" : product.getDescripcion().trim());

        List<String> imageList = product.getImagenesPreview() == null ? new ArrayList<>()
                : product.getImagenesPreview().stream()
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
        product.setImagenesPreview(imageList);

        List<String> platformList = product.getPlataformas().stream().distinct().toList();
        product.setPlataformas(platformList);

        if (product.getPrecioOferta() == null || product.getPrecioOferta().compareTo(BigDecimal.ZERO) <= 0) {
            product.setPrecioOferta(null);
        }
        if (product.getPrecioOferta() == null
                || product.getPrecioOferta().compareTo(product.getPrecio()) >= 0) {
            product.setEnOferta(false);
        }
    }
}
