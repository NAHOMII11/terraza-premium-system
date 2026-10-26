package com.terraza.backend.dto;

import com.terraza.backend.model.ProductType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductTypeDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name is too long")
    private String nombre;

    @Size(max = 255, message = "Description is too long")
    private String descripcion;

    public static ProductTypeDTO from(ProductType productType) {
        ProductTypeDTO dto = new ProductTypeDTO();
        dto.setId(productType.getId());
        dto.setNombre(productType.getNombre());
        dto.setDescripcion(productType.getDescripcion());
        return dto;
    }
}
