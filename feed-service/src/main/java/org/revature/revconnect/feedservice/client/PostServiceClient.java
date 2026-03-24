package org.revature.revconnect.feedservice.client;

import org.revature.revconnect.feedservice.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "post-service")
public interface PostServiceClient {

    @GetMapping("/api/posts/feed")
    ApiResponse<Page<Map<String, Object>>> getFeedPosts(@RequestParam List<Long> followingIds, Pageable pageable);

    @GetMapping("/api/posts/trending")
    ApiResponse<Page<Map<String, Object>>> getTrendingPosts(Pageable pageable);

    @GetMapping("/api/posts/search")
    ApiResponse<Page<Map<String, Object>>> searchPosts(@RequestParam String query, Pageable pageable);

    @GetMapping("/api/posts")
    ApiResponse<Page<Map<String, Object>>> getAllPosts(Pageable pageable);

    @GetMapping("/api/posts/user/{userId}")
    ApiResponse<Page<Map<String, Object>>> getPostsByUserId(@PathVariable("userId") Long userId, Pageable pageable);
}
