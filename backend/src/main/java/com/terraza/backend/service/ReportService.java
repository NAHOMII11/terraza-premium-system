package com.terraza.backend.service;

import com.terraza.backend.dto.InventorySoldRow;
import com.terraza.backend.dto.SalesReportRow;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.repository.ReportRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;

    public List<SalesReportRow> ventas(Long sedeId, LocalDate from, LocalDate to, UsuarioPrincipal principal) {
        return reportRepository.ventas(sedePermitida(sedeId, principal), from, to);
    }

    public List<InventorySoldRow> inventarioVendido(Long sedeId, LocalDate from, LocalDate to, UsuarioPrincipal principal) {
        return reportRepository.inventarioVendido(sedePermitida(sedeId, principal), from, to);
    }

    private Long sedePermitida(Long sedeId, UsuarioPrincipal principal) {
        if ("ADMIN".equals(principal.getUsuario().getRolNombre())) {
            return sedeId;
        }
        Long sedeUsuario = principal.getUsuario().getSedeId();
        if (sedeUsuario == null) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot view reports from another branch");
        }
        if (sedeId != null && !sedeUsuario.equals(sedeId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot view reports from another branch");
        }
        return sedeUsuario;
    }
}
