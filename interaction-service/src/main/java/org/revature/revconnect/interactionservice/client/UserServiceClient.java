package org.revature.revconnect.interactionservice.client;

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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class UserResponse {
        private Long id;
        private String username;
        private String name;
        private String profilePicture;
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
