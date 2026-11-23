package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.util.StringUtils;

@Configuration
@Conditional(GoogleOAuthCredentialsCondition.class)
public class GoogleOAuthClientConfiguration {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(Environment environment,
            @Value("${app.google.redirect-uri:http://localhost:8080/login/oauth2/code/google}") String redirectUri) {
        String clientId = value(environment, "GOOGLE_CLIENT_ID",
                "spring.security.oauth2.client.registration.google.client-id");
        String clientSecret = value(environment, "GOOGLE_CLIENT_SECRET",
                "spring.security.oauth2.client.registration.google.client-secret");

        ClientRegistration google = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .redirectUri(redirectUri)
                .scope("openid", "profile", "email")
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }

    private static String value(Environment environment, String primary, String fallback) {
        String value = environment.getProperty(primary);
        if (StringUtils.hasText(value)) return value;
        return environment.getRequiredProperty(fallback);
    }
}
