package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "carrito_items", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_key", "producto_id"}))
public class CarritoItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "owner_key", nullable = false, length = 100) private String ownerKey;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "producto_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)) private Producto producto;
    @Column(nullable = false) private Integer cantidad = 1;
    public CarritoItem() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getOwnerKey(){return ownerKey;} public void setOwnerKey(String ownerKey){this.ownerKey=ownerKey;}
    public Producto getProducto(){return producto;} public void setProducto(Producto producto){this.producto=producto;}
    public Integer getCantidad(){return cantidad;} public void setCantidad(Integer cantidad){this.cantidad=cantidad;}
}
