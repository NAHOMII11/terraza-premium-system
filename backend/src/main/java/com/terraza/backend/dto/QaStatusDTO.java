package com.terraza.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class QaStatusDTO {

    private final String phaseIv;
    private final String phaseV;
    private final LocalDate supportStart;
    private final LocalDate supportEnd;
    private final long supportDaysRemaining;
    private final boolean supportActive;
    private final List<OwaspItem> owasp;
    private final List<AlgorithmItem> algorithms;
    private final List<String> concurrencyNotes;

    @Getter
    @Builder
    public static class OwaspItem {
        private final String id;
        private final String title;
        private final String status;
        private final String evidence;
    }

    @Getter
    @Builder
    public static class AlgorithmItem {
        private final String name;
        private final String type;
        private final String usedIn;
    }
}
