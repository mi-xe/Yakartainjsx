package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.PasswordUtil;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioRepository repo;
    private final SessionAuth auth;
    public UsuarioController(UsuarioRepository repo, SessionAuth auth) { this.repo = repo; this.auth = auth; }
    public record UserInput(String nombre, String email, String password, String rol) {}
    public record UserOut(Long id, String nombre, String email, String rol, BigDecimal saldo) {}
    private UserOut safe(Usuario user) { return new UserOut(user.getId(), user.getNombre(), user.getEmail(), user.getRol(), user.getSaldo()); }
    private boolean validRole(String role) { return "Cliente".equals(role) || "Administrador".equals(role); }

    @GetMapping public ResponseEntity<?> all(HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        return ResponseEntity.ok(repo.findAll().stream().map(this::safe).toList());
    }
    @PostMapping public ResponseEntity<?> create(@RequestBody UserInput input, HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        if (input.nombre() == null || input.nombre().isBlank() || input.email() == null || !input.email().contains("@")
                || input.password() == null || input.password().length() < 6 || !validRole(input.rol()))
            return ResponseEntity.badRequest().body(Map.of("message", "Revisa los datos. La contraseña debe tener al menos 6 caracteres."));
        String email = input.email().trim().toLowerCase();
        if (repo.findByEmailIgnoreCase(email).isPresent()) return ResponseEntity.status(409).body(Map.of("message", "Ese correo ya está registrado."));
        Usuario user = new Usuario(); user.setNombre(input.nombre().trim()); user.setEmail(email);
        user.setPassword(PasswordUtil.hash(input.password())); user.setRol(input.rol());
        return ResponseEntity.status(201).body(safe(repo.save(user)));
    }
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UserInput input, HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        Usuario user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (input.nombre() == null || input.nombre().isBlank() || input.email() == null || !input.email().contains("@") || !validRole(input.rol()))
            return ResponseEntity.badRequest().body(Map.of("message", "Revisa nombre, correo y rol."));
        String email = input.email().trim().toLowerCase();
        var duplicate = repo.findByEmailIgnoreCase(email);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) return ResponseEntity.status(409).body(Map.of("message", "Ese correo ya está registrado."));
        user.setNombre(input.nombre().trim()); user.setEmail(email); user.setRol(input.rol());
        if (input.password() != null && !input.password().isBlank()) {
            if (input.password().length() < 6) return ResponseEntity.badRequest().body(Map.of("message", "La contraseña debe tener al menos 6 caracteres."));
            user.setPassword(PasswordUtil.hash(input.password()));
        }
        return ResponseEntity.ok(safe(repo.save(user)));
    }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        Usuario current = auth.currentUser(session);
        if (current == null || !"Administrador".equalsIgnoreCase(current.getRol()))
            return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        if (current.getId().equals(id)) return ResponseEntity.badRequest().body(Map.of("message", "No puedes eliminar la cuenta de administrador que estás usando."));
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }
}
