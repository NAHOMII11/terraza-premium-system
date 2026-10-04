package com.terraza.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EstadoActivoRequest {

    @NotNull(message = "El estado activo es obligatorio")
    private Boolean activo;
}
