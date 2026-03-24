package org.revature.revconnect.postservice.service;

import lombok.RequiredArgsConstructor;
import org.revature.revconnect.postservice.dto.request.PostRequest;
import org.revature.revconnect.postservice.dto.response.PostResponse;
import org.revature.revconnect.postservice.enums.PostType;
import org.revature.revconnect.postservice.model.Post;
import org.revature.revconnect.postservice.repository.PostRepository;
import org.revature.revconnect.postservice.client.UserServiceClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.revature.revconnect.postservice.model.Hashtag;
import org.revature.revconnect.postservice.repository.HashtagRepository;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserServiceClient userServiceClient;
    private final org.revature.revconnect.postservice.client.ConnectionServiceClient connectionServiceClient;
    private final HashtagRepository hashtagRepository;

    @Transactional
    public PostResponse createPost(Long userId, PostRequest request) {
        Post post = Post.builder()
                .content(request.getContent() != null ? request.getContent() : "")
                .userId(userId)
                .postType(request.getPostType() != null ? PostType.valueOf(request.getPostType()) : PostType.TEXT)
                .mediaUrls(request.getMediaUrls() != null ? request.getMediaUrls() : List.of())
                .pinned(request.getPinned() != null ? request.getPinned() : false)
                .originalPostId(request.getOriginalPostId())
                .scheduledAt(request.getScheduledAt())
                .isPublished(request.getScheduledAt() == null)
                .ctaLabel(request.getCtaLabel())
                .ctaUrl(request.getCtaUrl())
                .isPromotional(request.getIsPromotional() != null ? request.getIsPromotional() : false)
                .partnerName(request.getPartnerName())
                .productTags(request.getProductTags() != null ? request.getProductTags() : List.of())
                .build();
        post = postRepository.save(post);
        extractAndSaveHashtags(post.getContent());
        PostResponse response = mapToResponse(post);
        enrichPostResponses(List.of(response));
        return response;
    }

    private void extractAndSaveHashtags(String content) {
        if (content == null || content.isEmpty()) return;
        Pattern pattern = Pattern.compile("#(\\w+)");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            String tag = matcher.group(1).toLowerCase();
            Hashtag hashtag = hashtagRepository.findByName(tag)
                    .orElseGet(() -> Hashtag.builder().name(tag).postCount(0).build());
            hashtag.setPostCount(hashtag.getPostCount() + 1);
            hashtagRepository.save(hashtag);
        }
    }

    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        PostResponse response = mapToResponse(post);
        enrichPostResponses(List.of(response));
        return response;
    }

    public Page<PostResponse> getPostsByUserId(Long userId, Pageable pageable) {
        Page<PostResponse> posts = postRepository.findByUserIdAndIsPublishedTrueOrderByCreatedAtDesc(userId, pageable).map(this::mapToResponse);
        enrichPostResponses(posts.getContent());
        return posts;
    }

    public Page<PostResponse> getFeedPosts(List<Long> followingIds, Pageable pageable) {
        Page<PostResponse> posts = postRepository.findByUserIdInAndIsPublishedTrueOrderByCreatedAtDesc(followingIds, pageable)
                .map(this::mapToResponse);
        enrichPostResponses(posts.getContent());
        return posts;
    }

    public Page<PostResponse> getTrendingPosts(Pageable pageable) {
        Page<PostResponse> posts = postRepository.findTrendingPosts(pageable).map(this::mapToResponse);
        enrichPostResponses(posts.getContent());
        return posts;
    }

    public Page<PostResponse> getPersonalizedFeed(Long userId, Pageable pageable) {
        // 1. Get IDs of users this user follows
        List<Long> followingIds = List.of();
        try {
            followingIds = connectionServiceClient.getFollowingIds(userId);
        } catch (Exception e) {
            System.err.println("Error fetching following IDs: " + e.getMessage());
        }

        // 2. Add the user's own ID to the list
        java.util.List<Long> feedUserIds = new java.util.ArrayList<>(followingIds != null ? followingIds : List.of());
        feedUserIds.add(userId);

        // 3. Fetch posts from these users (including own)
        Page<PostResponse> posts = postRepository.findByUserIdInAndIsPublishedTrueOrderByCreatedAtDesc(feedUserIds, pageable)
                .map(this::mapToResponse);

        // 4. If feed is empty, only return own posts (don't show random users' posts)
        if (posts.isEmpty() && feedUserIds.size() <= 1) {
            posts = postRepository.findByUserIdAndIsPublishedTrueOrderByCreatedAtDesc(userId, pageable)
                    .map(this::mapToResponse);
        }

        enrichPostResponses(posts.getContent());
        return posts;
    }

    public Page<PostResponse> searchPosts(String query, Pageable pageable) {
        Page<PostResponse> posts = postRepository.searchPosts(query, pageable).map(this::mapToResponse);
        enrichPostResponses(posts.getContent());
        return posts;
    }

    public List<PostResponse> getPostsByIds(List<Long> ids) {
        List<PostResponse> posts = postRepository.findAllById(ids).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
        enrichPostResponses(posts);
        return posts;
    }

    public Page<PostResponse> getAllPosts(Pageable pageable) {
        Page<PostResponse> posts = postRepository.findByIsPublishedTrueOrderByCreatedAtDesc(pageable).map(this::mapToResponse);
        enrichPostResponses(posts.getContent());
        return posts;
    }

    @Transactional
    public PostResponse updatePost(Long postId, PostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (request.getContent() != null) post.setContent(request.getContent());
        if (request.getMediaUrls() != null) post.setMediaUrls(request.getMediaUrls());
        if (request.getPinned() != null) post.setPinned(request.getPinned());
        post = postRepository.save(post);
        PostResponse response = mapToResponse(post);
        enrichPostResponses(List.of(response));
        return response;
    }

    @Transactional
    public PostResponse togglePin(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setPinned(!post.getPinned());
        post = postRepository.save(post);
        PostResponse response = mapToResponse(post);
        enrichPostResponses(List.of(response));
        return response;
    }

    public List<PostResponse> getScheduledPosts(Long userId) {
        List<PostResponse> posts = postRepository.findScheduledPostsByUserId(userId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
        enrichPostResponses(posts);
        return posts;
    }

    @Transactional
    public void deletePost(Long postId) {
        postRepository.deleteById(postId);
    }

    private PostResponse mapToResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .userId(post.getUserId())
                .authorId(post.getUserId())
                .postType(post.getPostType().name())
                .mediaUrls(post.getMediaUrls())
                .pinned(post.getPinned())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .originalPostId(post.getOriginalPostId())
                .scheduledAt(post.getScheduledAt())
                .isPublished(post.getIsPublished())
                .ctaLabel(post.getCtaLabel())
                .ctaUrl(post.getCtaUrl())
                .isPromotional(post.getIsPromotional())
                .partnerName(post.getPartnerName())
                .productTags(post.getProductTags())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private void enrichPostResponses(List<PostResponse> responses) {
        if (responses.isEmpty()) return;
        
        Set<Long> userIds = responses.stream()
                .map(PostResponse::getUserId)
                .collect(Collectors.toSet());
                
        try {
            UserServiceClient.ApiResponse<List<UserServiceClient.UserResponse>> userApiResponse = 
                userServiceClient.getUsersByIds(List.copyOf(userIds));
                
            if (userApiResponse != null && userApiResponse.isSuccess() && userApiResponse.getData() != null) {
                Map<Long, UserServiceClient.UserResponse> userMap = userApiResponse.getData().stream()
                        .collect(Collectors.toMap(UserServiceClient.UserResponse::getId, u -> u));
                        
                responses.forEach(post -> {
                    UserServiceClient.UserResponse user = userMap.get(post.getUserId());
                    if (user != null) {
                        post.setAuthorUsername(user.getUsername());
                        post.setAuthorName(user.getName());
                        post.setAuthorProfilePicture(user.getProfilePicture());
                    }
                });
            }
        } catch (Exception e) {
            // Log error and continue with partial data
            System.err.println("Error enriching posts with user data: " + e.getMessage());
        }
    }
}
