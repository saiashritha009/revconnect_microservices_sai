package org.revature.revconnect.userservice.dto.request;

import lombok.*;
import org.revature.revconnect.userservice.enums.BusinessCategory;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BusinessProfileRequest {
    private String businessName;
    private BusinessCategory category;
    private String description;
    private String websiteUrl;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String logoUrl;
    private String coverImageUrl;
}
