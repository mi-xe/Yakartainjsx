package com.example.demo.config;

import com.example.demo.model.Usuario;
import com.example.demo.service.GoogleAccountService;
import com.example.demo.service.GoogleCartMigrationService;
import com.example.demo.service.SessionAuth;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class GoogleOAuth2SuccessHandler implements AuthenticationSuccessHandler {
    private static final Logger log = LoggerFactory.getLogger(GoogleOAuth2SuccessHandler.class);
    private final GoogleAccountService accounts;
    private final GoogleCartMigrationService cartMigration;
    private final String frontendUrl;

    public GoogleOAuth2SuccessHandler(
            GoogleAccountService accounts,
            GoogleCartMigrationService cartMigration,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.accounts = accounts;
        this.cartMigration = cartMigration;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2User google = (OAuth2User) authentication.getPrincipal();
            String sub = string(google.getAttribute("sub"));
            String email = string(google.getAttribute("email"));
            String name = string(google.getAttribute("name"));
            boolean verified = booleanValue(google.getAttribute("email_verified"));

            HttpSession session = request.getSession(true);
            Object previousUserId = session.getAttribute(SessionAuth.USER_ID);
            Long authenticatedYakartaUserId = previousUserId instanceof Long id ? id : null;
            Usuario user = accounts.resolveAccount(sub, email, name, verified, authenticatedYakartaUserId);
            if (previousUserId == null) {
                String anonymousOwner = (String) session.getAttribute(SessionAuth.ANONYMOUS_CART_OWNER);
                if (anonymousOwner == null) anonymousOwner = "SESSION:" + session.getId();
                cartMigration.mergeAnonymousCart(anonymousOwner, "USER:" + user.getId());
            }
            session.setAttribute(SessionAuth.USER_ID, user.getId());
            session.removeAttribute(SessionAuth.ANONYMOUS_CART_OWNER);
            response.sendRedirect(frontendUrl + "/oauth/callback?login=google");
        } catch (Exception ex) {
            log.error("No se pudo completar el inicio de sesión con Google", ex);
            response.sendRedirect(frontendUrl + "/oauth/callback?error=google_account_error");
        }
    }

    private static String string(Object value) {
        return value == null ? null : value.toString();
    }

    private static boolean booleanValue(Object value) {
        return Boolean.TRUE.equals(value) || (value != null && "true".equalsIgnoreCase(value.toString()));
    }
}
