package com.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
public class Pedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;
    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;
    @Column(nullable = false, length = 30)
    private String estado = "Pendiente";
    @Column(name = "direccion_nombre", length = 120)
    private String direccionNombre;
    @Column(name = "direccion_calle", length = 200)
    private String direccionCalle;
    @Column(name = "direccion_comuna", length = 120)
    private String direccionComuna;
    @Column(name = "direccion_telefono", length = 40)
    private String direccionTelefono;
    // Compatibility with the previous PHP schema, where these columns were NOT NULL.
    @Column(name = "usuario_nombre", length = 120)
    private String usuarioNombre;
    @Column(name = "usuario_email", length = 190)
    private String usuarioEmail;
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PedidoDetalle> productos = new ArrayList<>();

    public Pedido() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Usuario getUsuario(){return usuario;} public void setUsuario(Usuario usuario){this.usuario=usuario;}
    public LocalDate getFecha(){return fecha;} public void setFecha(LocalDate fecha){this.fecha=fecha;}
    public BigDecimal getTotal(){return total;} public void setTotal(BigDecimal total){this.total=total;}
    public String getEstado(){return estado;} public void setEstado(String estado){this.estado=estado;}
    public String getDireccionNombre(){return direccionNombre;} public void setDireccionNombre(String value){this.direccionNombre=value;}
    public String getDireccionCalle(){return direccionCalle;} public void setDireccionCalle(String value){this.direccionCalle=value;}
    public String getDireccionComuna(){return direccionComuna;} public void setDireccionComuna(String value){this.direccionComuna=value;}
    public String getDireccionTelefono(){return direccionTelefono;} public void setDireccionTelefono(String value){this.direccionTelefono=value;}
    public String getUsuarioNombre(){return usuarioNombre;} public void setUsuarioNombre(String value){this.usuarioNombre=value;}
    public String getUsuarioEmail(){return usuarioEmail;} public void setUsuarioEmail(String value){this.usuarioEmail=value;}
    public List<PedidoDetalle> getProductos(){return productos;} public void setProductos(List<PedidoDetalle> productos){this.productos=productos;}
}
