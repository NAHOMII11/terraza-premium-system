package com.terraza.backend.dto;

import com.terraza.backend.model.Mesa;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MesaDTO {

    private final Long id;
    private final Integer numero;
    private final Integer capacidad;
    private final Long sedeId;
    private final String estado;

    public static MesaDTO from(Mesa mesa) {
        return MesaDTO.builder()
                .id(mesa.getId())
                .numero(mesa.getNumero())
                .capacidad(mesa.getCapacidad())
                .sedeId(mesa.getSedeId())
                .estado(mesa.getEstado())
                .build();
    }
}
