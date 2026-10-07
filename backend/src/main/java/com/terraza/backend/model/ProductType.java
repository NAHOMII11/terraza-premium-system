package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProductType {

    private Long id;
    private String nombre;
    private String descripcion;
    private Boolean activo;
}
