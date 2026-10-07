package com.terraza.backend.controller;

import com.terraza.backend.dto.ActualizarStockDTO;
import com.terraza.backend.dto.CrearInventoryDTO;
import com.terraza.backend.dto.InventoryDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.security.UsuarioPrincipal;
import com.terraza.backend.service.InventoryService;
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
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<List<InventoryDTO>> listarPorSede(
            @RequestParam Long sedeId,
            Authentication authentication) {
        return ResponseEntity.ok(inventoryService.listarPorSede(sedeId, principal(authentication)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<InventoryDTO> crear(
            @Valid @RequestBody CrearInventoryDTO request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryService.crear(request, principal(authentication)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<InventoryDTO> actualizarStock(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarStockDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(
                inventoryService.actualizarStock(id, request.getStock(), principal(authentication)));
    }

    private UsuarioPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal usuario)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Autenticación requerida");
        }
        return usuario;
    }
}
