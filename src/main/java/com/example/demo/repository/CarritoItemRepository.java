package com.example.demo.repository;
import com.example.demo.model.CarritoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface CarritoItemRepository extends JpaRepository<CarritoItem, Long> {
    List<CarritoItem> findByOwnerKey(String ownerKey);
    Optional<CarritoItem> findByOwnerKeyAndProductoId(String ownerKey, Long productoId);
    void deleteByOwnerKey(String ownerKey);
    void deleteByProducto_Id(Long productoId);
}
