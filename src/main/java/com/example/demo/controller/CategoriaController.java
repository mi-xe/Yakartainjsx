package com.example.demo.controller;

import com.example.demo.model.Categoria;
import com.example.demo.repository.CategoriaRepository;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {
    private final CategoriaRepository repo;
    private final SessionAuth auth;
    public CategoriaController(CategoriaRepository repo, SessionAuth auth) { this.repo = repo; this.auth = auth; }
    @GetMapping public List<Categoria> all() { return repo.findAll(); }
    @PostMapping public ResponseEntity<?> create(@RequestBody Categoria category, HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        category.setId(null); return ResponseEntity.ok(repo.save(category));
    }
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Categoria category, HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        category.setId(id); return ResponseEntity.ok(repo.save(category));
    }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        if (!auth.isAdmin(session)) return ResponseEntity.status(403).body(Map.of("message", "Se requiere rol Administrador."));
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }
}
