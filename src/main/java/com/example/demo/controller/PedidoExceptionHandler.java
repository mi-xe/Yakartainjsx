package com.example.demo.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Converts unexpected checkout errors into a useful API response while keeping
 * SQL details, stack traces and internal data in the backend log only.
 */
@RestControllerAdvice(assignableTypes = PedidoController.class)
public class PedidoExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(PedidoExceptionHandler.class);

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(
            DataIntegrityViolationException exception, HttpServletRequest request) {
        return internalError(exception, request,
                "MySQL rechazó el registro del pedido. Revisa las tablas pedidos y pedido_detalles en la base de datos.");
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDatabase(
            DataAccessException exception, HttpServletRequest request) {
        return internalError(exception, request,
                "No se pudo completar la compra porque falló una operación en MySQL. Revisa la conexión y las tablas de Yakarta.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception exception, HttpServletRequest request) {
        return internalError(exception, request,
                "No se pudo completar la compra por un error inesperado del backend. Revisa el registro del servidor con el código indicado.");
    }

    private ResponseEntity<Map<String, Object>> internalError(
            Exception exception, HttpServletRequest request, String message) {
        String reference = UUID.randomUUID().toString();
        log.error("Error de checkout. reference={}, path={}", reference, request.getRequestURI(), exception);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("reference", reference);
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
