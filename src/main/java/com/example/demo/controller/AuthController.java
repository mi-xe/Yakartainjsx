package com.example.demo.controller;

import com.example.demo.model.CarritoItem;
import com.example.demo.model.Usuario;
import com.example.demo.repository.CarritoItemRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.PasswordUtil;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UsuarioRepository usuarios;
    private final CarritoItemRepository carrito;
    private final SessionAuth auth;

    public AuthController(UsuarioRepository usuarios, CarritoItemRepository carrito, SessionAuth auth) {
        this.usuarios = usuarios; this.carrito = carrito; this.auth = auth;
    }

    public record Credentials(String nombre, String email, String password) {}
    public record FundsRequest(BigDecimal amount) {}
    public record PublicUser(Long id, String nombre, String email, String rol, BigDecimal saldo) {}

    private PublicUser safe(Usuario user) {
        return new PublicUser(user.getId(), user.getNombre(), user.getEmail(), user.getRol(), user.getSaldo());
    }

    @PostMapping("/registro")
    public ResponseEntity<?> register(@RequestBody Credentials input) {
        if (input == null || input.nombre() == null || input.nombre().isBlank() || input.email() == null ||
                !input.email().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") ||
                input.password() == null || input.password().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Completa los datos y usa una contraseña de al menos 6 caracteres."));
        }

        String nombre = input.nombre().trim();
        String email = input.email().trim().toLowerCase();
        if (nombre.length() > 120 || email.length() > 190) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre o correo supera el largo permitido."));
        }

        try {
            if (usuarios.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.status(409).body(Map.of("message", "Ese correo ya está registrado."));
            }

            Usuario user = new Usuario();
            user.setNombre(nombre);
            user.setEmail(email);
            user.setPassword(PasswordUtil.hash(input.password()));
            user.setRol("Cliente");
            user.setSaldo(BigDecimal.ZERO);

            // saveAndFlush fuerza el INSERT ahora y evita responder éxito antes de que MySQL lo acepte.
            Usuario saved = usuarios.saveAndFlush(user);
            return ResponseEntity.status(201).body(Map.of(
                    "user", safe(saved),
                    "message", "Cuenta creada y guardada correctamente en MySQL."));
        } catch (DataIntegrityViolationException ex) {
            // Cubre el caso de dos registros simultáneos con el mismo correo sin ocultar
            // otros errores de esquema (por ejemplo, una columna que no existe).
            try {
                if (usuarios.findByEmailIgnoreCase(email).isPresent()) {
                    return ResponseEntity.status(409).body(Map.of("message", "Ese correo ya está registrado."));
                }
            } catch (DataAccessException lookupError) {
                log.error("No se pudo comprobar si el correo {} ya existe", email, lookupError);
            }
            log.error("MySQL rechazó el INSERT de una cuenta para {}", email, ex);
            return ResponseEntity.status(500).body(Map.of(
                    "message", "MySQL rechazó el registro. Revisa que la tabla usuarios tenga las columnas nombre, email, password, rol y saldo."));
        } catch (DataAccessException ex) {
            log.error("No se pudo guardar la cuenta en MySQL para {}", email, ex);
            return ResponseEntity.status(503).body(Map.of(
                    "message", "No se pudo guardar la cuenta en MySQL. Comprueba la conexión y la base de datos configurada en el backend."));
        }
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@RequestBody Credentials input, HttpServletRequest request, HttpSession session) {
        if (input.email() == null || input.password() == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Ingresa tu correo y contraseña."));
        var found = usuarios.findByEmailIgnoreCase(input.email().trim());
        if (found.isEmpty() || !PasswordUtil.verify(input.password(), found.get().getPassword()))
            return ResponseEntity.status(401).body(Map.of("message", "Correo o contraseña incorrectos."));

        String oldOwner = (String) session.getAttribute(SessionAuth.ANONYMOUS_CART_OWNER);
        if (oldOwner == null) oldOwner = "SESSION:" + session.getId();
        request.changeSessionId();
        Usuario user = found.get();
        // Migrate legacy plain-text and PHP bcrypt hashes after a successful login.
        if (PasswordUtil.needsUpgrade(user.getPassword())) {
            user.setPassword(PasswordUtil.hash(input.password()));
            user = usuarios.save(user);
        }
        session.setAttribute(SessionAuth.USER_ID, user.getId());
        session.removeAttribute(SessionAuth.ANONYMOUS_CART_OWNER);
        String userOwner = "USER:" + user.getId();
        for (CarritoItem item : carrito.findByOwnerKey(oldOwner)) {
            var existing = carrito.findByOwnerKeyAndProductoId(userOwner, item.getProducto().getId());
            if (existing.isPresent()) {
                CarritoItem current = existing.get();
                current.setCantidad(current.getCantidad() + item.getCantidad());
                carrito.save(current);
                carrito.delete(item);
            } else {
                item.setOwnerKey(userOwner);
                carrito.save(item);
            }
        }
        return ResponseEntity.ok(Map.of("user", safe(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "No hay una sesión iniciada."));
        return ResponseEntity.ok(Map.of("user", safe(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        if (session != null) session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada."));
    }

    @PostMapping("/fondos")
    @Transactional
    public ResponseEntity<?> addFunds(@RequestBody FundsRequest input, HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Inicia sesión para agregar fondos."));
        if (!"Cliente".equalsIgnoreCase(user.getRol()))
            return ResponseEntity.status(403).body(Map.of("message", "Solo las cuentas Cliente pueden agregar fondos."));
        if (input.amount() == null || input.amount().compareTo(BigDecimal.ZERO) <= 0 || input.amount().compareTo(new BigDecimal("1000000")) > 0)
            return ResponseEntity.badRequest().body(Map.of("message", "El monto solicitado no es válido."));
        user.setSaldo(user.getSaldo().add(input.amount()));
        usuarios.save(user);
        return ResponseEntity.ok(Map.of("user", safe(user), "message", "Saldo actualizado."));
    }
}
