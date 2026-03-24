package org.revature.revconnect.connectionservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/users/batch")
    ApiResponse<List<UserResponse>> getUsersByIds(@RequestParam("ids") List<Long> ids);

    @GetMapping("/api/users/{userId}")
    ApiResponse<UserResponse> getUserById(@org.springframework.web.bind.annotation.PathVariable("userId") Long userId);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class UserResponse {
        private Long id;
        private String username;
        private String name;
        private String profilePicture;
        private String bio;
        private String privacy;
        private String userType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }
}
