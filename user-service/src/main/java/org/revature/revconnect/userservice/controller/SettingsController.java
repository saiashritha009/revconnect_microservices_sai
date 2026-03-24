package org.revature.revconnect.userservice.controller;

import org.revature.revconnect.userservice.dto.response.ApiResponse;
import org.revature.revconnect.userservice.enums.Privacy;
import org.revature.revconnect.userservice.model.User;
import org.revature.revconnect.userservice.model.UserSettings;
import org.revature.revconnect.userservice.repository.UserRepository;
import org.revature.revconnect.userservice.repository.UserSettingsRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Settings", description = "User Settings APIs")
public class SettingsController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSettingsRepository userSettingsRepository;

    // ── General Settings ──────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Get all settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success("Settings", Map.of()));
    }

    @PutMapping
    @Operation(summary = "Update all settings")
    public ResponseEntity<ApiResponse<Void>> updateSettings(@RequestBody Map<String, Object> settings) {
        return ResponseEntity.ok(ApiResponse.success("Settings updated", null));
    }

    // ── Privacy ───────────────────────────────────────────────────

    @GetMapping("/privacy")
    @Operation(summary = "Get privacy settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPrivacySettings(
            @RequestHeader("X-User-Id") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        return ResponseEntity.ok(ApiResponse.success("Privacy",
                Map.of("privacy", user.getPrivacy().name())));
    }

    @PutMapping("/privacy")
    @Operation(summary = "Update privacy settings")
    public ResponseEntity<ApiResponse<Void>> updatePrivacySettings(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> settings) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        String privacyVal = (String) settings.getOrDefault("privacy", "PUBLIC");
        try {
            user.setPrivacy(Privacy.valueOf(privacyVal.toUpperCase()));
            userRepository.save(user);
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Invalid privacy value"));
        }
        return ResponseEntity.ok(ApiResponse.success("Privacy settings updated", null));
    }

    // ── Notifications ─────────────────────────────────────────────

    @GetMapping("/notifications")
    @Operation(summary = "Get notification settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotificationSettings(
            @RequestHeader("X-User-Id") Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> UserSettings.builder().user(userRepository.getReferenceById(userId)).build());
        Map<String, Object> prefs = buildPrefsMap(settings);
        return ResponseEntity.ok(ApiResponse.success("Notifications", prefs));
    }

    @PutMapping("/notifications")
    @Operation(summary = "Update notification settings")
    public ResponseEntity<ApiResponse<Void>> updateNotificationSettings(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> body) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> UserSettings.builder().user(userRepository.getReferenceById(userId)).build());
        if (body.containsKey("emailNotifications"))
            settings.setEmailNotifications(Boolean.TRUE.equals(body.get("emailNotifications")));
        if (body.containsKey("pushNotifications"))
            settings.setPushNotifications(Boolean.TRUE.equals(body.get("pushNotifications")));
        if (body.containsKey("notifyLike"))
            settings.setNotifyLike(Boolean.TRUE.equals(body.get("notifyLike")));
        if (body.containsKey("notifyComment"))
            settings.setNotifyComment(Boolean.TRUE.equals(body.get("notifyComment")));
        if (body.containsKey("notifyNewFollower"))
            settings.setNotifyNewFollower(Boolean.TRUE.equals(body.get("notifyNewFollower")));
        if (body.containsKey("notifyConnectionRequest"))
            settings.setNotifyConnectionRequest(Boolean.TRUE.equals(body.get("notifyConnectionRequest")));
        if (body.containsKey("notifyShare"))
            settings.setNotifyShare(Boolean.TRUE.equals(body.get("notifyShare")));
        userSettingsRepository.save(settings);
        return ResponseEntity.ok(ApiResponse.success("Notification settings updated", null));
    }

    @GetMapping("/notifications/prefs/{userId}")
    @Operation(summary = "Internal: Get notification preferences for a user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotificationPrefs(
            @PathVariable Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> UserSettings.builder().user(userRepository.getReferenceById(userId)).build());
        Map<String, Object> prefs = buildPrefsMap(settings);
        return ResponseEntity.ok(ApiResponse.success("Prefs", prefs));
    }

    // ── Security ──────────────────────────────────────────────────

    @GetMapping("/security")
    @Operation(summary = "Get security settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecuritySettings() {
        return ResponseEntity.ok(ApiResponse.success("Security", Map.of()));
    }

    @PutMapping("/security")
    @Operation(summary = "Update security settings")
    public ResponseEntity<ApiResponse<Void>> updateSecuritySettings(@RequestBody Map<String, Object> settings) {
        return ResponseEntity.ok(ApiResponse.success("Security settings updated", null));
    }

    // ── Password Change ───────────────────────────────────────────

    @PostMapping("/password/change")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String currentPassword,
            @RequestParam String newPassword) {
        log.info("Change password request for user: {}", userId);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.error("User not found"));
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.ok(ApiResponse.error("Current password is incorrect"));
        }
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.ok(ApiResponse.error("New password must be at least 6 characters"));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Password changed", null));
    }

    // ── Email Change ──────────────────────────────────────────────

    @PostMapping("/email/change")
    @Operation(summary = "Request email change")
    public ResponseEntity<ApiResponse<Void>> changeEmail(@RequestParam String newEmail) {
        return ResponseEntity.ok(ApiResponse.success("Email changed", null));
    }

    @PostMapping("/email/verify")
    @Operation(summary = "Verify email change")
    public ResponseEntity<ApiResponse<Void>> verifyEmailChange(@RequestParam String token) {
        return ResponseEntity.ok(ApiResponse.success("Email changed", null));
    }

    // ── Sessions ──────────────────────────────────────────────────

    @GetMapping("/sessions")
    @Operation(summary = "Get active sessions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveSessions() {
        return ResponseEntity.ok(ApiResponse.success("Sessions", List.of()));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Revoke a session")
    public ResponseEntity<ApiResponse<Void>> revokeSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.success("Session revoked", null));
    }

    @DeleteMapping("/sessions")
    @Operation(summary = "Revoke all other sessions")
    public ResponseEntity<ApiResponse<Void>> revokeAllSessions() {
        return ResponseEntity.ok(ApiResponse.success("All sessions revoked", null));
    }

    // ── 2FA ───────────────────────────────────────────────────────

    @PostMapping("/2fa/enable")
    @Operation(summary = "Enable two-factor authentication")
    public ResponseEntity<ApiResponse<Map<String, String>>> enable2FA() {
        return ResponseEntity.ok(ApiResponse.success("2FA enabled", Map.of("secret", "XXXX")));
    }

    @PostMapping("/2fa/verify")
    @Operation(summary = "Verify 2FA setup")
    public ResponseEntity<ApiResponse<Void>> verify2FA(@RequestParam String code) {
        return ResponseEntity.ok(ApiResponse.success("2FA verified", null));
    }

    @DeleteMapping("/2fa")
    @Operation(summary = "Disable two-factor authentication")
    public ResponseEntity<ApiResponse<Void>> disable2FA(@RequestParam String code) {
        return ResponseEntity.ok(ApiResponse.success("2FA disabled", null));
    }

    // ── Account Management ────────────────────────────────────────

    @GetMapping("/account")
    @Operation(summary = "Get account settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAccountSettings(
            @RequestHeader("X-User-Id") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        Map<String, Object> settings = new HashMap<>();
        settings.put("privacy", user.getPrivacy().name());
        settings.put("userType", user.getUserType().name());
        settings.put("emailVerified", user.getEmailVerified());
        return ResponseEntity.ok(ApiResponse.success("Account settings", settings));
    }

    @DeleteMapping("/account")
    @Operation(summary = "Delete account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String password) {
        log.info("Delete account request for user: {}", userId);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.error("User not found"));
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.ok(ApiResponse.error("Password is incorrect"));
        }
        userRepository.delete(user);
        log.info("Account deleted for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Account deleted", null));
    }

    @PostMapping("/account/deactivate")
    @Operation(summary = "Deactivate account temporarily")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Deactivate account request for user: {}", userId);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        user.setEmailVerified(false);
        userRepository.save(user);
        log.info("Account deactivated for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Account deactivated. Log in again to reactivate.", null));
    }

    @PostMapping("/account/reactivate")
    @Operation(summary = "Reactivate account")
    public ResponseEntity<ApiResponse<Void>> reactivateAccount(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Reactivate account request for user: {}", userId);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        user.setEmailVerified(true);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Account reactivated", null));
    }

    @GetMapping("/data/export")
    @Operation(summary = "Request data export")
    public ResponseEntity<ApiResponse<Void>> requestDataExport() {
        return ResponseEntity.ok(ApiResponse.success("Data export requested", null));
    }

    // ── External Links ────────────────────────────────────────────

    @GetMapping("/account/external-links")
    @Operation(summary = "Get external links")
    public ResponseEntity<ApiResponse<List<String>>> getExternalLinks(
            @RequestHeader("X-User-Id") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        List<String> links = parseLinks(user.getExternalLinks());
        return ResponseEntity.ok(ApiResponse.success("External links", links));
    }

    @PostMapping("/account/external-links")
    @Operation(summary = "Add external link")
    public ResponseEntity<ApiResponse<List<String>>> addExternalLink(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String url) {
        log.info("Add external link for user {}: {}", userId, url);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        List<String> links = parseLinks(user.getExternalLinks());
        if (!links.contains(url)) {
            links.add(url);
        }
        user.setExternalLinks(String.join(",", links));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("External link added", links));
    }

    @DeleteMapping("/account/external-links")
    @Operation(summary = "Remove external link")
    public ResponseEntity<ApiResponse<List<String>>> removeExternalLink(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String url) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("User not found"));
        List<String> links = parseLinks(user.getExternalLinks());
        links.remove(url);
        user.setExternalLinks(links.isEmpty() ? null : String.join(",", links));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("External link removed", links));
    }

    private Map<String, Object> buildPrefsMap(UserSettings settings) {
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("emailNotifications", settings.getEmailNotifications() != null ? settings.getEmailNotifications() : true);
        prefs.put("pushNotifications", settings.getPushNotifications() != null ? settings.getPushNotifications() : true);
        prefs.put("notifyLike", settings.getNotifyLike() != null ? settings.getNotifyLike() : true);
        prefs.put("notifyComment", settings.getNotifyComment() != null ? settings.getNotifyComment() : true);
        prefs.put("notifyNewFollower", settings.getNotifyNewFollower() != null ? settings.getNotifyNewFollower() : true);
        prefs.put("notifyConnectionRequest", settings.getNotifyConnectionRequest() != null ? settings.getNotifyConnectionRequest() : true);
        prefs.put("notifyShare", settings.getNotifyShare() != null ? settings.getNotifyShare() : true);
        return prefs;
    }

    private List<String> parseLinks(String raw) {
        if (raw == null || raw.isBlank()) return new ArrayList<>();
        return Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
