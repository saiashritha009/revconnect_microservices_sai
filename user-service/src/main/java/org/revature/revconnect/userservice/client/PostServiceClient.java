package org.revature.revconnect.userservice.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "post-service")
public interface PostServiceClient {

    @GetMapping("/api/posts/search")
    ApiResponse<PagedResponse<Map<String, Object>>> searchPosts(
            @RequestParam("query") String query,
            @RequestParam("page") int page,
            @RequestParam("size") int size);

    @Data
    class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }

    @Data
    class PagedResponse<T> {
        private List<T> content;
        private int totalPages;
        private long totalElements;
        private int size;
        private int number;
    }
}
