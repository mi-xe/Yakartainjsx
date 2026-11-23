package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Only enables the OAuth endpoints when Google credentials have been supplied. */
    @Bean
    @Order(1)
    @Conditional(GoogleOAuthCredentialsCondition.class)
    public SecurityFilterChain googleOAuthFilterChain(
            HttpSecurity http,
            GoogleOAuth2SuccessHandler successHandler,
            GoogleOAuth2FailureHandler failureHandler) throws Exception {
        http
            .securityMatcher("/oauth2/**", "/login/oauth2/**")
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()))
            .oauth2Login(oauth -> oauth
                .successHandler(successHandler)
                .failureHandler(failureHandler));
        return http.build();
    }

    /** The application already performs authorization in its REST controllers via HttpSession. */
    @Bean
    @Order(2)
    public SecurityFilterChain applicationFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());
        return http.build();
    }
}
