package com.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pedido_detalles")
public class PedidoDetalle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;
    @Column(name = "nombre_producto", length = 150)
    private String nombreProducto;
    // Legacy PHP columns remain NOT NULL, so new orders write to both representations.
    @Column(name = "nombre", length = 160)
    private String nombreLegacy;
    @Column(nullable = false)
    private Integer cantidad;
    @Column(name = "precio_unitario", precision = 12, scale = 2)
    private BigDecimal precioUnitario;
    @Column(name = "precio", precision = 12, scale = 2)
    private BigDecimal precioLegacy;

    public PedidoDetalle() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Pedido getPedido(){return pedido;} public void setPedido(Pedido pedido){this.pedido=pedido;}
    public Producto getProducto(){return producto;} public void setProducto(Producto producto){this.producto=producto;}
    public String getNombreProducto(){return nombreProducto != null ? nombreProducto : nombreLegacy;}
    public void setNombreProducto(String nombreProducto){this.nombreProducto=nombreProducto; this.nombreLegacy=nombreProducto;}
    public Integer getCantidad(){return cantidad;} public void setCantidad(Integer cantidad){this.cantidad=cantidad;}
    public BigDecimal getPrecioUnitario(){return precioUnitario != null ? precioUnitario : precioLegacy;}
    public void setPrecioUnitario(BigDecimal precioUnitario){this.precioUnitario=precioUnitario; this.precioLegacy=precioUnitario;}
}
