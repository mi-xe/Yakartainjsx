package com.example.demo.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

/** Matches when the optional Google OAuth credentials are not configured. */
public class GoogleOAuthDisabledCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        return !new GoogleOAuthCredentialsCondition().matches(context, metadata);
    }
}
