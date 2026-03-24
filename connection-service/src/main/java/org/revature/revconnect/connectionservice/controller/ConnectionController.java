package org.revature.revconnect.connectionservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.connectionservice.client.NotificationServiceClient;
import org.revature.revconnect.connectionservice.client.UserServiceClient;
import org.revature.revconnect.connectionservice.dto.response.ApiResponse;
import org.revature.revconnect.connectionservice.dto.response.ConnectionResponse;
import org.revature.revconnect.connectionservice.enums.ConnectionStatus;
import org.revature.revconnect.connectionservice.model.Connection;
import org.revature.revconnect.connectionservice.repository.ConnectionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ConnectionController {

    private final ConnectionRepository connectionRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    // ── Follow/Unfollow (monolith: /api/users/{userId}/follow) ──────────

    @PostMapping("/api/users/{userId}/follow")
    public ResponseEntity<ApiResponse<Void>> followUser(
            @PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId) {
        log.info("Follow user request for user ID: {} from {}", userId, currentUserId);
        
        var existingOpt = connectionRepository.findByFollowerIdAndFollowingId(currentUserId, userId);
        if (existingOpt.isPresent()) {
            Connection existing = existingOpt.get();
            if (existing.getStatus() == ConnectionStatus.PENDING) {
                return ResponseEntity.ok(ApiResponse.success("Follow request already pending", null));
            }
            // Allow re-follow after rejection or after removal (ACCEPTED/REJECTED)
            connectionRepository.delete(existing);
            connectionRepository.flush();
        }

        // All follow requests require approval regardless of account type
        ConnectionStatus status = ConnectionStatus.PENDING;

        Connection connection = Connection.builder()
                .followerId(currentUserId).followingId(userId)
                .status(status).build();
        connectionRepository.save(connection);

        // Send Notification
        try {
            String notifType = (status == ConnectionStatus.PENDING) ? "CONNECTION_REQUEST" : "FOLLOW";
            String notifMsg = (status == ConnectionStatus.PENDING) ? "sent you a connection request" : "started following you";
            notificationServiceClient.createNotification(NotificationServiceClient.NotificationRequest.builder()
                    .userId(userId)
                    .actorId(currentUserId)
                    .type(notifType)
                    .message(notifMsg)
                    .referenceId(connection.getId())
                    .build());
        } catch (Exception e) {
            log.error("Error sending follow notification", e);
        }

        String msg = (status == ConnectionStatus.ACCEPTED) ? "Successfully followed user" : "Follow request sent";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg, null));
    }

    @DeleteMapping("/api/users/{userId}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollowUser(
            @PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId) {
        log.info("Unfollow user request for user ID: {}", userId);
        connectionRepository.findByFollowerIdAndFollowingId(currentUserId, userId)
                .ifPresent(connectionRepository::delete);
        return ResponseEntity.ok(ApiResponse.success("Successfully unfollowed user", null));
    }

    // ── Followers/Following ─────────────────────────────────────────────

    @GetMapping("/api/users/{userId}/followers")
    public ResponseEntity<ApiResponse<Page<ConnectionResponse>>> getFollowers(
            @PathVariable Long userId, Pageable pageable) {
        log.info("Get followers request for user ID: {}", userId);
        Page<ConnectionResponse> followers = connectionRepository.findByFollowingIdAndStatus(userId, ConnectionStatus.ACCEPTED, pageable)
                .map(c -> mapToResponse(c, c.getFollowerId()));
        enrichConnections(followers.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", followers));
    }

    @GetMapping("/api/users/{userId}/following")
    public ResponseEntity<ApiResponse<Page<ConnectionResponse>>> getFollowing(
            @PathVariable Long userId, Pageable pageable) {
        log.info("Get following request for user ID: {}", userId);
        Page<ConnectionResponse> following = connectionRepository.findByFollowerIdAndStatus(userId, ConnectionStatus.ACCEPTED, pageable)
                .map(c -> mapToResponse(c, c.getFollowingId()));
        enrichConnections(following.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", following));
    }

    @GetMapping("/api/users/{userId}/connection-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConnectionStats(
            @PathVariable Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        log.info("Get connection stats request for user ID: {}", userId);
        long followers = connectionRepository.countByFollowingIdAndStatus(userId, ConnectionStatus.ACCEPTED);
        long following = connectionRepository.countByFollowerIdAndStatus(userId, ConnectionStatus.ACCEPTED);
        
        boolean isFollowing = false;
        boolean isFollowedBy = false;
        if (currentUserId != null && !currentUserId.equals(userId)) {
            isFollowing = connectionRepository.existsByFollowerIdAndFollowingIdAndStatus(
                    currentUserId, userId, ConnectionStatus.ACCEPTED);
            isFollowedBy = connectionRepository.existsByFollowerIdAndFollowingIdAndStatus(
                    userId, currentUserId, ConnectionStatus.ACCEPTED);
        }
        
        Map<String, Object> statsMap = new java.util.HashMap<>();
        statsMap.put("userId", userId);
        statsMap.put("followersCount", followers);
        statsMap.put("followingCount", following);
        statsMap.put("isFollowing", isFollowing);
        statsMap.put("isFollowedBy", isFollowedBy);
        
        return ResponseEntity.ok(ApiResponse.success("Success", statsMap));
    }

    @GetMapping("/api/users/{userId}/is-following")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            @PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId) {
        log.info("Check if following user ID: {}", userId);
        boolean following = connectionRepository.existsByFollowerIdAndFollowingIdAndStatus(
                currentUserId, userId, ConnectionStatus.ACCEPTED);
        return ResponseEntity.ok(ApiResponse.success("Success", following));
    }

    @DeleteMapping("/api/users/{userId}/connection")
    public ResponseEntity<ApiResponse<Void>> removeConnection(
            @PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId) {
        log.info("Remove connection with user ID: {}", userId);
        connectionRepository.findByFollowerIdAndFollowingId(currentUserId, userId)
                .ifPresent(connectionRepository::delete);
        connectionRepository.findByFollowerIdAndFollowingId(userId, currentUserId)
                .ifPresent(connectionRepository::delete);
        connectionRepository.flush();
        return ResponseEntity.ok(ApiResponse.success("Connection removed", null));
    }

    // ── Connection Requests ─────────────────────────────────────────────

    @GetMapping("/api/connections/pending")
    public ResponseEntity<ApiResponse<Page<ConnectionResponse>>> getPendingRequests(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get pending connection requests");
        Page<ConnectionResponse> pending = connectionRepository.findByFollowingIdAndStatus(userId, ConnectionStatus.PENDING, PageRequest.of(page, size))
                .map(c -> mapToResponse(c, c.getFollowerId()));
        enrichConnections(pending.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", pending));
    }

    @GetMapping("/api/connections/pending/sent")
    public ResponseEntity<ApiResponse<Page<ConnectionResponse>>> getSentPendingRequests(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get sent pending connection requests");
        Page<ConnectionResponse> sent = connectionRepository.findByFollowerIdAndStatus(userId, ConnectionStatus.PENDING, PageRequest.of(page, size))
                .map(c -> mapToResponse(c, c.getFollowingId()));
        enrichConnections(sent.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", sent));
    }

    @GetMapping("/api/connections/past")
    public ResponseEntity<ApiResponse<Page<ConnectionResponse>>> getPastRequests(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get past connection requests");
        Page<ConnectionResponse> past = connectionRepository.findByFollowingIdAndStatusIn(
                userId, List.of(ConnectionStatus.ACCEPTED, ConnectionStatus.REJECTED), PageRequest.of(page, size))
                .map(c -> mapToResponse(c, c.getFollowerId()));
        enrichConnections(past.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", past));
    }

    @PostMapping("/api/connections/{connectionId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptRequest(@PathVariable Long connectionId) {
        log.info("Accept connection request: {}", connectionId);
        connectionRepository.findById(connectionId).ifPresent(c -> {
            c.setStatus(ConnectionStatus.ACCEPTED);
            connectionRepository.save(c);
        });
        return ResponseEntity.ok(ApiResponse.success("Connection request accepted", null));
    }

    @DeleteMapping("/api/connections/{connectionId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(@PathVariable Long connectionId) {
        log.info("Reject connection request: {}", connectionId);
        connectionRepository.findById(connectionId).ifPresent(c -> {
            c.setStatus(ConnectionStatus.REJECTED);
            connectionRepository.save(c);
        });
        return ResponseEntity.ok(ApiResponse.success("Connection request rejected", null));
    }

    // ── Internal Feign endpoints ────────────────────────────────────────

    @GetMapping("/api/connections/{userId}/following-ids")
    public ResponseEntity<List<Long>> getFollowingIds(@PathVariable Long userId) {
        return ResponseEntity.ok(connectionRepository.findFollowingIdsByFollowerId(userId));
    }

    @GetMapping("/api/connections/{userId}/follower-ids")
    public ResponseEntity<List<Long>> getFollowerIds(@PathVariable Long userId) {
        return ResponseEntity.ok(connectionRepository.findFollowerIdsByFollowingId(userId));
    }

    private ConnectionResponse mapToResponse(Connection c, Long targetUserId) {
        return ConnectionResponse.builder()
                .id(c.getId())
                .userId(targetUserId)
                .status(c.getStatus().name())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private void enrichConnections(List<ConnectionResponse> responses) {
        if (responses.isEmpty()) return;
        Set<Long> userIds = responses.stream().map(ConnectionResponse::getUserId).collect(Collectors.toSet());
        try {
            UserServiceClient.ApiResponse<List<UserServiceClient.UserResponse>> userApiResponse = 
                userServiceClient.getUsersByIds(List.copyOf(userIds));
            if (userApiResponse != null && userApiResponse.isSuccess() && userApiResponse.getData() != null) {
                Map<Long, UserServiceClient.UserResponse> userMap = userApiResponse.getData().stream()
                        .collect(Collectors.toMap(UserServiceClient.UserResponse::getId, u -> u));
                responses.forEach(res -> {
                    UserServiceClient.UserResponse user = userMap.get(res.getUserId());
                    if (user != null) {
                        res.setUsername(user.getUsername());
                        res.setName(user.getName());
                        res.setProfilePicture(user.getProfilePicture());
                        res.setBio(user.getBio());
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error enriching connections", e);
        }
    }
}
