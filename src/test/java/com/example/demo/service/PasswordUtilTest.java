package com.example.demo.service;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class PasswordUtilTest {
    @Test
    void verifiesCurrentPbkdf2Hashes() {
        String encoded = PasswordUtil.hash("ClaveSegura123");
        assertTrue(PasswordUtil.verify("ClaveSegura123", encoded));
        assertFalse(PasswordUtil.verify("otra-clave", encoded));
        assertFalse(PasswordUtil.needsUpgrade(encoded));
    }

    @Test
    void verifiesAndMarksLegacyPlainTextForMigration() {
        assertTrue(PasswordUtil.verify("trescuatro", "trescuatro"));
        assertTrue(PasswordUtil.needsUpgrade("trescuatro"));
        assertFalse(PasswordUtil.verify("incorrecta", "trescuatro"));
    }

    @Test
    void verifiesPhpBcryptHashes() {
        String springHash = new BCryptPasswordEncoder().encode("clave-php-123");
        String phpHash = "$2y$" + springHash.substring(4);
        assertTrue(PasswordUtil.verify("clave-php-123", phpHash));
        assertTrue(PasswordUtil.needsUpgrade(phpHash));
        assertFalse(PasswordUtil.verify("clave-incorrecta", phpHash));
    }
}
