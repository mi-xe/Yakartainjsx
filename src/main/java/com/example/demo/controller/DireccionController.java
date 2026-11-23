package com.example.demo.controller;

import com.example.demo.model.Direccion;
import com.example.demo.model.Usuario;
import com.example.demo.repository.DireccionRepository;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/direccion")
public class DireccionController {
    private final DireccionRepository direcciones;
    private final SessionAuth auth;
    public DireccionController(DireccionRepository direcciones, SessionAuth auth) { this.direcciones = direcciones; this.auth = auth; }
    public record AddressInput(String nombre, String calle, String comuna, String telefono) {}

    @GetMapping @Transactional(readOnly = true)
    public ResponseEntity<?> get(HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Inicia sesión para consultar tu dirección."));
        return direcciones.findByUsuarioId(user.getId())
                .<ResponseEntity<?>>map(address -> ResponseEntity.ok(new AddressInput(address.getNombre(), address.getCalle(), address.getComuna(), address.getTelefono())))
                .orElseGet(() -> ResponseEntity.ok().body(null));
    }

    @PutMapping @Transactional
    public ResponseEntity<?> save(@RequestBody AddressInput input, HttpSession session) {
        Usuario user = auth.currentUser(session);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Inicia sesión para guardar tu dirección."));
        if (input.nombre() == null || input.nombre().isBlank() || input.calle() == null || input.calle().isBlank()
                || input.comuna() == null || input.comuna().isBlank() || input.telefono() == null || input.telefono().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Completa todos los datos de despacho."));
        Direccion address = direcciones.findByUsuarioId(user.getId()).orElseGet(Direccion::new);
        address.setUsuario(user); address.setNombre(input.nombre().trim()); address.setCalle(input.calle().trim());
        address.setComuna(input.comuna().trim()); address.setTelefono(input.telefono().trim());
        Direccion saved = direcciones.save(address);
        return ResponseEntity.ok(new AddressInput(saved.getNombre(), saved.getCalle(), saved.getComuna(), saved.getTelefono()));
    }
}
