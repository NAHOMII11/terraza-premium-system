package com.terraza.backend.algorithm;

import com.terraza.backend.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Algoritmo voraz de cambio en COP. El efectivo puede superar el total;
 * la tarjeta debe coincidir exacto.
 */
public final class ChangeMakingAlgorithm {

    public static final int[] DENOMINATIONS = {
            100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000, 500, 200, 100, 50
    };

    public static final String EFECTIVO = "EFECTIVO";

    private ChangeMakingAlgorithm() {
    }

    public static BigDecimal change(String metodo, BigDecimal monto, BigDecimal total) {
        BigDecimal pagado = monto.setScale(2, RoundingMode.HALF_UP);
        BigDecimal esperado = total.setScale(2, RoundingMode.HALF_UP);
        if (EFECTIVO.equals(metodo)) {
            if (pagado.compareTo(esperado) < 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "The amount does not cover the order total");
            }
            return pagado.subtract(esperado);
        }
        if (pagado.compareTo(esperado) != 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Card amount must match the order total");
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    public static Map<Integer, Integer> breakdown(BigDecimal change) {
        Map<Integer, Integer> pieces = new LinkedHashMap<>();
        long remaining = change == null ? 0 : change.setScale(0, RoundingMode.HALF_UP).longValue();
        if (remaining < 0) {
            remaining = 0;
        }
        for (int coin : DENOMINATIONS) {
            int count = (int) (remaining / coin);
            pieces.put(coin, count);
            remaining -= (long) count * coin;
        }
        return pieces;
    }
}
