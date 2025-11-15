package com.example.teamdev.service;

import com.example.teamdev.mapper.EmployeeMapper;
import com.example.teamdev.entity.StampRequest;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class StampRequestQueryService {

    private final StampRequestStore store;
    private final EmployeeMapper employeeMapper;

    public StampRequestQueryService(StampRequestStore store, EmployeeMapper employeeMapper) {
        this.store = store;
        this.employeeMapper = employeeMapper;
    }

    public List<StampRequest> getEmployeeRequests(
        Integer employeeId,
        String status,
        Integer page,
        Integer size
    ) {
        String normalizedStatus = normalizeStatus(status);
        int safePage = Math.max(page != null ? page : 0, 0);
        int safeSize = size != null && size > 0 ? size : 20;

        return store.findAll().stream()
            .filter(request -> Objects.equals(request.getEmployeeId(), employeeId))
            .filter(request -> shouldIncludeStatus(request, normalizedStatus))
            .sorted(Comparator.comparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .skip((long) safePage * safeSize)
            .limit(safeSize)
            .toList();
    }

    public Integer countEmployeeRequests(Integer employeeId, String status) {
        String normalizedStatus = normalizeStatus(status);
        return (int) store.findAll().stream()
            .filter(request -> Objects.equals(request.getEmployeeId(), employeeId))
            .filter(request -> shouldIncludeStatus(request, normalizedStatus))
            .count();
    }

    public List<StampRequest> getPendingRequests(
        Integer page,
        Integer size,
        String status,
        String search,
        String sort
    ) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSearch = normalizeSearch(search);
        int safePage = Math.max(page != null ? page : 0, 0);
        int safeSize = size != null && size > 0 ? size : 20;
        Comparator<StampRequest> comparator = comparatorForSort(sort);
        Map<Integer, String> nameCache = new HashMap<>();

        return store.findAll().stream()
            .filter(request -> shouldIncludeStatus(request, normalizedStatus))
            .filter(request -> matchesSearch(request, normalizedSearch, nameCache))
            .sorted(comparator)
            .skip((long) safePage * safeSize)
            .limit(safeSize)
            .toList();
    }

    public Integer countPendingRequests(String status, String search) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSearch = normalizeSearch(search);
        Map<Integer, String> nameCache = new HashMap<>();

        return (int) store.findAll().stream()
            .filter(request -> shouldIncludeStatus(request, normalizedStatus))
            .filter(request -> matchesSearch(request, normalizedSearch, nameCache))
            .count();
    }

    public Optional<StampRequest> getRequestDetail(Integer requestId) {
        return store.findById(requestId);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        return status.toUpperCase(Locale.ROOT);
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String trimmed = search.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private Comparator<StampRequest> comparatorForSort(String sort) {
        String normalized = sort == null ? "recent" : sort.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "oldest" -> Comparator.comparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "status" -> Comparator.comparing(StampRequest::getStatus, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
            default -> Comparator.comparing(StampRequest::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        };
    }

    private boolean shouldIncludeStatus(StampRequest request, String normalizedStatus) {
        if (normalizedStatus == null) {
            return true;
        }
        String requestStatus = request.getStatus();
        return normalizedStatus.equals(requestStatus);
    }

    private boolean matchesSearch(
        StampRequest request,
        String normalizedSearch,
        Map<Integer, String> nameCache
    ) {
        if (normalizedSearch == null) {
            return true;
        }
        if (request.getReason() != null && request.getReason().toLowerCase(Locale.ROOT).contains(normalizedSearch)) {
            return true;
        }
        if (request.getId() != null && request.getId().toString().contains(normalizedSearch)) {
            return true;
        }
        String name = resolveEmployeeName(request.getEmployeeId(), nameCache);
        return name != null && name.contains(normalizedSearch);
    }

    private String resolveEmployeeName(Integer employeeId, Map<Integer, String> nameCache) {
        if (employeeId == null) {
            return null;
        }
        return nameCache.computeIfAbsent(employeeId, id -> employeeMapper.getById(id)
            .map(employee -> "%s %s".formatted(employee.getFirstName(), employee.getLastName()))
            .orElse(null));
    }
}
