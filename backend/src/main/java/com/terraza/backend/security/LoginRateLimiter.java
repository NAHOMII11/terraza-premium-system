package com.terraza.backend.security;

import com.terraza.backend.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** OWASP A07: limita reintentos de login por correo. */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 8;
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public void check(String email) {
        String key = email == null ? "" : email.toLowerCase();
        long now = Instant.now().toEpochMilli();
        Deque<Long> stamps = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (stamps) {
            while (!stamps.isEmpty() && now - stamps.peekFirst() > WINDOW_MS) {
                stamps.pollFirst();
            }
            if (stamps.size() >= MAX_ATTEMPTS) {
                throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Try again later.");
            }
        }
    }

    public void recordFailure(String email) {
        String key = email == null ? "" : email.toLowerCase();
        long now = Instant.now().toEpochMilli();
        Deque<Long> stamps = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (stamps) {
            stamps.addLast(now);
        }
    }

    public void clear(String email) {
        if (email != null) {
            attempts.remove(email.toLowerCase());
        }
    }
}
