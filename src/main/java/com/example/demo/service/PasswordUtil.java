package com.example.demo.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.regex.Pattern;

/**
 * Password helpers for the current PBKDF2 format and legacy PHP accounts.
 * Legacy plaintext / bcrypt values are accepted only to migrate them on login.
 */
public final class PasswordUtil {
    private static final int ITERATIONS = 160_000;
    private static final int KEY_BITS = 256;
    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder();
    private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private PasswordUtil() {}

    public static String hash(String password) {
        if (password == null) throw new IllegalArgumentException("La contraseña no puede ser nula.");
        try {
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            byte[] key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS)).getEncoded();
            return "pbkdf2$" + ITERATIONS + "$" + HexFormat.of().formatHex(salt) + "$" + HexFormat.of().formatHex(key);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo proteger la contraseña", e);
        }
    }

    public static boolean verify(String password, String stored) {
        if (password == null || stored == null || stored.isBlank()) return false;
        if (stored.startsWith("pbkdf2$")) return verifyPbkdf2(password, stored);

        // PHP password_hash(PASSWORD_DEFAULT) historically emits $2y$ bcrypt hashes.
        if (BCRYPT_PATTERN.matcher(stored).matches()) {
            String compatibleHash = stored.startsWith("$2y$") || stored.startsWith("$2b$")
                    ? "$2a$" + stored.substring(4) : stored;
            try { return BCRYPT.matches(password, compatibleHash); }
            catch (IllegalArgumentException ignored) { return false; }
        }
        // Do not treat a malformed hash as a plaintext password.
        if (stored.startsWith("$2") || stored.startsWith("$argon2") || stored.startsWith("{")) return false;

        // The previous SQL seed inserted a couple of administrator passwords as plain text.
        // A successful comparison is immediately upgraded to PBKDF2 in AuthController.
        return MessageDigest.isEqual(password.getBytes(StandardCharsets.UTF_8), stored.getBytes(StandardCharsets.UTF_8));
    }

    public static boolean needsUpgrade(String stored) {
        return stored == null || !stored.startsWith("pbkdf2$");
    }

    private static boolean verifyPbkdf2(String password, String stored) {
        try {
            String[] parts = stored.split("\\$");
            if (parts.length != 4 || !parts[0].equals("pbkdf2")) return false;
            int iterations = Integer.parseInt(parts[1]);
            if (iterations < 1 || iterations > 2_000_000) return false;
            byte[] salt = HexFormat.of().parseHex(parts[2]);
            byte[] expected = HexFormat.of().parseHex(parts[3]);
            byte[] actual = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(new PBEKeySpec(password.toCharArray(), salt, iterations, expected.length * 8)).getEncoded();
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception e) {
            return false;
        }
    }
}
