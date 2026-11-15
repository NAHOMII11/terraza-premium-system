package com.terraza.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class KnapsackPlanDTO {
    private final int budget;
    private final int totalCost;
    private final int totalMargin;
    private final List<Item> items;

    @Getter
    @Builder
    public static class Item {
        private final Long productoId;
        private final String nombre;
        private final int cost;
        private final int margin;
    }
}
