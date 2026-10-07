package com.terraza.backend.controller;

import com.terraza.backend.dto.ActualizarEstadoMesaDTO;
import com.terraza.backend.dto.MesaDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.security.UsuarioPrincipal;
import com.terraza.backend.service.MesaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class MesaController {

    private final MesaService mesaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO', 'MESERO')")
    public ResponseEntity<List<MesaDTO>> listarPorSede(
            @RequestParam Long sedeId,
            Authentication authentication) {
        return ResponseEntity.ok(mesaService.listarPorSede(sedeId, principal(authentication)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MESERO')")
    public ResponseEntity<MesaDTO> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoMesaDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(mesaService.actualizarEstado(id, request.getEstado(), principal(authentication)));
    }

    private UsuarioPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal usuario)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Autenticación requerida");
        }
        return usuario;
    }
}
