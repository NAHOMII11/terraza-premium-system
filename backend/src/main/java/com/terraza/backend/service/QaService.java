package com.terraza.backend.service;

import com.terraza.backend.dto.QaStatusDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class QaService {

    public static final LocalDate SUPPORT_START = LocalDate.of(2026, 11, 14);

    public QaStatusDTO status() {
        LocalDate end = SUPPORT_START.plusDays(90);
        long remaining = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), end));
        return QaStatusDTO.builder()
                .phaseIv("Quality control (weeks 10-11)")
                .phaseV("Technical warranty (90 days after delivery)")
                .supportStart(SUPPORT_START)
                .supportEnd(end)
                .supportDaysRemaining(remaining)
                .supportActive(!LocalDate.now().isAfter(end))
                .owasp(List.of(
                        item("A01", "Broken Access Control", "Controlled", "RBAC ADMIN / CAJERO / MESERO with @PreAuthorize"),
                        item("A02", "Cryptographic Failures", "Controlled", "BCrypt factor 12; passwords never stored in plain text"),
                        item("A03", "Injection", "Controlled", "JdbcTemplate with PreparedStatement"),
                        item("A04", "Insecure Design", "Controlled", "Layered architecture and business validations"),
                        item("A05", "Security Misconfiguration", "Controlled", "Security headers and CORS limited to Vite"),
                        item("A06", "Vulnerable Components", "Controlled", "Spring Boot 3.3 / Java 21"),
                        item("A07", "Identification Failures", "Controlled", "Session login, inactive-user block, login rate limit"),
                        item("A08", "Software Integrity", "Controlled", "CHECK constraints and @Valid DTOs"),
                        item("A09", "Logging Failures", "Controlled", "auditoria table for login, CRUD and denials"),
                        item("A10", "SSRF", "Controlled", "API does not call external URLs")))
                .algorithms(List.of(
                        algo("Merge sort", "Sorting", "Sales report ordered by closing date"),
                        algo("Greedy change-making", "Greedy", "Cash change with COP denominations"),
                        algo("0/1 knapsack", "Knapsack", "Restock plan: max margin under a purchase budget"),
                        algo("SHA-256", "Hash", "On-screen invoice integrity code (passwords stay BCrypt)"),
                        algo("Towers of Hanoi", "Recursion", "Crate-transfer plan among Galerías, Zona T and La 85")))
                .concurrencyNotes(List.of(
                        "Stock is locked with SELECT FOR UPDATE when creating or editing an order.",
                        "The payment closes the order in the same transaction and rejects a second payment.",
                        "JUnit covers concurrent change-making and response time of sort/search."))
                .build();
    }

    private static QaStatusDTO.OwaspItem item(String id, String title, String status, String evidence) {
        return QaStatusDTO.OwaspItem.builder()
                .id(id)
                .title(title)
                .status(status)
                .evidence(evidence)
                .build();
    }

    private static QaStatusDTO.AlgorithmItem algo(String name, String type, String usedIn) {
        return QaStatusDTO.AlgorithmItem.builder()
                .name(name)
                .type(type)
                .usedIn(usedIn)
                .build();
    }
}
