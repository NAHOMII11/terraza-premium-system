package com.terraza.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SedeRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name is too long")
    private String nombre;

    @Size(max = 255, message = "Address is too long")
    private String direccion;

    @Size(max = 100, message = "City is too long")
    private String ciudad;

    @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,30}$", message = "Phone number is not valid")
    private String telefono;

    @Min(value = 1, message = "Enter at least 1 table")
    @Max(value = 40, message = "Maximum 40 tables")
    private Integer mesas;
}
