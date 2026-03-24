package org.revature.revconnect.postservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.postservice.dto.request.PostRequest;
import org.revature.revconnect.postservice.dto.response.ApiResponse;
import org.revature.revconnect.postservice.dto.response.PostResponse;
import org.revature.revconnect.postservice.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody PostRequest request) {
        log.info("Create post request for user: {} | content={} ctaLabel={} ctaUrl={} postType={}", userId,
                request.getContent(), request.getCtaLabel(), request.getCtaUrl(), request.getPostType());
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Post created", postService.createPost(userId, request)));
        } catch (Exception e) {
            log.error("Error creating post for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create post: " + e.getMessage()));
        }
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable Long postId) {
        log.info("Get post request for ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Post found", postService.getPostById(postId)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getMyPosts(
            @RequestHeader("X-User-Id") Long userId, Pageable pageable) {
        log.info("Get my posts request");
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getPostsByUserId(userId, pageable)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getUserPosts(
            @PathVariable Long userId, Pageable pageable) {
        log.info("Get posts for user ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getPostsByUserId(userId, pageable)));
    }

    @GetMapping("/user/{userId}/liked")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getUserLikedPosts(
            @PathVariable Long userId, Pageable pageable) {
        log.info("Get liked posts for user ID: {}", userId);
        // Placeholder implementation
        return ResponseEntity.ok(ApiResponse.success("Success", Page.empty(pageable)));
    }

    @GetMapping("/user/{userId}/media")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getUserMediaPosts(
            @PathVariable Long userId, Pageable pageable) {
        log.info("Get media posts for user ID: {}", userId);
        // Placeholder implementation
        return ResponseEntity.ok(ApiResponse.success("Success", Page.empty(pageable)));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getFeedPosts(
            @RequestParam List<Long> followingIds, Pageable pageable) {
        log.info("Get feed posts request");
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getFeedPosts(followingIds, pageable)));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getTrendingPosts(Pageable pageable) {
        log.info("Get trending posts request");
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getTrendingPosts(pageable)));
    }

    @GetMapping("/feed/personalized")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPersonalizedFeed(
            @RequestHeader("X-User-Id") Long userId,
            Pageable pageable) {
        log.info("Get personalized feed request for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getPersonalizedFeed(userId, pageable)));
    }

    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getPostsByIds(@RequestParam List<Long> ids) {
        log.info("Batch get posts by IDs: {}", ids);
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getPostsByIds(ids)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> searchPosts(@RequestParam String query, Pageable pageable) {
        log.info("Search posts request: {}", query);
        return ResponseEntity.ok(ApiResponse.success("Success", postService.searchPosts(query, pageable)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getAllPosts(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Success", postService.getAllPosts(pageable)));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long postId, @RequestBody PostRequest request) {
        log.info("Update post request for ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Post updated", postService.updatePost(postId, request)));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long postId) {
        log.info("Delete post request for ID: {}", postId);
        postService.deletePost(postId);
        return ResponseEntity.ok(ApiResponse.success("Post deleted successfully", null));
    }

    @PatchMapping("/{postId}/pin")
    public ResponseEntity<ApiResponse<PostResponse>> togglePinPost(@PathVariable Long postId) {
        log.info("Toggle pin request for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Post updated", postService.togglePin(postId)));
    }

    @PostMapping("/{postId}/cta")
    public ResponseEntity<ApiResponse<PostResponse>> setPostCta(
            @PathVariable Long postId,
            @RequestParam String label,
            @RequestParam String url) {
        log.info("Set CTA for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("CTA set", postService.getPostById(postId)));
    }

    @DeleteMapping("/{postId}/cta")
    public ResponseEntity<ApiResponse<PostResponse>> clearPostCta(@PathVariable Long postId) {
        log.info("Clear CTA for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("CTA removed", postService.getPostById(postId)));
    }

    @PatchMapping("/{postId}/product-tags")
    public ResponseEntity<Map<String, Object>> setProductTags(
            @PathVariable Long postId,
            @RequestParam List<String> tags) {
        log.info("Set product tags for post ID: {}", postId);
        return ResponseEntity.ok(Map.of("postId", postId, "tags", tags));
    }

    @GetMapping("/{postId}/metadata")
    public ResponseEntity<Map<String, Object>> getPostMetadata(@PathVariable Long postId) {
        log.info("Get metadata for post ID: {}", postId);
        return ResponseEntity.ok(Map.of("postId", postId));
    }

    @PostMapping("/schedule")
    public ResponseEntity<ApiResponse<PostResponse>> schedulePost(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody PostRequest request) {
        log.info("Schedule post request for user: {} | content={} scheduledAt={} ctaLabel={} ctaUrl={} postType={} isPromotional={} partnerName={} productTags={}",
                userId, request.getContent(), request.getScheduledAt(), request.getCtaLabel(),
                request.getCtaUrl(), request.getPostType(), request.getIsPromotional(),
                request.getPartnerName(), request.getProductTags());
        try {
            PostResponse response = postService.createPost(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Post scheduled", response));
        } catch (Exception e) {
            log.error("Error scheduling post for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to schedule post: " + e.getMessage()));
        }
    }

    @GetMapping("/schedule/me")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getMyScheduledPosts(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get my scheduled posts for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Scheduled posts", postService.getScheduledPosts(userId)));
    }
}
