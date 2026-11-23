package com.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "usuarios", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(name = "uk_usuarios_google_sub", columnNames = "google_sub")
})
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String nombre;
    @Column(nullable = false, length = 190, unique = true)
    private String email;
    @Column(nullable = false, length = 255)
    private String password;
    // Identificador estable de Google (sub). Es NULL para cuentas creadas solo con contraseña.
    @Column(name = "google_sub", length = 255)
    private String googleSub;
    @Column(nullable = false, length = 30)
    private String rol = "Cliente";
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal saldo = BigDecimal.ZERO;

    public Usuario() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getNombre(){return nombre;} public void setNombre(String nombre){this.nombre=nombre;}
    public String getEmail(){return email;} public void setEmail(String email){this.email=email;}
    public String getPassword(){return password;} public void setPassword(String password){this.password=password;}
    public String getGoogleSub(){return googleSub;} public void setGoogleSub(String googleSub){this.googleSub=googleSub;}
    public String getRol(){return rol;} public void setRol(String rol){this.rol=rol;}
    public BigDecimal getSaldo(){return saldo;} public void setSaldo(BigDecimal saldo){this.saldo=saldo == null ? BigDecimal.ZERO : saldo;}
}
