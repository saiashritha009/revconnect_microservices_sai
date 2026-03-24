package org.revature.revconnect.postservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.postservice.client.UserServiceClient;
import org.revature.revconnect.postservice.dto.response.ApiResponse;
import org.revature.revconnect.postservice.dto.response.StoryResponse;
import org.revature.revconnect.postservice.model.Story;
import org.revature.revconnect.postservice.repository.StoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
@Slf4j
public class StoryController {

    private final StoryRepository storyRepository;
    private final UserServiceClient userServiceClient;

    @PostMapping
    public ResponseEntity<ApiResponse<StoryResponse>> createStory(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String mediaUrl,
            @RequestParam(required = false) String caption) {
        log.info("Creating new story");
        Story story = Story.builder()
                .userId(userId).mediaUrl(mediaUrl).caption(caption)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        story = storyRepository.save(story);
        StoryResponse response = mapToResponse(story);
        enrichStories(List.of(response));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Story created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getMyStories(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Getting my stories");
        List<StoryResponse> stories = storyRepository.findByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(
                        userId, LocalDateTime.now()).stream()
                .map(this::mapToResponse).toList();
        enrichStories(stories);
        return ResponseEntity.ok(ApiResponse.success("Success", stories));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getStoriesFeed() {
        log.info("Getting stories feed");
        List<StoryResponse> stories = storyRepository
                .findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now())
                .stream().map(this::mapToResponse).toList();
        enrichStories(stories);
        return ResponseEntity.ok(ApiResponse.success("Success", stories));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getUserStories(@PathVariable Long userId) {
        log.info("Getting stories for user: {}", userId);
        List<StoryResponse> stories = storyRepository.findByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(
                        userId, LocalDateTime.now()).stream()
                .map(this::mapToResponse).toList();
        enrichStories(stories);
        return ResponseEntity.ok(ApiResponse.success("Success", stories));
    }

    @GetMapping("/{storyId}")
    public ResponseEntity<ApiResponse<StoryResponse>> getStory(@PathVariable Long storyId) {
        log.info("Getting story: {}", storyId);
        return storyRepository.findById(storyId)
                .map(s -> {
                    StoryResponse res = mapToResponse(s);
                    enrichStories(List.of(res));
                    return ResponseEntity.ok(ApiResponse.success("Success", res));
                })
                .orElse(ResponseEntity.ok(ApiResponse.error("Story not found")));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<ApiResponse<Void>> deleteStory(@PathVariable Long storyId) {
        log.info("Deleting story: {}", storyId);
        storyRepository.deleteById(storyId);
        return ResponseEntity.ok(ApiResponse.success("Story deleted", null));
    }

    @PostMapping("/{storyId}/view")
    public ResponseEntity<ApiResponse<Void>> viewStory(@PathVariable Long storyId) {
        log.info("Viewing story: {}", storyId);
        storyRepository.findById(storyId).ifPresent(s -> {
            s.setViewCount(s.getViewCount() + 1);
            storyRepository.save(s);
        });
        return ResponseEntity.ok(ApiResponse.success("Story viewed", null));
    }

    @GetMapping("/{storyId}/viewers")
    public ResponseEntity<List<Map<String, Object>>> getStoryViewers(@PathVariable Long storyId) {
        log.info("Getting viewers for story: {}", storyId);
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{storyId}/react")
    public ResponseEntity<Map<String, String>> reactToStory(
            @PathVariable Long storyId, @RequestParam String reaction) {
        log.info("Reacting to story {} with {}", storyId, reaction);
        return ResponseEntity.ok(Map.of("message", "Reaction added"));
    }

    @PostMapping("/{storyId}/reply")
    public ResponseEntity<Map<String, String>> replyToStory(
            @PathVariable Long storyId, @RequestParam String message) {
        log.info("Replying to story {}", storyId);
        return ResponseEntity.ok(Map.of("message", "Reply sent"));
    }

    @GetMapping("/highlights")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getHighlights(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Getting highlights");
        List<StoryResponse> stories = storyRepository.findByUserIdAndIsHighlightTrue(userId)
                .stream().map(this::mapToResponse).toList();
        enrichStories(stories);
        return ResponseEntity.ok(ApiResponse.success("Success", stories));
    }

    @PostMapping("/highlights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createHighlight(
            @RequestParam String name,
            @RequestParam List<Long> storyIds) {
        log.info("Creating highlight: {}", name);
        storyIds.forEach(id -> storyRepository.findById(id).ifPresent(s -> {
            s.setHighlight(true);
            storyRepository.save(s);
        }));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Highlight created", Map.of("highlightId", storyIds.isEmpty() ? 0L : storyIds.get(0))));
    }

    @DeleteMapping("/highlights/{highlightId}")
    public ResponseEntity<ApiResponse<Void>> deleteHighlight(@PathVariable Long highlightId) {
        log.info("Deleting highlight: {}", highlightId);
        storyRepository.findById(highlightId).ifPresent(s -> {
            s.setHighlight(false);
            storyRepository.save(s);
        });
        return ResponseEntity.ok(ApiResponse.success("Highlight deleted", null));
    }

    @GetMapping("/archive")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> getArchivedStories(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Getting archived stories");
        List<StoryResponse> stories = storyRepository.findByUserIdAndExpiresAtBeforeOrderByCreatedAtDesc(
                        userId, LocalDateTime.now()).stream()
                .map(this::mapToResponse).toList();
        enrichStories(stories);
        return ResponseEntity.ok(ApiResponse.success("Success", stories));
    }

    private StoryResponse mapToResponse(Story story) {
        return StoryResponse.builder()
                .id(story.getId())
                .userId(story.getUserId())
                .mediaUrl(story.getMediaUrl())
                .caption(story.getCaption())
                .createdAt(story.getCreatedAt())
                .expiresAt(story.getExpiresAt())
                .isHighlight(story.isHighlight())
                .viewCount(story.getViewCount())
                .build();
    }

    private void enrichStories(List<StoryResponse> responses) {
        if (responses.isEmpty()) return;
        Set<Long> userIds = responses.stream().map(StoryResponse::getUserId).collect(Collectors.toSet());
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
                        res.setProfilePicture(user.getProfilePicture());
                        res.setUser(StoryResponse.UserInfo.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .name(user.getName())
                                .profilePicture(user.getProfilePicture())
                                .build());
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error enriching stories", e);
        }
    }
}
