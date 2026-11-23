package com.example.demo.service;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Locale;

/** Creates or links a Yakarta account using Google's verified, stable subject identifier. */
@Service
public class GoogleAccountService {
    private final UsuarioRepository usuarios;

    public GoogleAccountService(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
    }

    @Transactional
    public Usuario resolveAccount(String googleSub, String email, String displayName, boolean emailVerified, Long authenticatedYakartaUserId) {
        if (googleSub == null || googleSub.isBlank()) {
            throw new IllegalArgumentException("Google no entregó un identificador de cuenta válido.");
        }
        if (!emailVerified) {
            throw new IllegalArgumentException("Google debe verificar tu dirección de correo antes de iniciar sesión.");
        }
        if (email == null || !email.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Google no entregó un correo electrónico válido.");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Usuario user = usuarios.findByGoogleSub(googleSub).orElse(null);

        if (user != null) {
            if (authenticatedYakartaUserId != null && !authenticatedYakartaUserId.equals(user.getId())) {
                throw new IllegalStateException("Esta cuenta de Google ya está vinculada a otra cuenta Yakarta.");
            }
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail())) {
                Usuario emailOwner = usuarios.findByEmailIgnoreCase(normalizedEmail).orElse(null);
                if (emailOwner != null && !emailOwner.getId().equals(user.getId())) {
                    throw new IllegalStateException("El correo actual de Google pertenece a otra cuenta Yakarta.");
                }
                user.setEmail(normalizedEmail);
            }
        } else {
            Usuario emailOwner = usuarios.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            if (emailOwner != null) {
                // Do not silently attach Google to an account that may have been created
                // with an unverified email. The person must first authenticate with Yakarta.
                if (authenticatedYakartaUserId == null || !authenticatedYakartaUserId.equals(emailOwner.getId())) {
                    throw new IllegalStateException("Ya existe una cuenta Yakarta con ese correo. Inicia sesión con tu contraseña y vuelve a conectar Google desde esa sesión.");
                }
                user = emailOwner;
            } else {
                if (authenticatedYakartaUserId != null) {
                    throw new IllegalStateException("El correo de Google no coincide con la cuenta Yakarta que ya tiene iniciada sesión.");
                }
                user = new Usuario();
                user.setNombre(safeName(displayName, normalizedEmail));
                user.setEmail(normalizedEmail);
                // Social accounts do not use this random password for login.
                user.setPassword(PasswordUtil.hash(UUID.randomUUID().toString()));
                user.setRol("Cliente");
                user.setSaldo(BigDecimal.ZERO);
            }
            if (user.getGoogleSub() != null && !user.getGoogleSub().equals(googleSub)) {
                throw new IllegalStateException("Esta cuenta Yakarta ya está vinculada a otra cuenta de Google.");
            }
            user.setGoogleSub(googleSub);
        }

        try {
            return usuarios.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("No se pudo vincular la cuenta de Google. Comprueba si el correo ya está registrado.", ex);
        }
    }

    private String safeName(String displayName, String email) {
        String name = displayName == null || displayName.isBlank() ? email.substring(0, email.indexOf('@')) : displayName.trim();
        return name.length() > 120 ? name.substring(0, 120) : name;
    }
}
