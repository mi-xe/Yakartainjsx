package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/** Publica en HTTP el mismo directorio en el que ImagenController guarda los archivos. */
@Configuration
public class UploadedImageResourceConfig implements WebMvcConfigurer {
    private final Path uploadDirectory;

    public UploadedImageResourceConfig(@Value("${app.upload.dir:uploads/productos}") String uploadDirectory) {
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = uploadDirectory.toUri().toString();
        if (!location.endsWith("/")) location += "/";
        registry.addResourceHandler("/uploads/productos/**")
                .addResourceLocations(location);
    }
}
