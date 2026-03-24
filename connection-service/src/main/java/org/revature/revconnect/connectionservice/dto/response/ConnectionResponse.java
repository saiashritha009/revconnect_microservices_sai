package org.revature.revconnect.connectionservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionResponse {
    private Long id;
    private Long userId;
    private String username;
    private String name;
    private String profilePicture;
    private String bio;
    private String status;
    private LocalDateTime createdAt;
}
