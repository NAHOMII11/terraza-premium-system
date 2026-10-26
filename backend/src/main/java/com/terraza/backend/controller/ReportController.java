package com.terraza.backend.controller;

import com.terraza.backend.dto.InventorySoldRow;
import com.terraza.backend.dto.SalesReportRow;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.security.UsuarioPrincipal;
import com.terraza.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/api/reports/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<List<SalesReportRow>> ventas(
            @RequestParam(required = false) Long sedeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.ventas(sedeId, from, to, principal(authentication)));
    }

    @GetMapping("/api/reports/inventory-sold")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAJERO')")
    public ResponseEntity<List<InventorySoldRow>> inventarioVendido(
            @RequestParam(required = false) Long sedeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.inventarioVendido(sedeId, from, to, principal(authentication)));
    }

    private UsuarioPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal usuario)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return usuario;
    }
}
