package com.terraza.backend.controller;

import com.terraza.backend.algorithm.HanoiAlgorithm;
import com.terraza.backend.dto.HanoiPlanDTO;
import com.terraza.backend.dto.QaStatusDTO;
import com.terraza.backend.service.QaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class QaController {

    private final QaService qaService;

    @GetMapping("/api/qa/status")
    @PreAuthorize("hasRole('ADMIN')")
    public QaStatusDTO status() {
        return qaService.status();
    }

    @GetMapping("/api/qa/hanoi")
    @PreAuthorize("hasRole('ADMIN')")
    public HanoiPlanDTO hanoi(@RequestParam(defaultValue = "3") int crates) {
        int disks = Math.min(Math.max(crates, 1), 8);
        return HanoiPlanDTO.builder()
                .crates(disks)
                .minimumMoves(HanoiAlgorithm.minimumMoves(disks))
                .from("Galerías")
                .aux("Zona T")
                .to("La 85")
                .moves(HanoiAlgorithm.plan(disks, "Galerías", "Zona T", "La 85"))
                .build();
    }
}
