package org.revature.revconnect.interactionservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareResponse {
    private Long id;
    private Long userId;
    private String username;
    private String name;
    private String profilePicture;
    private Long postId;
    private String comment;
    private LocalDateTime createdAt;
}
