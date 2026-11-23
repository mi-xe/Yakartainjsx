package com.example.demo.service;

import com.example.demo.model.CarritoItem;
import com.example.demo.repository.CarritoItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GoogleCartMigrationService {
    private final CarritoItemRepository carrito;

    public GoogleCartMigrationService(CarritoItemRepository carrito) {
        this.carrito = carrito;
    }

    @Transactional
    public void mergeAnonymousCart(String anonymousOwner, String userOwner) {
        List<CarritoItem> items = carrito.findByOwnerKey(anonymousOwner);
        for (CarritoItem item : items) {
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
    }
}
