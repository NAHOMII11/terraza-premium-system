package com.terraza.backend.dto;

import com.terraza.backend.model.Inventory;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InventoryDTO {

    private final Long id;
    private final Long productoId;
    private final String nombreProducto;
    private final String codigoProducto;
    private final Long sedeId;
    private final Integer stock;

    public String getProductoNombre() {
        return nombreProducto;
    }

    public Integer getCantidad() {
        return stock;
    }

    public static InventoryDTO from(Inventory inventory) {
        return InventoryDTO.builder()
                .id(inventory.getId())
                .productoId(inventory.getProductoId())
                .nombreProducto(inventory.getNombreProducto())
                .codigoProducto(inventory.getCodigoProducto())
                .sedeId(inventory.getSedeId())
                .stock(inventory.getStock())
                .build();
    }
}
