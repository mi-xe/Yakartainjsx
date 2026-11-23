package com.example.demo.repository;

import com.example.demo.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    /**
     * Bloquea la fila durante la transacción de compra o edición de inventario.
     * Se usa SQL nativo porque MariaDB acepta "FOR UPDATE", pero no la variante
     * "FOR UPDATE OF alias" que Hibernate puede generar para otros dialectos.
     * Los controladores que llaman este método ya ejecutan @Transactional.
     */
    @Query(value = "SELECT * FROM productos WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Producto> findByIdForUpdate(@Param("id") Long id);
}
