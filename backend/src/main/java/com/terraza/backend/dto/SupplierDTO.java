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

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre es demasiado largo")
    private String nombre;

    @Size(max = 30, message = "El NIT es demasiado largo")
    private String nit;

    @Size(max = 100, message = "El contacto es demasiado largo")
    private String contacto;

    @Size(max = 30, message = "El teléfono es demasiado largo")
    private String telefono;

    @Email(message = "El correo no es válido")
    @Size(max = 150, message = "El correo es demasiado largo")
    private String email;

    @Size(max = 255, message = "La dirección es demasiado larga")
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
