package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Mesa {

    public static final String DISPONIBLE = "DISPONIBLE";
    public static final String OCUPADA = "OCUPADA";

    private Long id;
    private Integer numero;
    private Integer capacidad;
    private Long sedeId;
    private String estado;
    private Boolean activo;
}
