package org.revature.revconnect.notificationservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.notificationservice.client.UserServiceClient;
import org.revature.revconnect.notificationservice.dto.response.ApiResponse;
import org.revature.revconnect.notificationservice.model.Notification;
import org.revature.revconnect.notificationservice.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserServiceClient userServiceClient;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> getNotifications(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "-1") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Get notifications request - page: {}, size: {}", page, size);
        return ResponseEntity.ok(ApiResponse.success("Success", 
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Page<Notification>>> getUnreadNotifications(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Get unread notifications request");
        return ResponseEntity.ok(ApiResponse.success("Success", 
                notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, PageRequest.of(page, size))));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(@RequestHeader("X-User-Id") Long userId) {
        log.info("Get unread count request");
        return ResponseEntity.ok(ApiResponse.success("Success", 
                Map.of("unreadCount", notificationRepository.countByUserIdAndIsReadFalse(userId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Notification>> createNotification(@RequestBody Notification notification) {
        log.info("Create notification request for user: {}, type: {}", notification.getUserId(), notification.getType());
        try {
            UserServiceClient.ApiResponse<Map<String, Object>> prefsRes =
                    userServiceClient.getNotificationPrefs(notification.getUserId());
            if (prefsRes != null && prefsRes.getData() != null) {
                Map<String, Object> prefs = prefsRes.getData();
                // Check per-type preference
                if (notification.getType() != null) {
                    boolean allowed = switch (notification.getType()) {
                        case LIKE -> !Boolean.FALSE.equals(prefs.get("notifyLike"));
                        case COMMENT -> !Boolean.FALSE.equals(prefs.get("notifyComment"));
                        case FOLLOW -> !Boolean.FALSE.equals(prefs.get("notifyNewFollower"));
                        case SHARE -> !Boolean.FALSE.equals(prefs.get("notifyShare"));
                        default -> true;
                    };
                    if (!allowed) {
                        log.info("Skipping {} notification for user {} - preference disabled", notification.getType(), notification.getUserId());
                        return ResponseEntity.ok(ApiResponse.success("Notification skipped (type disabled)", null));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch notification prefs for user {}: {}", notification.getUserId(), e.getMessage());
        }
        return ResponseEntity.ok(ApiResponse.success("Notification created", notificationRepository.save(notification)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long notificationId) {
        log.info("Mark as read request for notification: {}", notificationId);
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Long>>> markAllAsRead(@RequestHeader("X-User-Id") Long userId) {
        log.info("Mark all as read request");
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        notificationRepository.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", Map.of("markedCount", count)));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long notificationId) {
        log.info("Delete notification request for ID: {}", notificationId);
        notificationRepository.deleteById(notificationId);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }
}
