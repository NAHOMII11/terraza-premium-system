package com.terraza.backend.algorithm;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

/**
 * Búsqueda binaria O(log n). La lista debe estar ordenada por la clave.
 */
public final class BinarySearchAlgorithm {

    private BinarySearchAlgorithm() {
    }

    public static <T, K extends Comparable<? super K>> Optional<T> find(
            List<T> sorted,
            K key,
            Function<T, K> keyOf) {
        if (sorted == null || key == null) {
            return Optional.empty();
        }
        int low = 0;
        int high = sorted.size() - 1;
        while (low <= high) {
            int mid = low + ((high - low) / 2);
            T candidate = sorted.get(mid);
            int cmp = key.compareTo(keyOf.apply(candidate));
            if (cmp == 0) {
                return Optional.of(candidate);
            }
            if (cmp < 0) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return Optional.empty();
    }

    public static <T, K extends Comparable<? super K>> List<T> sortBy(
            List<T> items,
            Function<T, K> keyOf) {
        return MergeSortAlgorithm.sort(items, Comparator.comparing(keyOf));
    }
}
