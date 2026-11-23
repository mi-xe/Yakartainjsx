package com.example.demo.repository;
import com.example.demo.model.Direccion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface DireccionRepository extends JpaRepository<Direccion, Long> { Optional<Direccion> findByUsuarioId(Long usuarioId); }
