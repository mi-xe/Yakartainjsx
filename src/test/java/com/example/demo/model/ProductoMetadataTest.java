package com.example.demo.model;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductoMetadataTest {
    @Test
    void keepsImageGalleryAsJsonTextAndRestoresItAfterDatabaseHydration() throws Exception {
        List<String> expected = List.of(
                "/uploads/productos/captura-01.webp",
                "https://cdn.example.test/game image.png?size=large&v=2"
        );
        Producto product = new Producto();
        product.setImagenesPreview(expected);

        Field storedJson = Producto.class.getDeclaredField("imagenesPreviewJson");
        storedJson.setAccessible(true);
        String databaseValue = (String) storedJson.get(product);

        Producto reloaded = new Producto();
        storedJson.set(reloaded, databaseValue);
        assertEquals(expected, reloaded.getImagenesPreview());
    }

    @Test
    void keepsSelectedPlatformsAsJsonTextAndRestoresThemAfterDatabaseHydration() throws Exception {
        List<String> expected = List.of("PC", "PlayStation 5", "Nintendo Switch 2");
        Producto product = new Producto();
        product.setPlataformas(expected);

        Field storedJson = Producto.class.getDeclaredField("plataformasJson");
        storedJson.setAccessible(true);
        String databaseValue = (String) storedJson.get(product);

        Producto reloaded = new Producto();
        storedJson.set(reloaded, databaseValue);
        assertEquals(expected, reloaded.getPlataformas());
    }
}
