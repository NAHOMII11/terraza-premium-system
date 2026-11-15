package com.terraza.backend.algorithm;

/** Umbral de inventario bajo para alertas de reposición. */
public final class LowStockAlgorithm {

    public static final int THRESHOLD = 5;

    private LowStockAlgorithm() {
    }

    public static boolean isLow(Integer stock) {
        return stock == null || stock <= THRESHOLD;
    }

    public static int countLow(Iterable<Integer> stocks) {
        int total = 0;
        if (stocks == null) {
            return 0;
        }
        for (Integer stock : stocks) {
            if (isLow(stock)) {
                total++;
            }
        }
        return total;
    }
}
