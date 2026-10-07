package com.terraza.backend.dto;

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
public class InvoiceDTO {

    private Long pedidoId;
    private Long sedeId;
    private String sedeNombre;
    private Long mesaId;
    private Integer mesaNumero;
    private String meseroNombre;
    private String estado;
    private BigDecimal total;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;
    private List<InvoiceLineDTO> detalles = new ArrayList<>();
    private InvoicePaymentDTO pago;
}
