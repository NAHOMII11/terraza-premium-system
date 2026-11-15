package com.terraza.backend.dto;

import com.terraza.backend.algorithm.HanoiAlgorithm;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class HanoiPlanDTO {
    private final int crates;
    private final int minimumMoves;
    private final String from;
    private final String aux;
    private final String to;
    private final List<HanoiAlgorithm.Move> moves;
}
