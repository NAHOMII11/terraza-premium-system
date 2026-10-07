package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class Payment {

    public static final String EFECTIVO = "EFECTIVO";
    public static final String TARJETA_CREDITO = "TARJETA_CREDITO";
    public static final String TARJETA_DEBITO = "TARJETA_DEBITO";

    private Long id;
    private Long pedidoId;
    private Long cajeroId;
    private String cajeroNombre;
    private String metodoPago;
    private BigDecimal monto;
    private BigDecimal cambio;
    private LocalDateTime fechaPago;
}
