package org.revature.revconnect.userservice.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String name;
    private String userType;
    private String bio;
    private String profilePicture;
    private String coverPhoto;
    private String location;
    private String website;
    private String privacy;
    private Boolean isVerified;
    private String businessName;
    private String category;
    private String industry;
    private String contactInfo;
    private String businessAddress;
    private LocalDateTime createdAt;
}
