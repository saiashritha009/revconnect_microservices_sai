package org.revature.revconnect.interactionservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.interactionservice.client.NotificationServiceClient;
import org.revature.revconnect.interactionservice.client.PostServiceClient;
import org.revature.revconnect.interactionservice.client.UserServiceClient;
import org.revature.revconnect.interactionservice.dto.response.*;
import org.revature.revconnect.interactionservice.model.*;
import org.revature.revconnect.interactionservice.repository.*;
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
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class InteractionController {

    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final ShareRepository shareRepository;
    private final PostViewRepository postViewRepository;
    private final UserServiceClient userServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final PostServiceClient postServiceClient;

    // ── Like endpoints ──────────────────────────────────────────

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Like post request for post ID: {} from user: {}", postId, userId);
        if (likeRepository.existsByUserIdAndPostId(userId, postId)) {
            return ResponseEntity.ok(ApiResponse.success("Already liked", null));
        }
        Like like = likeRepository.save(
                Like.builder().userId(userId).postId(postId).build());
        
        // Notify author
        try {
            PostServiceClient.ApiResponse<Map<String, Object>> postRes = postServiceClient.getPost(postId);
            if (postRes != null && postRes.getData() != null) {
                Long authorId = Long.valueOf(postRes.getData().get("userId").toString());
                if (!authorId.equals(userId)) {
                    notificationServiceClient.createNotification(NotificationServiceClient.NotificationRequest.builder()
                            .userId(authorId)
                            .actorId(userId)
                            .type("LIKE")
                            .message("liked your post")
                            .referenceId(like.getPostId()) // or like.getId() if we have a type field in Notification for reference
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Error sending like notification", e);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post liked successfully", null));
    }

    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Boolean>> unlikePost(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Unlike post request for post ID: {}", postId);
        likeRepository.findByUserIdAndPostId(userId, postId).ifPresent(likeRepository::delete);
        return ResponseEntity.ok(ApiResponse.success("Post unliked", false));
    }

    @GetMapping("/posts/{postId}/likes")
    public ResponseEntity<Map<String, Object>> getPostLikes(@PathVariable Long postId) {
        log.info("Get likes request for post ID: {}", postId);
        return ResponseEntity.ok(Map.of("likeCount", likeRepository.countByPostId(postId),
                "likes", likeRepository.findByPostId(postId)));
    }

    @GetMapping("/posts/{postId}/liked")
    public ResponseEntity<ApiResponse<Boolean>> hasUserLikedPost(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Check like status for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Success", likeRepository.existsByUserIdAndPostId(userId, postId)));
    }

    @GetMapping("/interactions/liked-posts")
    public ResponseEntity<ApiResponse<List<Long>>> getLikedPostIds(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get liked post IDs for user: {}", userId);
        List<Long> postIds = likeRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(like -> like.getPostId()).toList();
        return ResponseEntity.ok(ApiResponse.success("Success", postIds));
    }

    // ── Comment endpoints ───────────────────────────────────────

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> body) {
        log.info("Add comment request for post ID: {}", postId);
        Comment comment = Comment.builder()
                .postId(postId).userId(userId).content(body.get("content"))
                .parentCommentId(body.get("parentId") != null ? Long.valueOf(body.get("parentId")) : null)
                .build();
        comment = commentRepository.save(comment);
        
        // Notify author
        try {
            PostServiceClient.ApiResponse<Map<String, Object>> postRes = postServiceClient.getPost(postId);
            if (postRes != null && postRes.getData() != null) {
                Long authorId = Long.valueOf(postRes.getData().get("userId").toString());
                if (!authorId.equals(userId)) {
                    notificationServiceClient.createNotification(NotificationServiceClient.NotificationRequest.builder()
                            .userId(authorId)
                            .actorId(userId)
                            .type("COMMENT")
                            .message("commented on your post")
                            .referenceId(comment.getId())
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Error sending comment notification", e);
        }

        CommentResponse response = mapToCommentResponse(comment);
        enrichComments(List.of(response));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment added", response));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> getPostComments(@PathVariable Long postId, Pageable pageable) {
        log.info("Get comments request for post ID: {}", postId);
        Page<CommentResponse> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable).map(this::mapToCommentResponse);
        enrichComments(comments.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", comments));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId, @RequestBody Map<String, String> body) {
        log.info("Update comment request for comment ID: {}", commentId);
        return commentRepository.findById(commentId).map(comment -> {
            comment.setContent(body.get("content"));
            comment = commentRepository.save(comment);
            CommentResponse response = mapToCommentResponse(comment);
            enrichComments(List.of(response));
            return ResponseEntity.ok(ApiResponse.success("Comment updated", response));
        }).orElse(ResponseEntity.ok(ApiResponse.error("Comment not found")));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        log.info("Delete comment request for comment ID: {}", commentId);
        commentRepository.deleteById(commentId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> likeComment(@PathVariable Long commentId) {
        log.info("Like comment request for comment ID: {}", commentId);
        // Implement comment like logic if needed
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment liked successfully", null));
    }

    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(@PathVariable Long commentId) {
        log.info("Unlike comment request for comment ID: {}", commentId);
        return ResponseEntity.ok(ApiResponse.success("Comment unliked successfully", null));
    }

    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> getCommentReplies(
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get replies request for comment ID: {}", commentId);
        Page<CommentResponse> replies = commentRepository.findByParentCommentIdOrderByCreatedAtDesc(commentId, PageRequest.of(page, size))
                .map(this::mapToCommentResponse);
        enrichComments(replies.getContent());
        return ResponseEntity.ok(ApiResponse.success("Success", replies));
    }

    // ── Share endpoints ─────────────────────────────────────────

    @PostMapping("/posts/{postId}/share")
    public ResponseEntity<ApiResponse<ShareResponse>> sharePost(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Share post request for post ID: {}", postId);
        Share share = Share.builder().userId(userId).postId(postId)
                .comment(body != null ? body.get("comment") : null)
                .build();
        share = shareRepository.save(share);
        ShareResponse response = mapToShareResponse(share);
        enrichShares(List.of(response));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Post shared", response));
    }

    @PostMapping("/posts/{postId}/share/increment")
    public ResponseEntity<ApiResponse<Void>> incrementShareCount(@PathVariable Long postId) {
        log.info("Increment share count request for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Post share count incremented", null));
    }

    @GetMapping("/posts/{postId}/shares")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getShares(@PathVariable Long postId) {
        log.info("Get shares request for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of("shareCount", shareRepository.countByPostId(postId))));
    }

    private CommentResponse mapToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUserId())
                .postId(comment.getPostId())
                .parentId(comment.getParentCommentId())
                .likeCount(comment.getLikeCount())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private ShareResponse mapToShareResponse(Share share) {
        return ShareResponse.builder()
                .id(share.getId())
                .userId(share.getUserId())
                .postId(share.getPostId())
                .comment(share.getComment())
                .createdAt(share.getCreatedAt())
                .build();
    }

    private void enrichComments(List<CommentResponse> responses) {
        if (responses.isEmpty()) return;
        Set<Long> userIds = responses.stream().map(CommentResponse::getUserId).collect(Collectors.toSet());
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
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error enriching comments", e);
        }
    }

    private void enrichShares(List<ShareResponse> responses) {
        if (responses.isEmpty()) return;
        Set<Long> userIds = responses.stream().map(ShareResponse::getUserId).collect(Collectors.toSet());
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
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error enriching shares", e);
        }
    }

    // ── View tracking endpoints ──────────────────────────────────

    @PostMapping("/posts/{postId}/view")
    public ResponseEntity<ApiResponse<Void>> recordView(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Record view for post {} by user {}", postId, userId);
        postViewRepository.save(PostView.builder().postId(postId).userId(userId).build());
        return ResponseEntity.ok(ApiResponse.success("View recorded", null));
    }

    @GetMapping("/posts/{postId}/views")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getViewCount(@PathVariable Long postId) {
        long count = postViewRepository.countByPostId(postId);
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of("viewCount", count)));
    }
}
