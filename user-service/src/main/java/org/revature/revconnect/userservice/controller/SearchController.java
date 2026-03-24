package org.revature.revconnect.userservice.controller;

import org.revature.revconnect.userservice.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.revature.revconnect.userservice.client.PostServiceClient;
import org.revature.revconnect.userservice.service.UserService;
import org.springframework.data.domain.PageRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Search", description = "Advanced Search APIs")
public class SearchController {
    
    private final UserService userService;
    private final PostServiceClient postServiceClient;

    @GetMapping("/all")
    @Operation(summary = "Search across all content types")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchAll(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {
        log.info("Global search for: {}", query);
        Map<String, Object> results = new HashMap<>();
        
        results.put("users", userService.searchUsers(query, PageRequest.of(0, limit)));
        
        try {
            PostServiceClient.ApiResponse<PostServiceClient.PagedResponse<Map<String, Object>>> postRes = 
                postServiceClient.searchPosts(query, 0, limit);
            if (postRes != null && postRes.isSuccess()) {
                results.put("posts", postRes.getData());
            } else {
                results.put("posts", Map.of("content", List.of()));
            }
        } catch (Exception e) {
            log.error("Error searching posts", e);
            results.put("posts", Map.of("content", List.of()));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }

    @GetMapping("/users")
    @Operation(summary = "Search users")
    public ResponseEntity<ApiResponse<Object>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Searching users: {}", query);
        return ResponseEntity.ok(ApiResponse.success("Users", userService.searchUsers(query, PageRequest.of(page, size))));
    }

    @GetMapping("/posts")
    @Operation(summary = "Search posts")
    public ResponseEntity<ApiResponse<Object>> searchPosts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Searching posts: {}", query);
        try {
            PostServiceClient.ApiResponse<PostServiceClient.PagedResponse<Map<String, Object>>> postRes = 
                postServiceClient.searchPosts(query, page, size);
            if (postRes != null && postRes.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success("Posts", postRes.getData()));
            }
        } catch (Exception e) {
            log.error("Error searching posts", e);
        }
        return ResponseEntity.ok(ApiResponse.success("Posts", List.of()));
    }

    @GetMapping("/posts/advanced")
    @Operation(summary = "Advanced post search with filters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> advancedPostSearch(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String postType,
            @RequestParam(required = false) Integer minLikes,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Advanced post search");
        return ResponseEntity.ok(ApiResponse.success("Advanced posts", List.of()));
    }

    @GetMapping("/users/advanced")
    @Operation(summary = "Advanced user search with filters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> advancedUserSearch(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Advanced user search");
        return ResponseEntity.ok(ApiResponse.success("Advanced users", List.of()));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent searches")
    public ResponseEntity<ApiResponse<List<String>>> getRecentSearches() {
        log.info("Getting recent searches");
        return ResponseEntity.ok(ApiResponse.success("Recent searches", List.of()));
    }

    @DeleteMapping("/recent")
    @Operation(summary = "Clear recent searches")
    public ResponseEntity<ApiResponse<Void>> clearRecentSearches() {
        log.info("Clearing recent searches");
        return ResponseEntity.ok(ApiResponse.success("Recent searches cleared", null));
    }

    @DeleteMapping("/recent/{query}")
    @Operation(summary = "Remove a specific recent search")
    public ResponseEntity<ApiResponse<Void>> removeRecentSearch(@PathVariable String query) {
        log.info("Removing recent search: {}", query);
        return ResponseEntity.ok(ApiResponse.success("Search removed", null));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Get search suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getSearchSuggestions(
            @RequestParam String query) {
        log.info("Getting suggestions for: {}", query);
        return ResponseEntity.ok(ApiResponse.success("Suggestions", List.of()));
    }

    @GetMapping("/trending")
    @Operation(summary = "Get trending searches")
    public ResponseEntity<ApiResponse<List<String>>> getTrendingSearches() {
        log.info("Getting trending searches");
        return ResponseEntity.ok(ApiResponse.success("Trending", List.of()));
    }
}
