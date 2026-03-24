package org.revature.revconnect.interactionservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.interactionservice.client.NotificationServiceClient;
import org.revature.revconnect.interactionservice.client.PostServiceClient;
import org.revature.revconnect.interactionservice.dto.response.ApiResponse;
import org.revature.revconnect.interactionservice.dto.response.BookmarkResponse;
import org.revature.revconnect.interactionservice.model.Bookmark;
import org.revature.revconnect.interactionservice.repository.BookmarkRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@Slf4j
public class BookmarkController {

    private final BookmarkRepository bookmarkRepository;
    private final NotificationServiceClient notificationServiceClient;
    private final PostServiceClient postServiceClient;

    @PostMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> bookmarkPost(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Bookmark post request for post ID: {}", postId);
        if (!bookmarkRepository.existsByUserIdAndPostId(userId, postId)) {
            Bookmark bookmark = bookmarkRepository.save(
                Bookmark.builder().userId(userId).postId(postId).createdAt(LocalDateTime.now()).build());
        
            // Notify author
            try {
                PostServiceClient.ApiResponse<Map<String, Object>> postRes = postServiceClient.getPost(postId);
                if (postRes != null && postRes.getData() != null) {
                    Long authorId = Long.valueOf(postRes.getData().get("userId").toString());
                    if (!authorId.equals(userId)) {
                        notificationServiceClient.createNotification(NotificationServiceClient.NotificationRequest.builder()
                                .userId(authorId)
                                .actorId(userId)
                                .type("BOOKMARK")
                                .message("bookmarked your post")
                                .referenceId(bookmark.getId())
                                .build());
                    }
                }
            } catch (Exception e) {
                log.error("Error sending bookmark notification", e);
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Post bookmarked successfully", null));
        }
        // If already bookmarked, return OK (or CREATED if idempotent)
        return ResponseEntity.ok(ApiResponse.success("Post already bookmarked", null));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> removeBookmark(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Remove bookmark request for post ID: {}", postId);
        bookmarkRepository.findByUserIdAndPostId(userId, postId).ifPresent(bookmarkRepository::delete);
        return ResponseEntity.ok(ApiResponse.success("Bookmark removed successfully", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BookmarkResponse>>> getBookmarks(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get bookmarks request - page: {}, size: {}", page, size);
        Page<Bookmark> bookmarks = bookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        
        Page<BookmarkResponse> response = bookmarks.map(b -> {
            BookmarkResponse res = BookmarkResponse.builder()
                    .id(b.getId())
                    .userId(b.getUserId())
                    .postId(b.getPostId())
                    .bookmarkedAt(b.getCreatedAt())
                    .build();
            
            try {
                PostServiceClient.ApiResponse<Map<String, Object>> postRes = postServiceClient.getPost(b.getPostId());
                if (postRes != null && postRes.isSuccess()) {
                    res.setPost(postRes.getData());
                }
            } catch (Exception e) {
                log.error("Error fetching post for bookmark", e);
            }
            return res;
        });
        
        return ResponseEntity.ok(ApiResponse.success("Bookmarks retrieved", response));
    }

    @GetMapping("/posts/{postId}/status")
    public ResponseEntity<ApiResponse<Boolean>> isBookmarked(
            @PathVariable Long postId, @RequestHeader("X-User-Id") Long userId) {
        log.info("Check bookmark status for post ID: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Success", bookmarkRepository.existsByUserIdAndPostId(userId, postId)));
    }
}
