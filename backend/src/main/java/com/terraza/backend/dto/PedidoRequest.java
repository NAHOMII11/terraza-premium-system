package com.terraza.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PedidoRequest {

    @NotNull(message = "La sede es obligatoria")
    private Long sedeId;

    private Long mesaId;

    @NotEmpty(message = "El pedido debe incluir al menos un producto")
    @Valid
    private List<DetallePedidoRequest> detalles;
}