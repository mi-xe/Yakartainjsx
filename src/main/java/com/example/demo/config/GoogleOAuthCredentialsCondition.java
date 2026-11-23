package com.example.demo.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/** Enables Google OAuth only when both credentials are present. */
public class GoogleOAuthCredentialsCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String clientId = first(context,
                "GOOGLE_CLIENT_ID",
                "spring.security.oauth2.client.registration.google.client-id");
        String clientSecret = first(context,
                "GOOGLE_CLIENT_SECRET",
                "spring.security.oauth2.client.registration.google.client-secret");
        return StringUtils.hasText(clientId) && StringUtils.hasText(clientSecret);
    }

    static String first(ConditionContext context, String primary, String fallback) {
        String value = context.getEnvironment().getProperty(primary);
        return StringUtils.hasText(value) ? value : context.getEnvironment().getProperty(fallback);
    }
}
