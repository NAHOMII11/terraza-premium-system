package com.terraza.backend.algorithm;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.function.Function;

/** Suma de subtotales de un pedido con redondeo bancario a 2 decimales. */
public final class OrderTotalAlgorithm {

    private OrderTotalAlgorithm() {
    }

    public static <T> BigDecimal total(List<T> lines, Function<T, BigDecimal> subtotalOf) {
        if (lines == null || lines.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (T line : lines) {
            BigDecimal part = subtotalOf.apply(line);
            if (part != null) {
                sum = sum.add(part);
            }
        }
        return sum.setScale(2, RoundingMode.HALF_UP);
    }
}
