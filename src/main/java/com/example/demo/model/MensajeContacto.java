package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensajes_contacto")
public class MensajeContacto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String nombre;
    @Column(nullable = false, length = 190) private String email;
    @Column(nullable = false, length = 40) private String telefono;
    @Column(columnDefinition = "TEXT") private String comentario;
    @Column(nullable = false) private LocalDateTime creadoEn = LocalDateTime.now();
    public MensajeContacto() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getNombre(){return nombre;} public void setNombre(String nombre){this.nombre=nombre;}
    public String getEmail(){return email;} public void setEmail(String email){this.email=email;}
    public String getTelefono(){return telefono;} public void setTelefono(String telefono){this.telefono=telefono;}
    public String getComentario(){return comentario;} public void setComentario(String comentario){this.comentario=comentario;}
    public LocalDateTime getCreadoEn(){return creadoEn;} public void setCreadoEn(LocalDateTime creadoEn){this.creadoEn=creadoEn;}
}
