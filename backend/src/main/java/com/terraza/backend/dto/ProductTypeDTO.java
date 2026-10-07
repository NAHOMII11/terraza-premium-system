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

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre es demasiado largo")
    private String nombre;

    @Size(max = 255, message = "La descripción es demasiado larga")
    private String descripcion;

    public static ProductTypeDTO from(ProductType productType) {
        ProductTypeDTO dto = new ProductTypeDTO();
        dto.setId(productType.getId());
        dto.setNombre(productType.getNombre());
        dto.setDescripcion(productType.getDescripcion());
        return dto;
    }
}
