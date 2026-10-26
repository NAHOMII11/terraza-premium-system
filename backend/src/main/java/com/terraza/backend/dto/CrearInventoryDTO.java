package com.terraza.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearInventoryDTO {

    @NotNull(message = "Branch is required")
    private Long sedeId;

    @NotNull(message = "Product is required")
    private Long productoId;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;
}
