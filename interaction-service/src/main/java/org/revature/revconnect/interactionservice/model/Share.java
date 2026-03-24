package org.revature.revconnect.interactionservice.model;

import org.revature.revconnect.interactionservice.enums.ShareType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "shares")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Share {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Enumerated(EnumType.STRING) @Builder.Default
    private ShareType shareType = ShareType.REPOST;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
