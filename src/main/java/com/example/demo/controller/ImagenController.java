package com.example.demo.controller;

import com.example.demo.service.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/archivos")
public class ImagenController {
    private static final long MAX_FILE_SIZE = 8L * 1024 * 1024;
    private final SessionAuth auth;
    private final Path uploadDirectory;

    public ImagenController(SessionAuth auth,
                            @Value("${app.upload.dir:uploads/productos}") String uploadDirectory) {
        this.auth = auth;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
    }

    /** Recibe la portada o una captura desde el panel de administrador. */
    @PostMapping(value = "/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file, HttpSession session) {
        if (!auth.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Se requiere rol Administrador para subir imágenes."));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Selecciona una imagen para subir."));
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cada imagen puede pesar como máximo 8 MB."));
        }

        String extension = extensionFor(file.getContentType());
        if (extension == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Formato no permitido. Usa JPG, PNG, WEBP o GIF."));
        }

        try {
            Files.createDirectories(uploadDirectory);
            String filename = UUID.randomUUID() + "." + extension;
            Path destination = uploadDirectory.resolve(filename).normalize();
            if (!destination.startsWith(uploadDirectory)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nombre de archivo no válido."));
            }
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("url", "/uploads/productos/" + filename));
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "No se pudo guardar la imagen en el servidor."));
        }
    }

    private String extensionFor(String contentType) {
        if (contentType == null) return null;
        return switch (contentType.toLowerCase()) {
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> null;
        };
    }
}
