package org.revature.revconnect.userservice.controller;

import org.revature.revconnect.userservice.dto.request.BusinessProfileRequest;
import org.revature.revconnect.userservice.dto.response.ApiResponse;
import org.revature.revconnect.userservice.enums.BusinessCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/business")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Business", description = "Business Profile and Analytics APIs")
public class BusinessController {

    private static final ConcurrentHashMap<Long, List<Map<String, String>>> showcaseStore = new ConcurrentHashMap<>();

    @PostMapping("/profile")
    @Operation(summary = "Create a business profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createProfile(
            @Valid @RequestBody BusinessProfileRequest request) {
        log.info("Create business profile request");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Business profile created successfully", Map.of("name", request.getBusinessName())));
    }

    @GetMapping("/profile/me")
    @Operation(summary = "Get my business profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyProfile() {
        log.info("Get my business profile request");
        return ResponseEntity.ok(ApiResponse.success("Profile", Map.of()));
    }

    @GetMapping("/profile/{userId}")
    @Operation(summary = "Get business profile by user ID")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@PathVariable Long userId) {
        log.info("Get business profile for user ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Profile", Map.of()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update my business profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @Valid @RequestBody BusinessProfileRequest request) {
        log.info("Update business profile request");
        return ResponseEntity.ok(ApiResponse.success("Business profile updated successfully", Map.of("name", request.getBusinessName())));
    }

    @DeleteMapping("/profile")
    @Operation(summary = "Delete my business profile")
    public ResponseEntity<ApiResponse<Void>> deleteProfile() {
        log.info("Delete business profile request");
        return ResponseEntity.ok(ApiResponse.success("Business profile deleted successfully", null));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get businesses by category")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByCategory(
            @PathVariable BusinessCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get businesses by category: {}", category);
        return ResponseEntity.ok(ApiResponse.success("Category users", List.of()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search businesses by name")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchBusinesses(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Search businesses with query: {}", query);
        return ResponseEntity.ok(ApiResponse.success("Search results", List.of()));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get analytics for current user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics(
            @RequestParam(defaultValue = "30") int days) {
        log.info("Get analytics for last {} days", days);
        return ResponseEntity.ok(ApiResponse.success("Analytics", Map.of()));
    }

    @PostMapping("/posts/{postId}/view")
    @Operation(summary = "Record a post view")
    public ResponseEntity<ApiResponse<Void>> recordView(@PathVariable Long postId) {
        log.debug("Recording view for post: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("View recorded", null));
    }

    @PostMapping("/posts/{postId}/impression")
    @Operation(summary = "Record a post impression")
    public ResponseEntity<ApiResponse<Void>> recordImpression(@PathVariable Long postId) {
        log.debug("Recording impression for post: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Impression recorded", null));
    }

    @PostMapping("/posts/{postId}/comments/{commentId}/reply")
    @Operation(summary = "Reply to a comment on business/creator post")
    public ResponseEntity<ApiResponse<Map<String, Object>>> replyToComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam String message) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reply posted", Map.of()));
    }

    @GetMapping("/showcase")
    @Operation(summary = "Get business showcase items")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getShowcase(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        List<Map<String, String>> items = showcaseStore.getOrDefault(userId, List.of());
        return ResponseEntity.ok(ApiResponse.success("Showcase", items));
    }

    @PostMapping("/showcase")
    @Operation(summary = "Add showcase item")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> addShowcaseItem(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId,
            @RequestBody Map<String, String> item) {
        showcaseStore.computeIfAbsent(userId, k -> new ArrayList<>()).add(item);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Showcase item added", showcaseStore.get(userId)));
    }

    @PutMapping("/showcase/{index}")
    @Operation(summary = "Update showcase item")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> updateShowcaseItem(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId,
            @PathVariable int index,
            @RequestBody Map<String, String> item) {
        List<Map<String, String>> items = showcaseStore.getOrDefault(userId, new ArrayList<>());
        if (index >= 0 && index < items.size()) {
            items.set(index, item);
        }
        return ResponseEntity.ok(ApiResponse.success("Showcase item updated", items));
    }

    @DeleteMapping("/showcase/{index}")
    @Operation(summary = "Remove showcase item")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> removeShowcaseItem(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId,
            @PathVariable int index) {
        List<Map<String, String>> items = showcaseStore.getOrDefault(userId, new ArrayList<>());
        if (index >= 0 && index < items.size()) {
            items.remove(index);
        }
        return ResponseEntity.ok(ApiResponse.success("Showcase item removed", items));
    }

    @GetMapping("/pages/me")
    @Operation(summary = "Get my business page")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyPage() {
        return ResponseEntity.ok(ApiResponse.success("My Page", Map.of()));
    }

    @GetMapping("/pages/{userId}")
    @Operation(summary = "Get business page by user ID")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPage(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Page", Map.of()));
    }

    @PutMapping("/pages/me")
    @Operation(summary = "Update my business page")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMyPage(
            @Valid @RequestBody BusinessProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Business page updated", Map.of()));
    }

    @GetMapping("/pages/{userId}/posts")
    @Operation(summary = "Get posts of a business page")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPagePosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Page posts", List.of()));
    }
}
