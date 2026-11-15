package com.terraza.backend.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Mochila 0/1. El presupuesto de reposición es la capacidad;
 * el costo de compra es el peso; el margen es el valor.
 */
public final class KnapsackAlgorithm {

    public record Item(Long id, String name, int weight, int value) {
    }

    public record Result(int totalWeight, int totalValue, List<Item> chosen) {
    }

    private KnapsackAlgorithm() {
    }

    public static Result pack(List<Item> items, int capacity) {
        if (items == null || items.isEmpty() || capacity < 1) {
            return new Result(0, 0, List.of());
        }
        int scale = capacity > 50_000 ? 100 : 1;
        int cap = Math.max(1, capacity / scale);
        int n = items.size();
        int[] weight = new int[n];
        int[] value = new int[n];
        for (int i = 0; i < n; i++) {
            weight[i] = Math.max(1, items.get(i).weight() / scale);
            value[i] = Math.max(0, items.get(i).value());
        }
        int[][] dp = new int[n + 1][cap + 1];
        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= cap; w++) {
                dp[i][w] = dp[i - 1][w];
                if (weight[i - 1] <= w) {
                    dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weight[i - 1]] + value[i - 1]);
                }
            }
        }
        List<Item> chosen = new ArrayList<>();
        int w = cap;
        for (int i = n; i >= 1; i--) {
            if (dp[i][w] != dp[i - 1][w]) {
                chosen.add(items.get(i - 1));
                w -= weight[i - 1];
            }
        }
        Collections.reverse(chosen);
        int totalWeight = 0;
        int totalValue = 0;
        for (Item item : chosen) {
            totalWeight += item.weight();
            totalValue += item.value();
        }
        return new Result(totalWeight, totalValue, List.copyOf(chosen));
    }
}
