package com.terraza.backend.algorithm;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AlgorithmAndConcurrencyTest {

    record Item(long id, String code) {
    }

    @Test
    void binarySearchFindsSortedCode() {
        List<Item> items = BinarySearchAlgorithm.sortBy(
                List.of(new Item(2, "B02"), new Item(1, "A01"), new Item(3, "C03")),
                Item::code);
        assertEquals("B02", BinarySearchAlgorithm.find(items, "B02", Item::code).orElseThrow().code());
        assertTrue(BinarySearchAlgorithm.find(items, "Z99", Item::code).isEmpty());
    }

    @Test
    void mergeSortOrdersById() {
        List<Item> sorted = MergeSortAlgorithm.sort(
                List.of(new Item(3, "c"), new Item(1, "a"), new Item(2, "b")),
                Comparator.comparingLong(Item::id));
        assertEquals(List.of(1L, 2L, 3L), sorted.stream().map(Item::id).toList());
    }

    @Test
    void greedyChangeUsesCopDenominations() {
        BigDecimal change = ChangeMakingAlgorithm.change("EFECTIVO", new BigDecimal("50000"), new BigDecimal("37000"));
        assertEquals(new BigDecimal("13000.00"), change);
        Map<Integer, Integer> pieces = ChangeMakingAlgorithm.breakdown(change);
        assertEquals(1, pieces.get(10_000));
        assertEquals(1, pieces.get(2_000));
        assertEquals(1, pieces.get(1_000));
    }

    @Test
    void knapsackPicksBestMarginUnderBudget() {
        KnapsackAlgorithm.Result packed = KnapsackAlgorithm.pack(List.of(
                new KnapsackAlgorithm.Item(1L, "Wine", 40_000, 20_000),
                new KnapsackAlgorithm.Item(2L, "Beer", 10_000, 8_000),
                new KnapsackAlgorithm.Item(3L, "Gin", 30_000, 25_000)
        ), 40_000);
        assertEquals(33_000, packed.totalValue());
        assertEquals(List.of("Beer", "Gin"), packed.chosen().stream().map(KnapsackAlgorithm.Item::name).toList());
    }

    @Test
    void hanoiThreeCratesUseThreeBranches() {
        var moves = HanoiAlgorithm.plan(3, "Galerías", "Zona T", "La 85");
        assertEquals(7, moves.size());
        assertEquals(7, HanoiAlgorithm.minimumMoves(3));
        assertEquals("Galerías", moves.getFirst().from());
        assertEquals("La 85", moves.getLast().to());
    }

    @Test
    void sha256IsDeterministicAndOneWayLength() {
        String hash = Sha256Algorithm.digest("TP-0001|Galerías|40000");
        assertEquals(64, hash.length());
        assertEquals(hash, Sha256Algorithm.digest("TP-0001|Galerías|40000"));
        assertTrue(!hash.equals(Sha256Algorithm.digest("TP-0002|Galerías|40000")));
    }

    @Test
    void concurrentChangeMakingIsConsistent() throws InterruptedException {
        int workers = 32;
        ExecutorService pool = Executors.newFixedThreadPool(workers);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(workers);
        AtomicInteger ok = new AtomicInteger();
        for (int i = 0; i < workers; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    BigDecimal change = ChangeMakingAlgorithm.change(
                            "EFECTIVO",
                            new BigDecimal("100000"),
                            new BigDecimal("75500"));
                    if (new BigDecimal("24500.00").compareTo(change) == 0) {
                        ok.incrementAndGet();
                    }
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        long started = System.nanoTime();
        start.countDown();
        assertTrue(done.await(5, TimeUnit.SECONDS));
        long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
        pool.shutdownNow();
        assertEquals(workers, ok.get());
        assertTrue(elapsedMs < 2000, "Concurrent change-making exceeded 2s: " + elapsedMs);
    }

    @Test
    void mergeSortResponseTimeOnLargeList() {
        List<Integer> data = new ArrayList<>(20_000);
        for (int i = 20_000; i >= 1; i--) {
            data.add(i);
        }
        long started = System.nanoTime();
        List<Integer> sorted = MergeSortAlgorithm.sort(data, Integer::compareTo);
        long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
        assertEquals(1, sorted.getFirst());
        assertEquals(20_000, sorted.getLast());
        assertTrue(elapsedMs < 1500, "Merge sort of 20k items exceeded 1.5s: " + elapsedMs);
    }
}
