package org.revature.revconnect.notificationservice.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/users/batch")
    ApiResponse<List<UserResponse>> getUsersByIds(@RequestParam("ids") List<Long> ids);

    @GetMapping("/api/settings/notifications/prefs/{userId}")
    ApiResponse<java.util.Map<String, Object>> getNotificationPrefs(@PathVariable("userId") Long userId);

    @Data
    class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }

    @Data
    class UserResponse {
        private Long id;
        private String username;
        private String name;
        private String profilePicture;
    }
}
