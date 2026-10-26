package com.terraza.backend.dto;

import com.terraza.backend.model.Supplier;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SupplierDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name is too long")
    private String nombre;

    @Size(max = 30, message = "NIT is too long")
    private String nit;

    @Size(max = 100, message = "Contact name is too long")
    private String contacto;

    @Size(max = 30, message = "Phone number is too long")
    private String telefono;

    @Email(message = "Email is not valid")
    @Size(max = 150, message = "Email is too long")
    private String email;

    @Size(max = 255, message = "Address is too long")
    private String direccion;

    public static SupplierDTO from(Supplier supplier) {
        SupplierDTO dto = new SupplierDTO();
        dto.setId(supplier.getId());
        dto.setNombre(supplier.getNombre());
        dto.setNit(supplier.getNit());
        dto.setContacto(supplier.getContacto());
        dto.setTelefono(supplier.getTelefono());
        dto.setEmail(supplier.getEmail());
        dto.setDireccion(supplier.getDireccion());
        return dto;
    }
}
