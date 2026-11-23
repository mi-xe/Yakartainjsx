package com.example.demo.controller;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {
    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Checks the real application schema, not just whether MySQL accepts SELECT 1.
     * The returned account count makes it possible to verify which database the API uses.
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String database = jdbc.queryForObject("SELECT DATABASE()", String.class);
            Integer users = jdbc.queryForObject("SELECT COUNT(*) FROM usuarios", Integer.class);
            result.put("ok", true);
            result.put("database", database);
            result.put("usersTableReady", true);
            result.put("usersCount", users == null ? 0 : users);
            result.put("message", "API conectada a MySQL y tabla usuarios disponible.");
            return ResponseEntity.ok(result);
        } catch (DataAccessException ex) {
            result.put("ok", false);
            result.put("database", null);
            result.put("usersTableReady", false);
            result.put("message", "La API responde, pero no puede consultar la tabla usuarios. Revisa la base yakarta y ejecuta database/yakarta.sql.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(result);
        }
    }
}
