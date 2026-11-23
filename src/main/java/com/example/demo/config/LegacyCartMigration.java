package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Copies existing PHP cart rows into the Java API cart table when upgrading an old database. */
@Component
public class LegacyCartMigration implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(LegacyCartMigration.class);
    private final JdbcTemplate jdbc;

    public LegacyCartMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        try {
            if (!tableExists("carritos") || !tableExists("carrito_detalles") || !tableExists("carrito_items")) {
                return;
            }
            int copied = jdbc.update("""
                    INSERT IGNORE INTO carrito_items (owner_key, producto_id, cantidad)
                    SELECT
                      CASE
                        WHEN c.usuario_id IS NOT NULL THEN CONCAT('USER:', c.usuario_id)
                        WHEN c.session_id IS NOT NULL AND c.session_id <> '' THEN CONCAT('SESSION:', c.session_id)
                        ELSE NULL
                      END,
                      d.producto_id,
                      d.cantidad
                    FROM carritos c
                    INNER JOIN carrito_detalles d ON d.carrito_id = c.id
                    WHERE c.usuario_id IS NOT NULL OR (c.session_id IS NOT NULL AND c.session_id <> '')
                    """);
            if (copied > 0) log.info("Migrados {} artículos de carritos heredados a carrito_items.", copied);
        } catch (Exception ex) {
            // A fresh Java database has no legacy tables; a failed compatibility probe must not stop startup.
            log.warn("No se pudo comprobar/migrar el carrito heredado. La tienda seguirá usando carrito_items: {}", ex.getMessage());
        }
    }

    private boolean tableExists(String table) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class, table);
        return count != null && count > 0;
    }
}
