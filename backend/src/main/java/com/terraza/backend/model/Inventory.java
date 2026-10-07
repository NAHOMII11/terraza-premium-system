package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Inventory {

    private Long id;
    private Long productoId;
    private String nombreProducto;
    private String codigoProducto;
    private Long sedeId;
    private Integer stock;
}
