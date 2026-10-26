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

    @NotNull(message = "Branch is required")
    private Long sedeId;

    private Long mesaId;

    @NotEmpty(message = "The order must include at least one product")
    @Valid
    private List<DetallePedidoRequest> detalles;
}
