package org.revature.revconnect.connectionservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service")
public interface NotificationServiceClient {

    @PostMapping("/api/notifications")
    ApiResponse<Void> createNotification(@RequestBody NotificationRequest request);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class NotificationRequest {
        private Long userId;
        private String type; // FOLLOW, LIKE, COMMENT, etc.
        private String message;
        private Long referenceId;
        private Long actorId;
    }

    @Data
    class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }
}
