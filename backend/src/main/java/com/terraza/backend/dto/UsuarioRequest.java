package com.terraza.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name is too long")
    private String nombre;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is not valid")
    @Size(max = 150, message = "Email is too long")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Long rolId;

    @NotNull(message = "Branch is required")
    private Long sedeId;
}
