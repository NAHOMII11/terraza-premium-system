package com.terraza.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class SalesReportRow {
    private Long pedidoId;
    private LocalDateTime fecha;
    private String sede;
    private Integer mesa;
    private BigDecimal total;
    private String metodoPago;
    private String cajero;
}
