package org.revature.revconnect.userservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.userservice.dto.request.ProfileUpdateRequest;
import org.revature.revconnect.userservice.dto.response.ApiResponse;
import org.revature.revconnect.userservice.dto.response.UserResponse;
import org.revature.revconnect.userservice.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.revature.revconnect.userservice.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        log.info("Get user request for ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("User found", userService.getUserById(userId)));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByUsername(@PathVariable String username) {
        log.info("Get user request for username: {}", username);
        return ResponseEntity.ok(ApiResponse.success("User found", userService.getUserByUsername(username)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> searchUsers(
            @RequestParam String query, Pageable pageable) {
        log.info("Search users request: {}", query);
        return ResponseEntity.ok(ApiResponse.success("Search results", userService.searchUsers(query, pageable)));
    }

    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByIds(@RequestParam List<Long> ids) {
        log.info("Batch request for user IDs: {}", ids);
        return ResponseEntity.ok(ApiResponse.success("Users found", userService.getUsersByIds(ids)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get current user request for ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Current user", userService.getUserById(userId)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody ProfileUpdateRequest request) {
        log.info("Update profile request for ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(userId, request)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfileLegacy(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody ProfileUpdateRequest request) {
        log.info("Update profile (legacy path) request for ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(userId, request)));
    }

    @PatchMapping("/me/privacy")
    public ResponseEntity<ApiResponse<UserResponse>> updatePrivacy(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String privacy) {
        log.info("Update privacy request for ID: {} to {}", userId, privacy);
        UserResponse user = userService.updatePrivacy(userId, privacy);
        return ResponseEntity.ok(ApiResponse.success("Privacy updated", user));
    }

    @PostMapping("/me/request-verification")
    public ResponseEntity<ApiResponse<UserResponse>> requestVerification(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Request verification for user ID: {}", userId);
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success("Verification request submitted", user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        log.info("Delete user request for ID: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }

    // ── Block/Unblock/Report ────────────────────────────────────

    @PostMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<Void>> blockUser(@PathVariable Long userId) {
        log.info("Block user request for ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("User blocked successfully", null));
    }

    @DeleteMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<Void>> unblockUser(@PathVariable Long userId) {
        log.info("Unblock user request for ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully", null));
    }

    @GetMapping("/blocked")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBlockedUsers() {
        log.info("Get blocked users request");
        return ResponseEntity.ok(ApiResponse.success("Blocked users", List.of()));
    }

    @PostMapping("/{userId}/report")
    public ResponseEntity<ApiResponse<Void>> reportUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {
        log.info("Report user request for ID: {} with reason: {}", userId, reason);
        return ResponseEntity.ok(ApiResponse.success("User reported successfully", null));
    }

    // ── Mutual & Suggested ──────────────────────────────────────

    @GetMapping("/mutual/{userId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMutualConnections(
            @PathVariable Long userId) {
        log.info("Get mutual connections with user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Mutual connections", List.of()));
    }

    @GetMapping("/suggested")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getSuggestedUsers(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId,
            Pageable pageable) {
        log.info("Get suggested users request for user ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Suggested users", userService.getSuggestions(userId, pageable)));
    }
}
