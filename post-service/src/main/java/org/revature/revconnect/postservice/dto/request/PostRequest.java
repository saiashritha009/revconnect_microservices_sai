package org.revature.revconnect.postservice.dto.request;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    private String content;
    private String postType;
    private List<String> mediaUrls;
    private Boolean pinned;
    private Long originalPostId;
    private LocalDateTime scheduledAt;
    private String ctaLabel;
    private String ctaUrl;
    private Boolean isPromotional;
    private String partnerName;
    private List<String> productTags;
}
