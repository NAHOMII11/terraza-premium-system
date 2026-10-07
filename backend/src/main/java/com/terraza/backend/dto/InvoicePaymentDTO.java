package com.terraza.backend.dto;

import com.terraza.backend.model.Payment;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class InvoicePaymentDTO {

    private final Long id;
    private final String metodoPago;
    private final BigDecimal monto;
    private final BigDecimal cambio;
    private final Long cajeroId;
    private final String cajeroNombre;
    private final LocalDateTime fechaPago;

    public static InvoicePaymentDTO from(Payment payment) {
        return InvoicePaymentDTO.builder()
                .id(payment.getId())
                .metodoPago(payment.getMetodoPago())
                .monto(payment.getMonto())
                .cambio(payment.getCambio())
                .cajeroId(payment.getCajeroId())
                .cajeroNombre(payment.getCajeroNombre())
                .fechaPago(payment.getFechaPago())
                .build();
    }
}
