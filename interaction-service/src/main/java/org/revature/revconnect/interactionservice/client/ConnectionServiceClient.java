package org.revature.revconnect.interactionservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "connection-service")
public interface ConnectionServiceClient {

    @GetMapping("/api/users/{userId}/connection-stats")
    ApiResponse<Map<String, Object>> getConnectionStats(@PathVariable Long userId);

    @GetMapping("/api/connections/{userId}/follower-ids")
    java.util.List<Long> getFollowerIds(@PathVariable Long userId);

    @lombok.Data
    class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }
}
