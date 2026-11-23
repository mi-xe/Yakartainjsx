package com.example.demo.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Conditional;
import com.example.demo.config.GoogleOAuthDisabledCondition;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;

@Controller
@Conditional(GoogleOAuthDisabledCondition.class)
public class OAuthUnavailableController {
    private final String frontendUrl;

    public OAuthUnavailableController(@Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping("/oauth2/authorization/google")
    public void notConfigured(HttpServletResponse response) throws IOException {
        response.sendRedirect(frontendUrl + "/oauth/callback?error=google_not_configured");
    }
}
