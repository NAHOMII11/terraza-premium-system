package com.terraza.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class PaymentDTO {

    private final String mensaje;
    private final BigDecimal cambio;
}
