package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Supplier {

    private Long id;
    private String nombre;
    private String nit;
    private String contacto;
    private String telefono;
    private String email;
    private String direccion;
    private Boolean activo;
}
