package com.example.demo.service;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;

@Component
public class SessionAuth {
    public static final String USER_ID = "yakartaUserId";
    public static final String ANONYMOUS_CART_OWNER = "yakartaAnonymousCartOwner";
    private final UsuarioRepository usuarios;

    public SessionAuth(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    public Usuario currentUser(HttpSession session) {
        if (session == null) return null;
        Object id = session.getAttribute(USER_ID);
        if (!(id instanceof Long userId)) return null;
        return usuarios.findById(userId).orElse(null);
    }

    public boolean isAdmin(HttpSession session) {
        Usuario user = currentUser(session);
        return user != null && "Administrador".equalsIgnoreCase(user.getRol());
    }
}
