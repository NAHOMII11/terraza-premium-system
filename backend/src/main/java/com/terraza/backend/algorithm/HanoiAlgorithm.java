package com.terraza.backend.algorithm;

import java.util.ArrayList;
import java.util.List;

/**
 * Torres de Hanoi. Las tres torres son las tres sedes del bar.
 * Solo calcula el plan de traslados; no mueve stock.
 */
public final class HanoiAlgorithm {

    public record Move(int step, int disk, String from, String aux, String to) {
    }

    private HanoiAlgorithm() {
    }

    public static List<Move> plan(int disks, String from, String aux, String to) {
        if (disks < 1) {
            return List.of();
        }
        int limited = Math.min(disks, 8);
        List<Move> moves = new ArrayList<>();
        solve(limited, from, aux, to, moves);
        return moves;
    }

    public static int minimumMoves(int disks) {
        int limited = Math.max(0, Math.min(disks, 8));
        return (1 << limited) - 1;
    }

    private static void solve(int disk, String from, String aux, String to, List<Move> moves) {
        if (disk == 1) {
            moves.add(new Move(moves.size() + 1, disk, from, aux, to));
            return;
        }
        solve(disk - 1, from, to, aux, moves);
        moves.add(new Move(moves.size() + 1, disk, from, aux, to));
        solve(disk - 1, aux, from, to, moves);
    }
}
