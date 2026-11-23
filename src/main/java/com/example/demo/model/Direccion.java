package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "direcciones", uniqueConstraints = @UniqueConstraint(columnNames = "usuario_id"))
public class Direccion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "usuario_id", nullable = true, unique = true)
    private Usuario usuario;
    @Column(nullable = false, length = 120) private String nombre;
    @Column(nullable = false, length = 200) private String calle;
    @Column(nullable = false, length = 120) private String comuna;
    @Column(nullable = false, length = 40) private String telefono;
    public Direccion() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Usuario getUsuario(){return usuario;} public void setUsuario(Usuario usuario){this.usuario=usuario;}
    public String getNombre(){return nombre;} public void setNombre(String nombre){this.nombre=nombre;}
    public String getCalle(){return calle;} public void setCalle(String calle){this.calle=calle;}
    public String getComuna(){return comuna;} public void setComuna(String comuna){this.comuna=comuna;}
    public String getTelefono(){return telefono;} public void setTelefono(String telefono){this.telefono=telefono;}
}
