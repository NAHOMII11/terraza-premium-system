package com.terraza.backend.algorithm;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Merge sort estable O(n log n) para reportes y catálogo. */
public final class MergeSortAlgorithm {

    private MergeSortAlgorithm() {
    }

    public static <T> List<T> sort(List<T> items, Comparator<T> comparator) {
        if (items == null || items.size() < 2) {
            return items == null ? List.of() : new ArrayList<>(items);
        }
        List<T> copy = new ArrayList<>(items);
        List<T> buffer = new ArrayList<>(copy);
        split(copy, buffer, 0, copy.size(), comparator);
        return copy;
    }

    private static <T> void split(List<T> data, List<T> buffer, int from, int to, Comparator<T> comparator) {
        int size = to - from;
        if (size < 2) {
            return;
        }
        int mid = from + (size / 2);
        split(data, buffer, from, mid, comparator);
        split(data, buffer, mid, to, comparator);
        merge(data, buffer, from, mid, to, comparator);
    }

    private static <T> void merge(
            List<T> data,
            List<T> buffer,
            int from,
            int mid,
            int to,
            Comparator<T> comparator) {
        int left = from;
        int right = mid;
        int dest = from;
        while (left < mid && right < to) {
            if (comparator.compare(data.get(left), data.get(right)) <= 0) {
                buffer.set(dest++, data.get(left++));
            } else {
                buffer.set(dest++, data.get(right++));
            }
        }
        while (left < mid) {
            buffer.set(dest++, data.get(left++));
        }
        while (right < to) {
            buffer.set(dest++, data.get(right++));
        }
        for (int i = from; i < to; i++) {
            data.set(i, buffer.get(i));
        }
    }
}
