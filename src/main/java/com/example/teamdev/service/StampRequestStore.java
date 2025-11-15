package com.example.teamdev.service;

import com.example.teamdev.entity.StampRequest;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 一時的に StampRequest を保持するインメモリストア。
 */
@Service
public class StampRequestStore {

    private final Clock clock;
    private final AtomicInteger idGenerator = new AtomicInteger(1000);
    private final Map<Integer, StampRequest> storage = new ConcurrentHashMap<>();

    public StampRequestStore(@Autowired(required = false) Clock clock) {
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    public StampRequest create(StampRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request must not be null");
        }
        int id = idGenerator.incrementAndGet();
        request.setId(id);
        OffsetDateTime now = now();
        request.setCreatedAt(now);
        request.setUpdatedAt(now);
        storage.put(id, request);
        return request;
    }

    public StampRequest save(StampRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request must not be null");
        }
        if (request.getId() == null) {
            return create(request);
        }
        storage.put(request.getId(), request);
        return request;
    }

    public Optional<StampRequest> findById(Integer id) {
        if (id == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(storage.get(id));
    }

    public List<StampRequest> findAll() {
        return new ArrayList<>(storage.values());
    }

    public OffsetDateTime now() {
        return OffsetDateTime.now(clock);
    }
}
