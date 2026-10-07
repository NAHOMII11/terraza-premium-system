package com.terraza.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearInventoryDTO {

    @NotNull(message = "La sede es obligatoria")
    private Long sedeId;

    @NotNull(message = "El producto es obligatorio")
    private Long productoId;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock;
}
