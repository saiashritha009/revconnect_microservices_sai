package org.revature.revconnect.postservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryResponse {
    private Long id;
    private Long userId;
    private String username;
    private String profilePicture;
    private String mediaUrl;
    private String caption;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean isHighlight;
    private Integer viewCount;
    private UserInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String name;
        private String profilePicture;
    }
}
