package org.revature.revconnect.interactionservice.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "post-service")
public interface PostServiceClient {

    @GetMapping("/api/posts/{postId}")
    ApiResponse<Map<String, Object>> getPost(@PathVariable("postId") Long postId);

    @GetMapping("/api/posts/user/{userId}")
    ApiResponse<Map<String, Object>> getUserPosts(@PathVariable("userId") Long userId,
            @RequestParam("page") int page, @RequestParam("size") int size);

    @Data
    class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }
}
