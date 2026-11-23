package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(length = 255)
    private String imagen;

    @Column(length = 60)
    private String categoria;

    @Column(name = "en_oferta", nullable = false)
    private boolean enOferta = false;

    @Column(name = "precio_oferta", precision = 12, scale = 2)
    private BigDecimal precioOferta;

    @Column(name = "stock", nullable = false)
    private Integer stock = 10;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    /*
     * Las listas se exponen como arrays JSON en la API, pero se guardan como
     * texto JSON en MySQL. Así JPA persiste una columna String básica y no
     * depende del mapeo JSON de Hibernate para atributos List<String>.
     */
    @Column(name = "imagenes_preview", columnDefinition = "TEXT")
    private String imagenesPreviewJson = "[]";

    @Transient
    private List<String> imagenesPreview;

    @Column(name = "plataformas", columnDefinition = "TEXT")
    private String plataformasJson = "[\"PC\"]";

    @Transient
    private List<String> plataformas;

    public Producto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public boolean isEnOferta() { return enOferta; }
    public void setEnOferta(boolean enOferta) { this.enOferta = enOferta; }

    public BigDecimal getPrecioOferta() { return precioOferta; }
    public void setPrecioOferta(BigDecimal precioOferta) { this.precioOferta = precioOferta; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock == null ? 0 : stock; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    /** API: array de strings; persistencia: columna imagenes_preview con JSON de texto. */
    public List<String> getImagenesPreview() {
        if (imagenesPreview != null) return new ArrayList<>(imagenesPreview);
        return readStringList(imagenesPreviewJson);
    }

    public void setImagenesPreview(List<String> imagenesPreview) {
        this.imagenesPreview = cleanList(imagenesPreview);
        this.imagenesPreviewJson = writeStringList(this.imagenesPreview);
    }

    /** API: array de strings; persistencia: columna plataformas con JSON de texto. */
    public List<String> getPlataformas() {
        if (plataformas != null) return new ArrayList<>(plataformas);
        List<String> stored = readStringList(plataformasJson);
        return stored.isEmpty() ? new ArrayList<>(List.of("PC")) : stored;
    }

    public void setPlataformas(List<String> plataformas) {
        this.plataformas = cleanList(plataformas);
        this.plataformasJson = writeStringList(this.plataformas);
    }

    private static List<String> cleanList(List<String> values) {
        if (values == null || values.isEmpty()) return new ArrayList<>();
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .toList();
    }

    private static String writeStringList(List<String> values) {
        StringBuilder json = new StringBuilder("[");
        if (values != null) {
            for (int index = 0; index < values.size(); index++) {
                if (index > 0) json.append(',');
                appendJsonString(json, values.get(index));
            }
        }
        return json.append(']').toString();
    }

    private static void appendJsonString(StringBuilder json, String value) {
        json.append('"');
        if (value != null) {
            for (int index = 0; index < value.length(); index++) {
                char character = value.charAt(index);
                switch (character) {
                    case '"' -> json.append("\\\"");
                    case '\\' -> json.append("\\\\");
                    case '\b' -> json.append("\\b");
                    case '\f' -> json.append("\\f");
                    case '\n' -> json.append("\\n");
                    case '\r' -> json.append("\\r");
                    case '\t' -> json.append("\\t");
                    default -> {
                        if (character < 0x20) {
                            json.append("\\u");
                            String hex = Integer.toHexString(character);
                            json.append("0".repeat(4 - hex.length())).append(hex);
                        } else {
                            json.append(character);
                        }
                    }
                }
            }
        }
        json.append('"');
    }

    /** Parser reducido para el formato almacenado: un array JSON de cadenas. */
    private static List<String> readStringList(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) return new ArrayList<>();
        try {
            JsonArrayStringParser parser = new JsonArrayStringParser(storedValue);
            return parser.parse();
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Los metadatos del producto no contienen un array JSON válido.", exception);
        }
    }

    private static final class JsonArrayStringParser {
        private final String input;
        private int position;

        private JsonArrayStringParser(String input) { this.input = input; }

        private List<String> parse() {
            List<String> values = new ArrayList<>();
            skipWhitespace();
            expect('[');
            skipWhitespace();
            if (consume(']')) return values;

            while (true) {
                skipWhitespace();
                values.add(parseString());
                skipWhitespace();
                if (consume(']')) break;
                expect(',');
            }
            skipWhitespace();
            if (position != input.length()) throw new IllegalArgumentException("Contenido después del array JSON.");
            return values;
        }

        private String parseString() {
            expect('"');
            StringBuilder value = new StringBuilder();
            while (position < input.length()) {
                char character = input.charAt(position++);
                if (character == '"') return value.toString();
                if (character < 0x20) throw new IllegalArgumentException("Carácter de control sin escapar.");
                if (character != '\\') {
                    value.append(character);
                    continue;
                }
                if (position >= input.length()) throw new IllegalArgumentException("Escape incompleto.");
                char escape = input.charAt(position++);
                switch (escape) {
                    case '"', '\\', '/' -> value.append(escape);
                    case 'b' -> value.append('\b');
                    case 'f' -> value.append('\f');
                    case 'n' -> value.append('\n');
                    case 'r' -> value.append('\r');
                    case 't' -> value.append('\t');
                    case 'u' -> value.append(parseUnicode());
                    default -> throw new IllegalArgumentException("Secuencia de escape desconocida.");
                }
            }
            throw new IllegalArgumentException("Cadena JSON sin cerrar.");
        }

        private char parseUnicode() {
            if (position + 4 > input.length()) throw new IllegalArgumentException("Escape Unicode incompleto.");
            int code = 0;
            for (int index = 0; index < 4; index++) {
                int digit = Character.digit(input.charAt(position++), 16);
                if (digit < 0) throw new IllegalArgumentException("Escape Unicode inválido.");
                code = (code << 4) | digit;
            }
            return (char) code;
        }

        private void skipWhitespace() {
            while (position < input.length() && Character.isWhitespace(input.charAt(position))) position++;
        }

        private boolean consume(char expected) {
            if (position < input.length() && input.charAt(position) == expected) {
                position++;
                return true;
            }
            return false;
        }

        private void expect(char expected) {
            if (!consume(expected)) throw new IllegalArgumentException("Se esperaba '" + expected + "'.");
        }
    }
}
