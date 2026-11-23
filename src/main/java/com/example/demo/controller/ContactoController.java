package com.example.demo.controller;

import com.example.demo.model.MensajeContacto;
import com.example.demo.repository.MensajeContactoRepository;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/contacto")
public class ContactoController {
    private final MensajeContactoRepository repo;
    private final SessionAuth auth;
    public ContactoController(MensajeContactoRepository repo, SessionAuth auth) { this.repo = repo; this.auth = auth; }
    public record ContactInput(String nombre, String email, String telefono, String comentario) {}
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ContactInput input) {
        if (input.nombre() == null || input.nombre().isBlank() || input.email() == null || !input.email().contains("@")
                || input.telefono() == null || input.telefono().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Completa nombre, correo y teléfono."));
        MensajeContacto message = new MensajeContacto();
        message.setNombre(input.nombre().trim()); message.setEmail(input.email().trim().toLowerCase());
        message.setTelefono(input.telefono().trim()); message.setComentario(input.comentario());
        message.setCreadoEn(LocalDateTime.now()); repo.save(message);
        return ResponseEntity.status(201).body(Map.of("message", "Mensaje enviado correctamente."));
    }
    @GetMapping
    public ResponseEntity<?> all(HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        return ResponseEntity.ok(repo.findAll());
    }
}
