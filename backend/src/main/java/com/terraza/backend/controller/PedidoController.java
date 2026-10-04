package com.terraza.backend.controller;

import com.terraza.backend.dto.PedidoRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Pedido;
import com.terraza.backend.security.UsuarioPrincipal;
import com.terraza.backend.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MESERO')")
    public ResponseEntity<Pedido> crear(@Valid @RequestBody PedidoRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pedidoService.crear(request, principal(authentication)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MESERO')")
    public Pedido actualizar(
            @PathVariable Long id,
            @Valid @RequestBody PedidoRequest request,
            Authentication authentication) {
        return pedidoService.actualizar(id, request, principal(authentication));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO', 'MESERO')")
    public List<Pedido> listar(@RequestParam Long sedeId, Authentication authentication) {
        return pedidoService.listarActivos(sedeId, principal(authentication));
    }

    private UsuarioPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Autenticación requerida");
        }
        return principal;
    }
}
