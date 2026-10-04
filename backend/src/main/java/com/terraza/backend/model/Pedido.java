package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class Pedido {

    public static final String ABIERTO = "ABIERTO";

    private Long id;
    private Long sedeId;
    private Long mesaId;
    private Long usuarioId;
    private String usuarioNombre;
    private String estado;
    private BigDecimal total;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
    private List<DetallePedido> detalles = new ArrayList<>();
}
