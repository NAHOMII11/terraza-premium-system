package com.terraza.backend.service;

import com.terraza.backend.repository.AuditoriaRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public void registrar(String accion, String entidad, Long entidadId, String detalle) {
        auditoriaRepository.insertar(actorId(), accion, entidad, entidadId, limitar(detalle));
    }

    private Long actorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            return principal.getUsuario().getId();
        }
        return null;
    }

    private String limitar(String detalle) {
        if (detalle == null) {
            return null;
        }
        String limpio = detalle.trim();
        return limpio.length() <= 500 ? limpio : limpio.substring(0, 500);
    }
}
