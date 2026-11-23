package com.example.demo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI yakartaOpenAPI() {
        return new OpenAPI().info(new Info()
            .title("Yakarta API REST")
            .description("API del sistema Yakarta: catálogo de juegos, categorías, usuarios y pedidos. "
                + "Permite consultar, crear, modificar y eliminar registros.")
            .version("1.0.0")
            .contact(new Contact()
                .name("Equipo Yakarta")
                .email("soporte@yakarta.cl")));
    }
}
