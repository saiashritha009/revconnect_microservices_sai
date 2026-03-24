package org.revature.revconnect.postservice.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long id;
    private String content;
    private Long userId;
    private Long authorId;
    private String authorUsername;
    private String authorName;
    private String authorProfilePicture;
    private String postType;
    private List<String> mediaUrls;
    private Boolean pinned;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Long originalPostId;
    private LocalDateTime scheduledAt;
    private Boolean isPublished;
    private String ctaLabel;
    private String ctaUrl;
    private Boolean isPromotional;
    private String partnerName;
    private List<String> productTags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
