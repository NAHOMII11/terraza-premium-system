package com.terraza.backend.service;

import com.terraza.backend.repository.AuditoriaRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public void registrar(String operacion, String detalle) {
        Long usuarioId = null;
        Long sedeId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            usuarioId = principal.getUsuario().getId();
            sedeId = principal.getUsuario().getSedeId();
        }
        registrar(usuarioId, sedeId, operacion, detalle);
    }

    public void registrar(Long usuarioId, Long sedeId, String operacion, String detalle) {
        auditoriaRepository.insertar(usuarioId, operacion, limitar(detalle), ipCliente(), sedeId);
    }

    private String ipCliente() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            return request.getRemoteAddr();
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
