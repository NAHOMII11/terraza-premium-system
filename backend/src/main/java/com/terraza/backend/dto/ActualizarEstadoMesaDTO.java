package com.terraza.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActualizarEstadoMesaDTO {

    @NotNull(message = "Status is required")
    @Pattern(regexp = "DISPONIBLE|OCUPADA", message = "Status must be DISPONIBLE or OCUPADA")
    private String estado;
}
