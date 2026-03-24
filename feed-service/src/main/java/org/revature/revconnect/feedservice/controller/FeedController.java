package org.revature.revconnect.feedservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.feedservice.client.ConnectionServiceClient;
import org.revature.revconnect.feedservice.client.PostServiceClient;
import org.revature.revconnect.feedservice.dto.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts/feed")
@RequiredArgsConstructor
@Slf4j
public class FeedController {

    private final PostServiceClient postServiceClient;
    private final ConnectionServiceClient connectionServiceClient;

    // Root feed endpoint — reads userId from gateway-injected X-User-Id header
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getFeed(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "-1") Long userId,
            Pageable pageable) {
        if (userId > 0) {
            List<Long> followingIds = connectionServiceClient.getFollowingIds(userId);
            // Create a mutable copy and add the current user's ID to include their own posts in the feed
            java.util.List<Long> idsToFetch = new java.util.ArrayList<>(followingIds);
            idsToFetch.add(userId);
            return ResponseEntity.ok(postServiceClient.getFeedPosts(idsToFetch, pageable));
        }
        return ResponseEntity.ok(postServiceClient.getAllPosts(pageable));
    }

    @GetMapping("/personalized")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getPersonalizedFeed(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "-1") Long userId,
            Pageable pageable) {
        log.info("Get personalized feed request for user ID: {}", userId);
        if (userId > 0) {
            List<Long> followingIds = connectionServiceClient.getFollowingIds(userId);
            java.util.List<Long> idsToFetch = new java.util.ArrayList<>(followingIds);
            idsToFetch.add(userId);
            return ResponseEntity.ok(postServiceClient.getFeedPosts(idsToFetch, pageable));
        }
        return ResponseEntity.ok(postServiceClient.getTrendingPosts(pageable));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getUserFeed(
            @PathVariable Long userId, Pageable pageable) {
        log.info("Get specific user feed for ID: {}", userId);
        return ResponseEntity.ok(postServiceClient.getPostsByUserId(userId, pageable));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getTrendingFeed(Pageable pageable) {
        return ResponseEntity.ok(postServiceClient.getTrendingPosts(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> searchFeed(
            @RequestParam String query, Pageable pageable) {
        return ResponseEntity.ok(postServiceClient.searchPosts(query, pageable));
    }

    @GetMapping("/explore")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getExploreFeed(Pageable pageable) {
        return ResponseEntity.ok(postServiceClient.getTrendingPosts(pageable));
    }
}
