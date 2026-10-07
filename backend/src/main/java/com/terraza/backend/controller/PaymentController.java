package com.terraza.backend.controller;

import com.terraza.backend.dto.CreatePaymentDTO;
import com.terraza.backend.dto.InvoiceDTO;
import com.terraza.backend.dto.PaymentDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.security.UsuarioPrincipal;
import com.terraza.backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping({"/api/payments", "/api/pagos"})
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<PaymentDTO> registrar(
            @Valid @RequestBody CreatePaymentDTO request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.registrar(request, principal(authentication)));
    }

    @GetMapping("/api/invoices/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<InvoiceDTO> generarFactura(
            @PathVariable Long orderId,
            Authentication authentication) {
        return ResponseEntity.ok(paymentService.generarFactura(orderId, principal(authentication)));
    }

    private UsuarioPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal usuario)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Autenticación requerida");
        }
        return usuario;
    }
}
