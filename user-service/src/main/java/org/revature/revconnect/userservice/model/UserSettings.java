package org.revature.revconnect.userservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private Boolean emailNotifications = true;

    @Builder.Default
    private Boolean pushNotifications = true;

    @Builder.Default
    private Boolean notifyLike = true;

    @Builder.Default
    private Boolean notifyComment = true;

    @Builder.Default
    private Boolean notifyNewFollower = true;

    @Builder.Default
    private Boolean notifyConnectionRequest = true;

    @Builder.Default
    private Boolean notifyShare = true;

    @Builder.Default
    private Boolean profileVisible = true;

    @Builder.Default
    private Boolean showOnlineStatus = true;

    @Builder.Default
    private Boolean allowMessagesFromStrangers = true;

    @Builder.Default
    private String language = "en";

    @Builder.Default
    private String theme = "light";
}
