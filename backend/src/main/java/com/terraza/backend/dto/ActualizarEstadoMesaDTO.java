package com.terraza.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActualizarEstadoMesaDTO {

    @NotNull(message = "El estado es obligatorio")
    @Pattern(regexp = "DISPONIBLE|OCUPADA", message = "El estado debe ser DISPONIBLE u OCUPADA")
    private String estado;
}
