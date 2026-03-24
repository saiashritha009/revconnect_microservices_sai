package org.revature.revconnect.userservice.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    private String name;
    private String bio;
    private String location;
    private String website;
    private String profilePicture;
    private String coverPhoto;
    private String businessName;
    private String category;
    private String industry;
    private String contactInfo;
    private String businessAddress;
    private String businessHours;
    private String externalLinks;
    private String socialMediaLinks;
}
