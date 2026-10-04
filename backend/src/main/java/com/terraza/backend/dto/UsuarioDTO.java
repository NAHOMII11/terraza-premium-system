package com.terraza.backend.dto;

import com.terraza.backend.model.Usuario;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UsuarioDTO {

    private final Long id;
    private final String nombre;
    private final String email;
    private final Long rolId;
    private final String rol;
    private final String rolDescripcion;
    private final Long sedeId;
    private final String sede;
    private final Boolean activo;

    public static UsuarioDTO from(Usuario usuario) {
        return UsuarioDTO.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rolId(usuario.getRolId())
                .rol(usuario.getRolNombre())
                .rolDescripcion(usuario.getRolDescripcion())
                .sedeId(usuario.getSedeId())
                .sede(usuario.getSedeNombre())
                .activo(usuario.getActivo())
                .build();
    }
}
