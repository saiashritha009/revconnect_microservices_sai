package org.revature.revconnect.interactionservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.interactionservice.client.ConnectionServiceClient;
import org.revature.revconnect.interactionservice.client.PostServiceClient;
import org.revature.revconnect.interactionservice.client.UserServiceClient;
import org.revature.revconnect.interactionservice.dto.response.ApiResponse;
import org.revature.revconnect.interactionservice.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final ShareRepository shareRepository;
    private final PostViewRepository postViewRepository;
    private final ConnectionServiceClient connectionServiceClient;
    private final PostServiceClient postServiceClient;
    private final UserServiceClient userServiceClient;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        log.info("Getting analytics overview for user: {}", userId);
        
        long totalFollowers = 0;
        long totalPosts = 0;
        long totalLikes = 0;
        long totalComments = 0;
        long totalShares = 0;
        long totalViews = 0;
        List<Long> userPostIds = List.of();
        
        if (userId != null) {
            // Fetch follower count
            try {
                ConnectionServiceClient.ApiResponse<Map<String, Object>> stats = connectionServiceClient.getConnectionStats(userId);
                if (stats != null && stats.isSuccess() && stats.getData() != null) {
                    totalFollowers = ((Number) stats.getData().getOrDefault("followersCount", 0)).longValue();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch connection stats for analytics: {}", e.getMessage());
            }
            
            // Fetch user's post IDs and count interactions received
            userPostIds = getUserPostIds(userId);
            totalPosts = userPostIds.size();
            if (!userPostIds.isEmpty()) {
                totalLikes = likeRepository.countByPostIdIn(userPostIds);
                totalComments = commentRepository.countByPostIdIn(userPostIds);
                totalShares = shareRepository.countByPostIdIn(userPostIds);
                totalViews = postViewRepository.countByPostIdIn(userPostIds);
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of(
                "totalLikes", totalLikes,
                "totalComments", totalComments,
                "totalShares", totalShares,
                "totalViews", totalViews,
                "totalFollowers", totalFollowers,
                "totalPosts", totalPosts
        )));
    }
    
    @SuppressWarnings("unchecked")
    private List<Long> getUserPostIds(Long userId) {
        try {
            PostServiceClient.ApiResponse<Map<String, Object>> res = postServiceClient.getUserPosts(userId, 0, 100);
            if (res != null && res.isSuccess() && res.getData() != null) {
                Object content = res.getData().get("content");
                if (content instanceof List<?> posts) {
                    return posts.stream()
                            .filter(p -> p instanceof Map)
                            .map(p -> ((Number) ((Map<String, Object>) p).get("id")).longValue())
                            .toList();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user posts for analytics: {}", e.getMessage());
        }
        return List.of();
    }

    @GetMapping("/profile-views")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProfileViews(
            @RequestParam(defaultValue = "7") int days) {
        log.info("Getting profile views for {} days", days);
        return ResponseEntity.ok(ApiResponse.success("Success",
                List.of(Map.of("date", LocalDate.now().toString(), "views", 0))));
    }

    @GetMapping("/post-performance")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPostPerformance(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "7") int days) {
        log.info("Getting post performance for {} days, user: {}", days, userId);
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        if (userId != null) {
            List<Long> postIds = getUserPostIds(userId);
            for (Long pid : postIds) {
                long likes = likeRepository.countByPostId(pid);
                long comments = commentRepository.countByPostId(pid);
                long shares = shareRepository.countByPostId(pid);
                // Fetch post content
                String content = "Post #" + pid;
                try {
                    PostServiceClient.ApiResponse<Map<String, Object>> pRes = postServiceClient.getPost(pid);
                    if (pRes != null && pRes.isSuccess() && pRes.getData() != null) {
                        Object c = pRes.getData().get("content");
                        if (c != null) content = c.toString();
                    }
                } catch (Exception e) { /* ignore */ }
                long views = postViewRepository.countByPostId(pid);
                result.add(Map.of("postId", pid, "content", content, "likes", likes,
                        "comments", comments, "shares", shares, "views", views));
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Success", result));
    }

    @GetMapping("/posts/{postId}/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPostAnalytics(@PathVariable Long postId) {
        log.info("Getting analytics for post: {}", postId);
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of(
                "postId", postId,
                "likeCount", likeRepository.countByPostId(postId),
                "commentCount", commentRepository.countByPostId(postId),
                "shareCount", shareRepository.countByPostId(postId)
        )));
    }

    @GetMapping("/followers/growth")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFollowerGrowth(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("Getting follower growth for {} days, user: {}", days, userId);
        long totalFollowers = 0;
        if (userId != null) {
            try {
                ConnectionServiceClient.ApiResponse<Map<String, Object>> stats = connectionServiceClient.getConnectionStats(userId);
                if (stats != null && stats.isSuccess() && stats.getData() != null) {
                    totalFollowers = ((Number) stats.getData().getOrDefault("followersCount", 0)).longValue();
                }
            } catch (Exception e) { log.warn("Error fetching follower count: {}", e.getMessage()); }
        }
        // Generate simulated growth data points based on actual follower count
        List<Map<String, Object>> growth = new java.util.ArrayList<>();
        java.util.Random rand = new java.util.Random(userId != null ? userId : 1);
        for (int i = days; i >= 0; i -= Math.max(1, days / 7)) {
            long simulated = Math.max(0, totalFollowers - rand.nextInt((int) Math.max(1, totalFollowers / 2 + 1)));
            growth.add(Map.of("date", LocalDate.now().minusDays(i).toString(), "followers", simulated));
        }
        if (growth.isEmpty() || !growth.get(growth.size() - 1).get("date").equals(LocalDate.now().toString())) {
            growth.add(Map.of("date", LocalDate.now().toString(), "followers", totalFollowers));
        }
        return ResponseEntity.ok(ApiResponse.success("Success", growth));
    }

    @GetMapping("/engagement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEngagement(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "7") int days) {
        log.info("Getting engagement for {} days, user: {}", days, userId);
        long totalInteractions = 0;
        double engagementRate = 0.0;
        if (userId != null) {
            List<Long> postIds = getUserPostIds(userId);
            if (!postIds.isEmpty()) {
                long likes = likeRepository.countByPostIdIn(postIds);
                long comments = commentRepository.countByPostIdIn(postIds);
                long shares = shareRepository.countByPostIdIn(postIds);
                totalInteractions = likes + comments + shares;
                engagementRate = (double) totalInteractions / postIds.size();
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Success",
                Map.of("engagementRate", Math.round(engagementRate * 100.0) / 100.0,
                        "totalInteractions", totalInteractions,
                        "period", days)));
    }

    @GetMapping("/audience")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAudienceDemographics(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        log.info("Getting audience demographics for user: {}", userId);
        long totalFollowers = 0;
        long personal = 0, creator = 0, business = 0;
        if (userId != null) {
            try {
                List<Long> followerIds = connectionServiceClient.getFollowerIds(userId);
                if (followerIds != null && !followerIds.isEmpty()) {
                    totalFollowers = followerIds.size();
                    UserServiceClient.ApiResponse<List<UserServiceClient.UserResponse>> usersRes =
                            userServiceClient.getUsersByIds(followerIds);
                    if (usersRes != null && usersRes.isSuccess() && usersRes.getData() != null) {
                        for (UserServiceClient.UserResponse u : usersRes.getData()) {
                            if (u.getUserType() == null || "PERSONAL".equalsIgnoreCase(u.getUserType())) {
                                personal++;
                            } else if ("CREATOR".equalsIgnoreCase(u.getUserType())) {
                                creator++;
                            } else if ("BUSINESS".equalsIgnoreCase(u.getUserType())) {
                                business++;
                            } else {
                                personal++;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error fetching follower demographics: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of(
                "personal", personal, "creator", creator, "business", business,
                "totalFollowers", totalFollowers, "totalAudience", totalFollowers)));
    }

    @GetMapping("/reach")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReach(
            @RequestParam(defaultValue = "7") int days) {
        log.info("Getting reach for {} days", days);
        return ResponseEntity.ok(ApiResponse.success("Success",
                List.of(Map.of("date", LocalDate.now().toString(), "reach", 0))));
    }

    @GetMapping("/impressions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getImpressions(
            @RequestParam(defaultValue = "7") int days) {
        log.info("Getting impressions for {} days", days);
        return ResponseEntity.ok(ApiResponse.success("Success",
                List.of(Map.of("date", LocalDate.now().toString(), "impressions", 0))));
    }

    @GetMapping("/best-time")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBestTimeToPost() {
        log.info("Getting best time to post");
        return ResponseEntity.ok(ApiResponse.success("Success",
                List.of(Map.of("hour", 9, "day", "Monday", "engagement", 0))));
    }

    @GetMapping("/top-posts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopPosts(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting top {} posts for user: {}", limit, userId);
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        if (userId != null) {
            List<Long> postIds = getUserPostIds(userId);
            for (Long pid : postIds) {
                long likes = likeRepository.countByPostId(pid);
                long comments = commentRepository.countByPostId(pid);
                long shares = shareRepository.countByPostId(pid);
                result.add(Map.of("postId", pid, "likes", likes, "comments", comments, "shares", shares,
                        "total", likes + comments + shares));
            }
            result.sort((a, b) -> Long.compare((long) b.get("total"), (long) a.get("total")));
            if (result.size() > limit) result = result.subList(0, limit);
        }
        return ResponseEntity.ok(ApiResponse.success("Success", result));
    }

    @GetMapping("/hashtag-performance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHashtagPerformance() {
        log.info("Getting hashtag performance");
        return ResponseEntity.ok(ApiResponse.success("Success", List.of()));
    }

    @GetMapping("/content-type")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getContentTypePerformance() {
        log.info("Getting content type performance");
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of()));
    }

    @GetMapping("/export")
    public ResponseEntity<ApiResponse<Map<String, String>>> exportAnalytics(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "csv") String format) {
        log.info("Exporting analytics for {} days in {} format", days, format);
        return ResponseEntity.ok(ApiResponse.success("Success",
                Map.of("downloadUrl", "/api/analytics/export/download", "format", format)));
    }
}
