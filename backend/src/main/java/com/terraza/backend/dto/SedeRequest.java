package com.terraza.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SedeRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre es demasiado largo")
    private String nombre;

    @Size(max = 255, message = "La dirección es demasiado larga")
    private String direccion;

    @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,30}$", message = "El teléfono no es válido")
    private String telefono;
}
