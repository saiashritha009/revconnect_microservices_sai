package org.revature.revconnect.userservice.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String name;
    private String bio;
    private String location;
    private String website;
    private String userType;
}
